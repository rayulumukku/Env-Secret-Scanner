/**
 * detector.js — Unified rule execution orchestrator.
 *
 * Every built-in rule exports a RULES array of rule objects.
 * This module:
 *   1. Runs each rule's pattern against the file content
 *   2. Extracts the matched value
 *   3. Calls context analysis
 *   4. Calls confidence scoring
 *   5. Applies masking
 *   6. Returns structured findings (no raw secrets)
 *
 * SECURITY: Raw secret values are ONLY used locally to compute
 * maskedValue and entropy. They are never stored or returned.
 */

import { shannonEntropy, isHighEntropySecret } from './entropy.js';
import { maskSecret, maskSecretInLine, createMaskedContext } from './masking.js';
import { isPlaceholder, analyseContext } from './context.js';
import { buildConfidence } from './confidence.js';
import { SENSITIVE_FILE_PATTERNS } from './context.js';

/**
 * Get the surrounding text (a few lines) around a line number.
 * @param {string[]} lines
 * @param {number} lineIndex - 0-indexed
 * @param {number} radius
 * @returns {string}
 */
function getSurroundingText(lines, lineIndex, radius = 3) {
  const start = Math.max(0, lineIndex - radius);
  const end = Math.min(lines.length - 1, lineIndex + radius);
  return lines.slice(start, end + 1).join('\n');
}

/**
 * Check if a line is inside a comment.
 * @param {string} line
 * @returns {boolean}
 */
