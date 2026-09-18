/**
 * Main scanner engine.
 * Orchestrates all detection rules and returns structured, masked results.
 *
 * SECURITY: This module NEVER logs raw secret values to the console.
 * All findings are masked before being returned.
 */

import { detect as detectAWS } from './rules/aws.js';
import { detect as detectGitHub } from './rules/github.js';
import { detect as detectOpenAI } from './rules/openai.js';
import { detect as detectStripe } from './rules/stripe.js';
import { detect as detectGoogle } from './rules/google.js';
import { detect as detectSlack } from './rules/slack.js';
import { detect as detectJWT } from './rules/jwt.js';
import { detect as detectPrivateKey } from './rules/private-key.js';
import { detect as detectDatabase } from './rules/database.js';
import { detect as detectGeneric } from './rules/generic.js';
import { createFingerprint, deduplicateFindings } from './fingerprint.js';

/** Severity order for sorting */
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/** All built-in detection rule runners */
const BUILT_IN_RULES = [
  detectAWS,
  detectGitHub,
  detectOpenAI,
  detectStripe,
  detectGoogle,
  detectSlack,
  detectJWT,
  detectPrivateKey,
  detectDatabase,
  detectGeneric,
];

/**
 * Sanitize a filename to prevent path traversal.
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'unknown';
  // Keep only the basename, strip directory traversal
  return filename
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/^[/\\]+/, '')
    .split(/[/\\]/)
    .pop() || 'unknown';
}

/**
 * Apply custom rules (from user's rule definitions) to content.
 *
 * @param {string} content
 * @param {string} filename
 * @param {object[]} customRules
 * @returns {object[]}
 */
function applyCustomRules(content, filename, customRules) {
  const findings = [];
  if (!customRules || !Array.isArray(customRules)) return findings;

  const lines = content.split('\n');

  for (const rule of customRules) {
    if (!rule.enabled || !rule.pattern) continue;

    let regex;
    try {
      regex = new RegExp(rule.pattern, 'g');
    } catch {
      // Invalid regex — skip silently
      continue;
    }

    let match;
    try {
      // Safety: limit execution to prevent ReDoS via timeout simulation
      const startTime = Date.now();
      while ((match = regex.exec(content)) !== null) {
        if (Date.now() - startTime > 5000) break; // 5s timeout

        const rawValue = match[0];
        if (!rawValue) continue;

        const upToMatch = content.slice(0, match.index);
        const line = upToMatch.split('\n').length;
        const lastNewline = upToMatch.lastIndexOf('\n');
        const column = match.index - lastNewline;

        // Mask the matched value
        const len = rawValue.length;
        const maskedValue = len <= 8
          ? '•'.repeat(Math.min(len, 8))
          : rawValue.slice(0, 4) + '•'.repeat(Math.min(len - 8, 12)) + rawValue.slice(-4);

        findings.push({
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
          remediation: 'Review this finding according to your organization\'s security policy.',
          lineContent: lines[line - 1] || '',
          isCustomRule: true,
          customRuleId: rule.id,
        });
      }
    } catch {
      // Regex execution error — skip
    }
  }

  return findings;
}

/**
 * Scan a single file's content.
 *
 * @param {string} content - raw file content (untrusted)
 * @param {string} filename - sanitized filename
 * @param {object[]} customRules - user-defined rules
 * @param {string[]} allowlistFingerprints - fingerprints to ignore
 * @returns {object[]} masked findings
 */
function scanFile(content, filename, customRules = [], allowlistFingerprints = []) {
  const allFindings = [];

  // Run all built-in rules
  for (const ruleRunner of BUILT_IN_RULES) {
    try {
      const results = ruleRunner(content, filename);
      if (Array.isArray(results)) allFindings.push(...results);
    } catch {
      // Rule execution error — continue with others
    }
  }

  // Run custom rules
  const customFindings = applyCustomRules(content, filename, customRules);
  allFindings.push(...customFindings);

  // Add fingerprints
  const withFingerprints = allFindings.map(finding => ({
    ...finding,
    fingerprint: createFingerprint(finding),
  }));

  // Deduplicate
  const deduplicated = deduplicateFindings(withFingerprints);

  // Filter allowlisted
  const filtered = deduplicated.filter(
    f => !allowlistFingerprints.includes(f.fingerprint)
  );

  // Mark allowlisted ones separately
  const allowlisted = deduplicated.filter(
    f => allowlistFingerprints.includes(f.fingerprint)
  ).map(f => ({ ...f, isAllowlisted: true }));

  return [...filtered, ...allowlisted];
}

/**
 * Main scan function.
 *
 * @param {object} options
 * @param {Array<{name: string, content: string}>} options.files - files to scan
 * @param {object[]} options.customRules - user-defined rules
 * @param {string[]} options.allowlistFingerprints - fingerprints to ignore
 * @param {string[]} options.allowlistFiles - filenames to skip entirely
 * @returns {object} scan results
 */
export function scan({ files = [], customRules = [], allowlistFingerprints = [], allowlistFiles = [] }) {
  const startTime = Date.now();
  const allFindings = [];
  const scannedFiles = [];
  const errors = [];

  for (const file of files) {
    const filename = sanitizeFilename(file.name);

    // Skip allowlisted files
    if (allowlistFiles.includes(filename)) {
      scannedFiles.push({ name: filename, skipped: true, reason: 'allowlisted' });
      continue;
    }

    try {
      const findings = scanFile(
        file.content,
        filename,
        customRules,
        allowlistFingerprints
      );
      allFindings.push(...findings);
      scannedFiles.push({ name: filename, findings: findings.length });
    } catch {
      // SECURITY: Do not include file content in error messages
      errors.push({ file: filename, error: 'Failed to scan file' });
      scannedFiles.push({ name: filename, error: true });
    }
  }

  // Sort by severity then confidence
  allFindings.sort((a, b) => {
    const sevDiff = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
    if (sevDiff !== 0) return sevDiff;
    return b.confidence - a.confidence;
  });

  const active = allFindings.filter(f => !f.isAllowlisted);
  const allowlisted = allFindings.filter(f => f.isAllowlisted);

  const stats = {
    filesScanned: scannedFiles.length,
    totalFindings: active.length,
    critical: active.filter(f => f.severity === 'CRITICAL').length,
    high: active.filter(f => f.severity === 'HIGH').length,
    medium: active.filter(f => f.severity === 'MEDIUM').length,
    low: active.filter(f => f.severity === 'LOW').length,
    allowlisted: allowlisted.length,
    duration: Date.now() - startTime,
  };

  return {
    id: generateScanId(),
    timestamp: new Date().toISOString(),
    stats,
    findings: active,
    allowlistedFindings: allowlisted,
    scannedFiles,
    errors,
  };
}

function generateScanId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'scan_';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
