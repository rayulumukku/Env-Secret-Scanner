import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildControlHealthSummary,
  createControl,
  createSyntheticCanary,
  runControlSuite,
} from '../control-validation.js';

test('synthetic canaries are non-functional and masked by fingerprinting', () => {
  const canary = createSyntheticCanary({ providerType: 'GITHUB', ruleId: 'github-token' });

  assert.ok(canary.value.startsWith('SS_CANARY_NONFUNCTIONAL_'));
  assert.equal(canary.value.includes('ghp_'), false);
  assert.equal(canary.value.includes('sk_live_'), false);
  assert.ok(canary.fingerprint.length >= 32);
  assert.equal(canary.rawStored, false);
  assert.equal(canary.metadata.providerType, 'GITHUB');
});

test('control definitions include required metadata and supported categories', () => {
  const control = createControl({
    name: 'Repository Scanner Integrity',
    category: 'SCANNER',
    severity: 'HIGH',
    owner: 'platform-security',
    schedule: 'daily',
    enabled: true,
    organizationId: 'org_1',
  });

  assert.equal(control.status, 'NOT_RUN');
  assert.equal(control.category, 'SCANNER');
  assert.ok(control.id.length > 10);
  assert.equal(control.enabled, true);
});

test('control health summary returns enterprise-safe status and score', () => {
  const summary = buildControlHealthSummary({
    controls: [
      { status: 'PASS' },
      { status: 'PASS' },
      { status: 'WARNING' },
      { status: 'FAIL' },
      { status: 'NOT_RUN' },
    ],
  });

  assert.equal(summary.healthScore, 98);
  assert.equal(summary.status, 'HEALTHY');
  assert.equal(summary.failed, 1);
  assert.equal(summary.passed, 2);
});

test('safe suite runs can complete without raw secret persistence', () => {
  const result = runControlSuite({
    organizationId: 'org_1',
    categories: ['DETECTION', 'WORKFLOW', 'NOTIFICATION'],
    mode: 'safe',
  });

  assert.equal(result.summary.healthy, true);
  assert.equal(result.summary.failed, 0);
  assert.ok(result.results.length >= 3);
  assert.equal(result.rawSecretLeakageDetected, false);
});
