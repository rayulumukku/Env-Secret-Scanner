/**
 * engine.js — Main scanner engine.
 *
 * Pipeline per file:
 *   1. File filtering (skip binary, excluded dirs, oversized)
 *   2. Provider-specific rules
 *   3. Generic rules
 *   4. Custom rules
 *   5. Deduplication
 *   6. Allowlist filtering
 *   7. Sort by severity + confidence
 *
 * SECURITY:
 *   - Raw secret values never leave the detector module.
 *   - No raw secrets are logged, stored, or returned.
 *   - All findings contain only maskedValue.
 */

import { RULES as awsRules }          from './rules/aws.js';
import { RULES as githubRules }        from './rules/github.js';
import { RULES as openaiRules }        from './rules/openai.js';
import { RULES as stripeRules }        from './rules/stripe.js';
import { RULES as googleRules }        from './rules/google.js';
import { RULES as slackRules }         from './rules/slack.js';
import { RULES as jwtRules }           from './rules/jwt.js';
import { RULES as privateKeyRules }    from './rules/private-key.js';
import { RULES as databaseRules }      from './rules/database.js';
import { RULES as npmRules }           from './rules/npm.js';
import { RULES as bearerRules }        from './rules/bearer-token.js';
import { RULES as genericApiKeyRules } from './rules/generic-api-key.js';
import { RULES as genericPasswordRules } from './rules/generic-password.js';

import { runRules }                    from './detector.js';
import { createFingerprint, deduplicateFindings } from './fingerprint.js';
import { shouldScanFile }              from './file-filter.js';
import { maskSecret, maskSecretInLine } from './masking.js';

/** Severity order for sorting */
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/** All provider-specific rule sets (run first) */
const PROVIDER_RULES = [
  ...awsRules,
  ...githubRules,
  ...openaiRules,
  ...stripeRules,
  ...googleRules,
  ...slackRules,
  ...jwtRules,
  ...privateKeyRules,
  ...databaseRules,
  ...npmRules,
];

/** Generic / lower-specificity rules (run second) */
const GENERIC_RULES = [
  ...bearerRules,
  ...genericApiKeyRules,
  ...genericPasswordRules,
];

/** All rules combined */
const ALL_BUILTIN_RULES = [...PROVIDER_RULES, ...GENERIC_RULES];

// ── ID GENERATOR ────────────────────────────────────────────────────────────

let _idCounter = 0;
function generateFindingId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `f_${rand}_${++_idCounter}`;
}

function generateScanId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `scan_${rand}`;
}

// ── FILENAME SANITIZER ──────────────────────────────────────────────────────

/**
 * Sanitize a filename to prevent path traversal.
 * Preserves path structure but strips .. components.
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'unknown';
  return filename
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/^[/\\]+/, '')
    .split(/[/\\]/)
    .filter(p => p && p !== '..') // remove any remaining .. components
    .join('/') || 'unknown';
}

// ── CUSTOM RULE RUNNER ──────────────────────────────────────────────────────

import { validateRegexSafety, safeRegexExec } from './regex-safety.js';
import { groupSimilarFindings } from './intelligence/similarity.js';

/**
 * Apply user-defined custom rules to file content.
 * SECURITY: Never log or store rawValue outside this function.
 *
 * @param {string} content
 * @param {string} filename
 * @param {object[]} customRules
 * @returns {object[]} findings
 */
function applyCustomRules(content, filename, customRules) {
  const findings = [];
  if (!Array.isArray(customRules) || customRules.length === 0) return findings;

  const lines = content.split('\n');

  for (const rule of customRules) {
    if (!rule.enabled || !rule.pattern) continue;

    const validation = validateRegexSafety(rule.pattern, 'g');
    if (!validation.valid || !validation.safeRegex) continue;

    const matches = safeRegexExec(validation.safeRegex, content, 2000);

    for (const match of matches) {
      const rawValue = match[0];
      if (!rawValue || rawValue.length < 4) continue;

      const upToMatch = content.slice(0, match.index);
      const lineIdx = upToMatch.split('\n').length - 1;
      const lastNewline = upToMatch.lastIndexOf('\n');
      const column = match.index - lastNewline;
      const line = lineIdx + 1;

      // SECURITY: mask immediately
      const len = rawValue.length;
      const maskedValue = len <= 8
        ? '•'.repeat(Math.min(len, 8))
        : rawValue.slice(0, 4) + '•'.repeat(Math.min(len - 8, 12)) + rawValue.slice(-4);

      const lineText = lines[lineIdx] || '';
      const maskedLineText = maskSecretInLine(lineText, rawValue);

      findings.push({
        id: generateFindingId(),
        ruleId: `CUSTOM_${rule.id || 'RULE'}`,
        type: `CUSTOM_${rule.id || 'RULE'}`,
        name: rule.name || 'Custom Rule',
        category: rule.category || 'Custom',
        severity: rule.severity || 'MEDIUM',
        confidence: 75,
        line,
        column,
        file: filename,
        maskedValue,
        description: rule.description || 'Custom rule match.',
        remediation: rule.remediation || 'Review according to your organization\'s security policy.',
        signals: [{ label: 'Custom rule match', score: 75, positive: true }],
        whyDetected: ['Matches user-defined custom rule pattern'],
        lineTextMasked: maskedLineText,
        contextLines: [],
        isCustomRule: true,
        customRuleId: rule.id,
      });
    }
  }

  return findings;
}

