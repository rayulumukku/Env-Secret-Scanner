import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRuleQuality } from '../../../app-src/lib/scanner/rule-packs/quality.js';

describe('@secretshield/rules — Rule Quality & Benchmark Evaluation', () => {
  it('should evaluate quality metrics correctly for a well-formed rule with test fixtures', () => {
    const testRule = {
      id: 'test-aws-rule',
      version: '1.0.0',
      patterns: ['AKIA[0-9A-Z]{16}'],
      excludePatterns: ['AKIAIOSFODNN7EXAMPLE'],
      testFixtures: {
        positive: [
          'AWS_ACCESS_KEY_ID=AKIAEXAMPLEKEY123456',
          'const key = "AKIA1111222233334444";',
        ],
        negative: [
          'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
          'const dummy = "NOT_A_KEY";',
        ],
      },
    };

    const report = evaluateRuleQuality(testRule);

    assert.strictEqual(report.ruleId, 'test-aws-rule');
    assert.strictEqual(report.status, 'PASSING');
    assert.strictEqual(report.metrics.truePositives, 2);
    assert.strictEqual(report.metrics.falsePositives, 0);
    assert.strictEqual(report.metrics.precision, 100.0);
    assert.strictEqual(report.metrics.recall, 100.0);
    assert.strictEqual(report.flags.excessiveFalsePositives, false);
    assert.strictEqual(report.flags.unsafeRegexBehavior, false);
  });

  it('should flag rules with false positives on negative fixtures', () => {
    const overBroadRule = {
      id: 'overbroad-rule',
      version: '1.0.0',
      patterns: ['.*'], // Matches everything
      testFixtures: {
        positive: ['REAL_TOKEN_12345'],
        negative: ['BENIGN_SAMPLE_CODE'],
      },
    };

    const report = evaluateRuleQuality(overBroadRule);
    assert.strictEqual(report.status, 'NEEDS_ATTENTION');
    assert.strictEqual(report.flags.excessiveFalsePositives, true);
    assert.strictEqual(report.metrics.falsePositives, 1);
  });
});
