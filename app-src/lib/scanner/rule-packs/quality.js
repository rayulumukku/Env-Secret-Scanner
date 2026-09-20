/**
 * lib/scanner/rule-packs/quality.js
 *
 * Automated Rule Quality Assessment & Factual Benchmark Metrics.
 *
 * INVARIANT: Never exposes fabricated "best rule" rankings; displays strictly factual metrics.
 */

import { validateRegexSafety } from '../../../../packages/rules/src/schema.js';

/**
 * Assess the quality and performance of a single rule using its declared test fixtures.
 *
 * @param {object} rule
 * @returns {object} Factual quality metrics
 */
export function evaluateRuleQuality(rule) {
  const patterns = Array.isArray(rule.patterns) ? rule.patterns : (rule.pattern ? [rule.pattern] : []);
  const regexes = [];
  for (const pat of patterns) {
    try {
      let patStr = typeof pat === 'string' ? pat : pat?.regex || '';
      let flags = '';
      if (patStr.startsWith('(?i)')) {
        patStr = patStr.slice(4);
        flags = 'i';
      }
      regexes.push(new RegExp(patStr, flags));
    } catch {
      // invalid regex
    }
  }

  const excludes = (rule.excludePatterns || rule.exclusions || rule.excludes || []).map(p => {
    try {
      let patStr = typeof p === 'string' ? p : p?.regex || '';
      let flags = '';
      if (patStr.startsWith('(?i)')) {
        patStr = patStr.slice(4);
        flags = 'i';
      }
      return new RegExp(patStr, flags);
    } catch {
      return null;
    }
  }).filter(Boolean);

  const testMatch = (sample) => {
    const matched = regexes.some(r => r.test(sample));
    if (!matched) return false;
    if (excludes.some(r => r.test(sample))) return false;
    return true;
  };

  const { positive = [], negative = [] } = rule.testFixtures || {};

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  const startBenchmark = performance.now();
  const iterations = 50;

  // Run positive fixtures
  for (const sample of positive) {
    let matched = false;
    for (let i = 0; i < iterations; i++) {
      matched = testMatch(sample);
    }
    if (matched) {
      truePositives++;
    } else {
      falseNegatives++;
    }
  }

  // Run negative fixtures
  for (const sample of negative) {
    let matched = false;
    for (let i = 0; i < iterations; i++) {
      matched = testMatch(sample);
    }
    if (matched) {
      falsePositives++;
    } else {
      trueNegatives++;
    }
  }

  const durationMs = Number(((performance.now() - startBenchmark) / (Math.max(1, (positive.length + negative.length) * iterations))).toFixed(3));

  const totalPositive = positive.length || 1;
  const totalNegative = negative.length || 1;

  const precision = (truePositives + falsePositives) > 0
    ? Number(((truePositives / (truePositives + falsePositives)) * 100).toFixed(1))
    : 100.0;

  const recall = (truePositives + falseNegatives) > 0
    ? Number(((truePositives / (truePositives + falseNegatives)) * 100).toFixed(1))
    : 100.0;

  // Regex complexity analysis
  let maxPatternLength = 0;
  let hasQuantifiers = false;
  for (const pat of patterns) {
    const str = typeof pat === 'string' ? pat : pat?.regex || '';
    if (str.length > maxPatternLength) maxPatternLength = str.length;
    if (/[\*\+\?]/.test(str)) hasQuantifiers = true;
  }

  const safetyCheck = validateRegexSafety(patterns[0] || '');

  // Quality Flags
  const flags = {
    excessiveFalsePositives: falsePositives > 0,
    excessiveRuntime: durationMs > 15.0,
    unsafeRegexBehavior: !safetyCheck.safe,
    insufficientNegativeFixtures: negative.length < 2,
    insufficientPositiveFixtures: positive.length < 1,
  };

  const isPassing = !flags.excessiveFalsePositives && !flags.unsafeRegexBehavior && !flags.insufficientPositiveFixtures;

  return {
    ruleId: rule.id,
    version: rule.version || '1.0.0',
    status: isPassing ? 'PASSING' : 'NEEDS_ATTENTION',
    metrics: {
      truePositives,
      totalPositiveFixtures: positive.length,
      falsePositives,
      totalNegativeFixtures: negative.length,
      precision,
      recall,
      avgExecutionTimeMs: durationMs,
      patternLength: maxPatternLength,
      entropyRequired: Boolean(rule.entropy),
      contextRequired: Boolean(rule.keywords && rule.keywords.length > 0),
    },
    flags,
  };
}

/**
 * Evaluate quality of all rules within a Rule Pack manifest.
 * @param {object} manifest
 * @returns {object} Pack quality summary
 */
export function evaluatePackQuality(manifest) {
  const ruleReports = (manifest.rules || []).map(r => evaluateRuleQuality(r));
  const passingCount = ruleReports.filter(r => r.status === 'PASSING').length;
  const totalRules = ruleReports.length;

  return {
    packId: manifest.id,
    version: manifest.version,
    totalRules,
    passingRules: passingCount,
    healthScore: totalRules > 0 ? Math.round((passingCount / totalRules) * 100) : 100,
    ruleReports,
  };
}
