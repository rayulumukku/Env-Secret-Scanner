import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLocalPolicies, DEFAULT_CONFIG } from '../../config/index.js';

test('cli policy - evaluateLocalPolicies detects critical finding violation when blockCritical is enabled', () => {
  const findings = [
    {
      id: 'f-1',
      ruleId: 'AWS_ACCESS_KEY_ID',
      severity: 'CRITICAL',
      file: 'config.json',
      line: 5,
      maskedValue: 'AKIA••••••••'
    }
  ];

  const config = {
    ...DEFAULT_CONFIG,
    policies: {
      blockCritical: true,
      blockHigh: false
    }
  };

  const result = evaluateLocalPolicies(findings, config);
  assert.equal(result.passed, false);
  assert.equal(result.violations.length, 1);
  assert.equal(result.violations[0].policy, 'Block Critical Secrets');
  assert.equal(result.violations[0].severity, 'CRITICAL');
});

test('cli policy - evaluateLocalPolicies passes on clean repository or low findings', () => {
  const findings = [
    {
      id: 'f-2',
      ruleId: 'GENERIC_IDENTIFIER',
      severity: 'LOW',
      file: 'index.html',
      line: 1,
      maskedValue: 'user_••••••••'
    }
  ];

  const config = {
    ...DEFAULT_CONFIG,
    policies: {
      blockCritical: true,
      blockHigh: true,
      severityThreshold: 'high'
    }
  };

  const result = evaluateLocalPolicies(findings, config);
  assert.equal(result.passed, true);
  assert.equal(result.violations.length, 0);
});
