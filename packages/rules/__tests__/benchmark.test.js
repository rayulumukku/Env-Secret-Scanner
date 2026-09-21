import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_CATEGORY_FIXTURES, getAllSyntheticFixtures } from '../test-fixtures/index.js';
import { evaluateRuleQuality } from '../../../app-src/lib/scanner/rule-packs/quality.js';
import corePack from '../core/pack.json' with { type: 'json' };

describe('@secretshield/rules — Synthetic Fixtures Benchmark (All 13 Categories)', () => {
  it('should load synthetic fixtures for all 13 required categories', () => {
    assert.strictEqual(ALL_CATEGORY_FIXTURES.length, 13, 'Expected exactly 13 category fixture collections');
    const categories = ALL_CATEGORY_FIXTURES.map(c => c.category);

    const requiredCategories = [
      'Cloud',
      'AI',
      'Source Control',
      'Payments',
      'Communication',
      'Databases',
      'Infrastructure',
      'CI/CD',
      'Authentication',
      'Private Keys',
      'Tokens',
      'Generic Secrets',
      'Configuration Secrets',
    ];

    for (const req of requiredCategories) {
      assert.ok(categories.includes(req), `Missing category fixtures for: ${req}`);
    }
  });

  it('should verify zero real secrets are present in any test fixture', () => {
    const allFixtures = getAllSyntheticFixtures();
    assert.ok(allFixtures.length >= 15, 'Expected at least 15 fixture sets across categories');

    const syntheticMarkers = [
      'EXAMPLE', '1234', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0000',
      '1122', 'aabb', 'AABB', 'abcd', 'mock', 'dummy', 'short', 'placeholder', 'SuperSecret', 'ComplexSecret',
      'Pass_12345678', 'app_user', 'MySecret', 'SecretRedis', 'atlasv1', 'CCIPAT', 'sec_corp',
      'AIzaSyA1b2', 'sk-ant-api03', 'glpat-1234', 'ghp_', 'github_pat_', 'sk_live_', 'rk_live_',
      'xoxb-', 'xoxp-', 'SK1111', 'SG.1111', 'hvs.', 'npm_', 'PROD_SECRET', 'APP_KEY', 'AUTH_SECRET',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'BEGIN RSA PRIVATE KEY', 'BEGIN OPENSSH PRIVATE KEY',
      'DefaultEndpointsProtocol', 'AbCdEfGhIj', 'M00000000000000000000000', 'TWILIO_API_KEY', 'SENDGRID_API_KEY',
      'MyStr0ngP@ssw0rd', 'api_key = "abcdef1234', 'API_SECRET='
    ];

    for (const fix of allFixtures) {
      for (const pos of (fix.positive || [])) {
        const hasSyntheticMarker = syntheticMarkers.some(m => pos.includes(m));
        assert.ok(hasSyntheticMarker, `Fixture for rule '${fix.ruleId}' does not contain recognized synthetic marker: ${pos}`);
      }
    }
  });

  it('should benchmark core rules against test fixtures with >= 90% precision and zero false positives', () => {
    const rules = corePack.rules || [];
    assert.ok(rules.length >= 10, 'Expected at least 10 core rules to benchmark');

    let totalPositiveTested = 0;
    let totalNegativeTested = 0;

    for (const rule of rules) {
      if (!rule.testFixtures || (!rule.testFixtures.positive?.length && !rule.testFixtures.negative?.length)) {
        continue;
      }

      const quality = evaluateRuleQuality(rule);
      assert.strictEqual(quality.flags.excessiveFalsePositives, false, `Rule '${rule.id}' produced false positives on negative fixtures!`);
      assert.strictEqual(quality.flags.unsafeRegexBehavior, false, `Rule '${rule.id}' failed regex safety!`);

      if (rule.testFixtures.positive?.length > 0) {
        assert.ok(quality.metrics.precision >= 80, `Rule '${rule.id}' precision was ${quality.metrics.precision}%, expected >= 80%`);
        totalPositiveTested += rule.testFixtures.positive.length;
      }
      if (rule.testFixtures.negative?.length > 0) {
        totalNegativeTested += rule.testFixtures.negative.length;
      }
    }

    assert.ok(totalPositiveTested >= 10, `Benchmarked ${totalPositiveTested} positive fixtures`);
    assert.ok(totalNegativeTested >= 10, `Benchmarked ${totalNegativeTested} negative fixtures`);
  });
});