// ── SINGLE FILE SCAN ────────────────────────────────────────────────────────

/**
 * Scan a single file's content through the full pipeline.
 *
 * @param {string} content
 * @param {string} filename - already sanitized
 * @param {object[]} customRules
 * @param {string[]} allowlistFingerprints
 * @returns {{ findings: object[], skipped: false } | { skipped: true, reason: string }}
 */
function scanFile(content, filename, customRules = [], allowlistFingerprints = []) {
  // File filter check
  const filterResult = shouldScanFile({ name: filename, content });
  if (filterResult.skip) {
    return { skipped: true, reason: filterResult.reason };
  }

  // Run all built-in rules through the unified detector
  let allFindings = runRules(ALL_BUILTIN_RULES, content, filename);

  // Run custom rules
  const customFindings = applyCustomRules(content, filename, customRules);
  allFindings = [...allFindings, ...customFindings];

  // Assign IDs and fingerprints
  allFindings = allFindings.map(finding => ({
    ...finding,
    id: finding.id || generateFindingId(),
    fingerprint: createFingerprint(finding),
  }));

  // Deduplicate
  const deduplicated = deduplicateFindings(allFindings);

  // Separate active vs allowlisted
  const active = deduplicated.filter(f => !allowlistFingerprints.includes(f.fingerprint));
  const allowlisted = deduplicated
    .filter(f => allowlistFingerprints.includes(f.fingerprint))
    .map(f => ({ ...f, isAllowlisted: true }));

  return { findings: [...active, ...allowlisted], skipped: false };
}

// ── MAIN SCAN FUNCTION ──────────────────────────────────────────────────────

/**
 * Main scan entry point.
 *
 * @param {object} options
 * @param {Array<{name:string, content:string}>} options.files
 * @param {object[]} options.customRules
 * @param {string[]} options.allowlistFingerprints
 * @param {string[]} options.allowlistFiles
 * @returns {object} scan result
 */
export function scan({ files = [], customRules = [], allowlistFingerprints = [], allowlistFiles = [] }) {
  const startTime = Date.now();
  const allFindings = [];
  const scannedFiles = [];
  const errors = [];
  const skippedFiles = [];

  for (const file of files) {
    const filename = sanitizeFilename(file.name || 'unknown');

    // Skip explicitly allowlisted files
    if (allowlistFiles.includes(filename)) {
      skippedFiles.push({ name: filename, reason: 'allowlisted' });
      continue;
    }

    try {
      const result = scanFile(file.content, filename, customRules, allowlistFingerprints);

      if (result.skipped) {
        skippedFiles.push({ name: filename, reason: result.reason });
        continue;
      }

      allFindings.push(...result.findings);
      scannedFiles.push({ name: filename, findings: result.findings.length });
    } catch {
      // SECURITY: never include file content in error messages
      errors.push({ file: filename, error: 'Failed to scan file' });
      scannedFiles.push({ name: filename, error: true });
    }
  }

  // Sort: severity first, then confidence descending
  allFindings.sort((a, b) => {
    const sevDiff = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
    if (sevDiff !== 0) return sevDiff;
    return b.confidence - a.confidence;
  });

  const active = allFindings.filter(f => !f.isAllowlisted);
  const allowlisted = allFindings.filter(f => f.isAllowlisted);
  const duration = Date.now() - startTime;

  // Check .gitignore status for exposed .env files
  const gitignoreFile = files.find(f => (f.name || '').endsWith('.gitignore'));
  const gitignoreContent = gitignoreFile?.content || '';
  const ignoresEnv = /^\.env(\*|\.|$|\/)/m.test(gitignoreContent) || /^\*\.env/m.test(gitignoreContent);

  for (const f of active) {
    if ((f.file || '').includes('.env') && !(f.file || '').includes('.example')) {
      f.isGitTrackedRisk = true;
      f.isGitIgnored = ignoresEnv;
      f.gitIgnoreStatus = ignoresEnv ? 'IGNORED' : 'NOT_IGNORED';
      if (!ignoresEnv) {
        f.gitIgnoreWarning = 'Exposed .env file is not listed in .gitignore. Add .env to .gitignore immediately.';
      }
    }
  }

  // Collapse into parent secret groups (1 secret -> multiple occurrences)
  const groupedFindings = groupSimilarFindings(active);

  const statistics = {
    filesScanned: scannedFiles.length,
    filesSkipped: skippedFiles.length,
    totalFindings: active.length,
    totalSecrets: groupedFindings.length,
    critical: active.filter(f => f.severity === 'CRITICAL').length,
    high: active.filter(f => f.severity === 'HIGH').length,
    medium: active.filter(f => f.severity === 'MEDIUM').length,
    low: active.filter(f => f.severity === 'LOW').length,
    allowlisted: allowlisted.length,
    duration,
    rulesRan: ALL_BUILTIN_RULES.length,
  };

  return {
    scanId: generateScanId(),
    status: 'completed',
    timestamp: new Date().toISOString(),
    duration,
    filesScanned: scannedFiles.length,
    statistics,
    // Keep stats as alias for backwards compat with existing UI
    stats: statistics,
    findings: active,
    groupedFindings,
    allowlistedFindings: allowlisted,
    scannedFiles,
    skippedFiles,
    errors,
  };
}

export function scanString(content, filename = 'inline', options = {}) {
  return scan({ files: [{ name: filename, content }], ...options });
}

export const scanSync = scan;
export { runRules as detectInContent };

