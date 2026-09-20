import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizePayload, trackEvent } from '../tracker.js';
import { ANALYTICS_EVENTS } from '../events.js';
import { getAggregateMetrics, clearEventsForTesting } from '../store.js';

describe('Privacy-Conscious Analytics & Telemetry', () => {
  it('should strip forbidden keys such as secret, token, key, password, and raw code', () => {
    const dangerousPayload = {
      ruleId: 'AWS_ACCESS_KEY',
      severity: 'CRITICAL',
      secret: 'AKIAIOSFODNN7EXAMPLE',
      rawKey: 'sk_live_1234567890',
      password: 'SuperSecretPassword123',
      userToken: 'ghp_abc123xyz',
      content: 'SELECT * FROM users WHERE pass = 123',
      codeSnippet: 'const key = "supersecret";',
      safeCount: 5,
    };

    const sanitized = sanitizePayload(dangerousPayload);

    // Assert safe keys are preserved
    assert.strictEqual(sanitized.ruleId, 'AWS_ACCESS_KEY');
    assert.strictEqual(sanitized.severity, 'CRITICAL');
    assert.strictEqual(sanitized.safeCount, 5);

    // Assert forbidden keys are removed
    assert.strictEqual(sanitized.secret, undefined);
    assert.strictEqual(sanitized.rawKey, undefined);
    assert.strictEqual(sanitized.password, undefined);
    assert.strictEqual(sanitized.userToken, undefined);
    assert.strictEqual(sanitized.content, undefined);
    assert.strictEqual(sanitized.codeSnippet, undefined);
  });

  it('should track anonymous events and compute aggregate metrics', () => {
    clearEventsForTesting();

    trackEvent(ANALYTICS_EVENTS.SCAN_COMPLETED, { durationMs: 25 }, { userId: 'usr_test_1' });
    trackEvent(ANALYTICS_EVENTS.PROJECT_CREATED, { project: 'Frontend' }, { userId: 'usr_test_1', orgId: 'org_test_1' });

    const metrics30d = getAggregateMetrics(30);
    assert.strictEqual(metrics30d.scansCompleted, 1);
    assert.strictEqual(metrics30d.projectsCreated, 1);
    assert.strictEqual(metrics30d.newUsers, 1);
    assert.strictEqual(metrics30d.activeOrgs, 1);
  });
});
