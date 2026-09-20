import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isFeatureEnabled } from '../evaluator.js';
import { getAllFeatureFlags, getFeatureFlag, updateFeatureFlag, resetFeatureFlagsForTesting } from '../flags.js';

describe('Feature Flags Evaluator', () => {
  it('should return all default registered feature flags', () => {
    resetFeatureFlagsForTesting();
    const flags = getAllFeatureFlags();
    assert.ok(flags.length >= 6);

    const ghFlag = getFeatureFlag('githubApp');
    assert.ok(ghFlag);
    assert.strictEqual(ghFlag.enabled, true);
  });

  it('should allow dynamic flag overrides and evaluation', () => {
    resetFeatureFlagsForTesting();
    assert.strictEqual(isFeatureEnabled('gitlabIntegration'), true);

    updateFeatureFlag('gitlabIntegration', { enabled: false });
    assert.strictEqual(isFeatureEnabled('gitlabIntegration'), false);

    // Rollout percentage check
    updateFeatureFlag('historyScanning', {
      enabled: true,
      rules: { rolloutPercentage: 0, allowedUsers: ['usr_beta_tester'] }
    });

    assert.strictEqual(isFeatureEnabled('historyScanning', { userId: 'usr_normal' }), false);
    assert.strictEqual(isFeatureEnabled('historyScanning', { userId: 'usr_beta_tester' }), true);
  });
});
