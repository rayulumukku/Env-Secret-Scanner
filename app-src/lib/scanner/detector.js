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

import { maskSecret, maskSecretInLine, createMaskedContext } from './masking.js';
import {
  detectLanguage,
  evaluateEntropy,
  extractLanguageContext,
  analyzeContextSignals,
  analyzeFalsePositive,
  calculateConfidence,
  generateQuickFix,
} from './intelligence/index.js';

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

  // 1. Language & File Role Intelligence
  const fileRole = detectLanguage(filename, lines.slice(0, 10).join('\n'));

  // 2. Multi-factor Entropy Analysis
  const entropyEval = evaluateEntropy(rawValue, {
    threshold: rule.entropyThreshold ?? 3.5,
    minLength: rule.minLength ?? 8,
  });

  if (rule.requireHighEntropy && !entropyEval.isHighEntropy) return null;
  if (rule.minEntropy && entropyEval.entropy < rule.minEntropy && rawValue.length < 32) return null;

  // 3. Deterministic False Positive Analysis
  const fpEval = analyzeFalsePositive(rawValue, {
    line: lineText,
    filename,
    envRisk: fileRole.envRisk,
  });

  // Hard skip if placeholder or template pattern
  if (fpEval.isFalsePositive) return null;

  // 4. Language-Aware Syntactic Context
  const langCtx = extractLanguageContext(lineText, fileRole.language);
  const contextSignals = analyzeContextSignals({
    line: lineText,
    surrounding: getSurroundingText(lines, lineIdx),
    language: fileRole.language,
  });

  // 5. Masking
  const maskedValue = maskSecret(rawValue, rule.maskOptions ?? {});
  const maskedLineText = maskSecretInLine(lineText, rawValue);

  // 6. Confidence Scoring & Explainability
  const confResult = calculateConfidence({
    isProviderRule: rule.isProviderRule ?? false,
    contextSignals,
    entropySignals: entropyEval.signals,
    falsePositiveSignals: fpEval.signals,
    fileRole,
    rule,
  });

  // Skip very-low-confidence findings (likely FP)
  if (confResult.confidence < 20) return null;

  // 7. Developer Quick Fix Suggestions
  const quickFix = generateQuickFix(
    { variableName: langCtx.variableName, type: rule.type, ruleId: rule.id, maskedValue },
    fileRole.language
  );

  // 8. Masked Context Lines
  const context = createMaskedContext(lines, line, rawValue);

  return {
    id: null, // assigned by engine
    ruleId: rule.id ?? rule.type,
    type: rule.type,
    name: rule.name,
    category: rule.category,
    severity: confResult.severity,
    confidence: confResult.confidence,
    file: filename,
    line,
    column,
    maskedValue,
    description: rule.description,
    remediation: rule.remediation,
    signals: confResult.signals,
    whyDetected: confResult.whyDetected,
    quickFix,
    language: fileRole.language,
    variableName: langCtx.variableName || null,
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