function isInComment(line) {
  return /^\s*(\/\/|#|\/\*|\*|<!--)/.test(line);
}

/**
 * Check if an assignment pattern exists (= or : before the value).
 * @param {string} line
 * @returns {boolean}
 */
function hasSuspiciousAssignment(line) {
  return /(?:=|:)\s*['"`]?[A-Za-z0-9+/\-_]{10,}/.test(line);
}

/**
 * Check if the filename is sensitive.
 * @param {string} filename
 * @returns {boolean}
 */
function isSensitiveFile(filename) {
  return SENSITIVE_FILE_PATTERNS.some(p => p.test(filename));
}

/**
 * Check if a variable name in the line is secret-related.
 * @param {string} line
 * @returns {boolean}
 */
function hasSecretVarName(line) {
  const secretKeywords = [
    'secret', 'password', 'passwd', 'pwd', 'token', 'apikey',
    'api_key', 'private_key', 'auth', 'credential', 'access_key',
    'client_secret', 'signing_key', 'webhook', 'refresh_token',
  ];
  const lower = line.toLowerCase();
  return secretKeywords.some(kw => {
    const varMatch = line.match(/(?:const|let|var|export)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*[=:]/);
    if (varMatch) return varMatch[1].toLowerCase().includes(kw);
    return lower.includes(kw + ' =') || lower.includes(kw + '=') || lower.includes(kw + ':');
  });
}

/**
 * Run a single rule against file content and return raw match data.
 * @param {object} rule - rule definition object
 * @param {string} content - file content
 * @param {string[]} lines - content split by lines
 * @returns {Array<{rawValue, matchIndex, line, column, lineText}>}
 */
function runRulePattern(rule, content, lines) {
  const matches = [];
  if (!rule.pattern) return matches;

  const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
  let match;

  const start = Date.now();
  while ((match = regex.exec(content)) !== null) {
    // ReDoS guard
    if (Date.now() - start > 3000) break;

    const rawValue = (rule.captureGroup != null) ? match[rule.captureGroup] : match[0];
    if (!rawValue || rawValue.length < 6) continue;

    const upToMatch = content.slice(0, match.index);
    const lineIdx = upToMatch.split('\n').length - 1;
    const lastNewline = upToMatch.lastIndexOf('\n');
    const column = match.index - lastNewline;

    matches.push({
      rawValue,
      fullMatch: match[0],
      matchIndex: match.index,
      lineIdx,
      line: lineIdx + 1,
      column,
      lineText: lines[lineIdx] || '',
    });
  }

  return matches;
}

/**
 * Process a single rule match into a finding.
 * SECURITY: rawValue is used only for masking+entropy, never stored or returned.
 *
 * @param {object} rule
 * @param {object} matchData - output from runRulePattern
 * @param {string[]} lines
 * @param {string} filename
 * @returns {object|null} finding or null if filtered
 */
function processMatch(rule, matchData, lines, filename) {
  const { rawValue, line, column, lineText, lineIdx } = matchData;

  // ── ENTROPY ANALYSIS ────────────────────────────────────────────────
  const { isHighEntropy: highE, entropy } = isHighEntropySecret(rawValue, {
    threshold: rule.entropyThreshold ?? 3.5,
    minLength: rule.minLength ?? 8,
  });
  const isVeryHighEntropy = entropy >= 5.0;

  // Provider rules may require entropy
  if (rule.requireHighEntropy && !highE) return null;
  if (rule.minEntropy && entropy < rule.minEntropy && rawValue.length < 32) return null;

  // ── PLACEHOLDER CHECK ────────────────────────────────────────────────
  const placeholder = isPlaceholder(rawValue);

  // Hard skip if placeholder AND low-specificity rule
  if (placeholder && !rule.isProviderRule) return null;

  // ── MASKING ─────────────────────────────────────────────────────────
  // SECURITY: mask immediately, only masked value survives beyond this point
  const maskedValue = maskSecret(rawValue, rule.maskOptions ?? {});
  const maskedLineText = maskSecretInLine(lineText, rawValue);
  const surrounding = getSurroundingText(lines, lineIdx);

  // ── CONFIDENCE SCORING ───────────────────────────────────────────────
  const lineWithoutVal = lineText.toLowerCase().replace(rawValue.toLowerCase(), '');
  const surroundingWithoutVal = surrounding.toLowerCase().replace(rawValue.toLowerCase(), '');
  const docKeywords = ['example', 'sample', 'placeholder', 'documentation', 'readme', 'tutorial', 'demo', 'fake', 'dummy'];
  const isDocCtx = docKeywords.some(kw =>
    new RegExp(`\\b${kw}\\b`, 'i').test(lineWithoutVal) || new RegExp(`\\b${kw}\\b`, 'i').test(surroundingWithoutVal)
  );

  const testFilePats = [/\.(test|spec)\.[jt]sx?$/i, /_test\.(go|py|rb)$/i, /\/tests?\//i, /\/spec\//i];
  const isTestF = testFilePats.some(p => p.test(filename));

  const { confidence, severity, signals } = buildConfidence({
    baseScore: rule.isProviderRule ? 40 : 50,
    isProviderRule: rule.isProviderRule ?? false,
    hasSecretVarName: hasSecretVarName(lineText),
    isHighEntropy: highE,
    isVeryHighEntropy,
    entropy,
    hasSuspiciousAssignment: hasSuspiciousAssignment(lineText),
    isSensitiveFile: isSensitiveFile(filename),
    hasNearbyKeyword: false,
    isPlaceholder: placeholder,
    isDocContext: isDocCtx,
    isTestFile: isTestF,
    isDummyValue: false,
    isInComment: isInComment(lineText),
    extraSignals: rule.extraSignals ?? [],
  });

  const finalConfidence = Math.max(0, Math.min(100, confidence));
  const finalSeverity = rule.isProviderRule
    ? (finalConfidence < 20 ? 'LOW' : rule.severity)  // provider rules keep their severity unless clearly FP
    : severity;

  // Skip very-low-confidence findings (likely FP)
  if (finalConfidence < 20) return null;

  // ── MASKED CONTEXT ───────────────────────────────────────────────────
  const context = createMaskedContext(lines, line, rawValue);

  return {
    id: null, // assigned by engine
    ruleId: rule.id ?? rule.type,
    type: rule.type,
    name: rule.name,
    category: rule.category,
    severity: finalSeverity,
    confidence: finalConfidence,
    file: filename,
    line,
    column,
    maskedValue,
    description: rule.description,
    remediation: rule.remediation,
    signals,
    lineTextMasked: maskedLineText,
    contextLines: context.lines,
  };
}

/**
 * Run all provided rules against file content.
 *
 * @param {object[]} rules - array of rule definition objects
 * @param {string} content - file content (untrusted input)
 * @param {string} filename - sanitized filename
 * @returns {object[]} findings (no raw secrets)
 */
export function runRules(rules, content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of rules) {
    if (!rule.pattern) continue;

    const matches = runRulePattern(rule, content, lines);
    for (const matchData of matches) {
      try {
        const finding = processMatch(rule, matchData, lines, filename);
        if (finding) findings.push(finding);
      } catch {
        // Never crash the pipeline on a single rule match failure
      }
    }
  }

  return findings;
}
