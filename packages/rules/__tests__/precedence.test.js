import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sortRulesByPrecedence,
  deduplicateFindingsByPrecedence,
  PRECEDENCE_TIERS,
} from '../../../app-src/lib/scanner/rule-packs/precedence.js';

describe('@secretshield/rules — Precedence Hierarchy & Finding Deduplication', () => {
  it('should sort rules according to 5-tier precedence order', () => {
    const rules = [
      { id: 'local-rule', tier: 'LOCAL_CUSTOM' },
      { id: 'core-rule', tier: 'CORE' },
      { id: 'org-rule', tier: 'ORGANIZATION' },
      { id: 'project-rule', tier: 'PROJECT' },
      { id: 'repo-rule', tier: 'REPOSITORY' },
    ];

    const sorted = sortRulesByPrecedence(rules);

    assert.strictEqual(sorted[0].id, 'core-rule');
    assert.strictEqual(sorted[1].id, 'org-rule');
    assert.strictEqual(sorted[2].id, 'project-rule');
    assert.strictEqual(sorted[3].id, 'repo-rule');
    assert.strictEqual(sorted[4].id, 'local-rule');
  });

  it('should deduplicate multiple findings matching the same secret span, preferring higher precedence', () => {
    const findings = [
      {
        id: 'f_custom_1',
        ruleId: 'CUSTOM_GENERIC_KEY',
        file: 'config.js',
        line: 12,
        maskedValue: 'AKIA••••••••MPLE',
        fingerprint: 'fp_same_token_123',
        tier: 'LOCAL_CUSTOM',
        severity: 'MEDIUM',
      },
      {
        id: 'f_core_1',
        ruleId: 'aws-access-key-id',
        file: 'config.js',
        line: 12,
        maskedValue: 'AKIA••••••••MPLE',
        fingerprint: 'fp_same_token_123',
        tier: 'CORE',
        severity: 'HIGH',
      },
    ];

    const deduplicated = deduplicateFindingsByPrecedence(findings);

    assert.strictEqual(deduplicated.length, 1);
    assert.strictEqual(deduplicated[0].ruleId, 'aws-access-key-id');
    assert.strictEqual(deduplicated[0].severity, 'HIGH');
  });
});
