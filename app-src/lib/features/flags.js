/**
 * lib/features/flags.js
 *
 * Feature flags registry for SecretShield.
 * Flags control progressive rollout of platform capabilities.
 *
 * NOTE: Feature flags are NOT an authorization mechanism.
 */

const DEFAULT_FLAGS = {
  githubApp: {
    key: 'githubApp',
    name: 'GitHub App & Check Runs',
    description: 'Enables native GitHub App webhook integration and check-run annotations',
    enabled: true,
    rules: { rolloutPercentage: 100 },
  },
  gitlabIntegration: {
    key: 'gitlabIntegration',
    name: 'GitLab Pipeline Integration',
    description: 'Enables GitLab project webhooks and merge request vulnerability comments',
    enabled: true,
    rules: { rolloutPercentage: 100 },
  },
  slackIntegration: {
    key: 'slackIntegration',
    name: 'Slack Security Alerts',
    description: 'Enables real-time incident alerting via Slack incoming webhooks',
    enabled: true,
    rules: { rolloutPercentage: 100 },
  },
  historyScanning: {
    key: 'historyScanning',
    name: 'Git Commit History Deep Scan',
    description: 'Enables scanning entire git commit DAG history for leaked secrets',
    enabled: true,
    rules: { rolloutPercentage: 100 },
  },
  vscodeIntegration: {
    key: 'vscodeIntegration',
    name: 'VS Code Extension Sync',
    description: 'Allows IDE extension to synchronize findings and custom rules with SecretShield',
    enabled: true,
    rules: { rolloutPercentage: 100 },
  },
  policyEngine: {
    key: 'policyEngine',
    name: 'Policy Engine & Branch Rules',
    description: 'Enforces branch-protection rules and severity escalation gates',
    enabled: true,
    rules: { rolloutPercentage: 100 },
  },
};

const _featureFlags = JSON.parse(JSON.stringify(DEFAULT_FLAGS));

export function getAllFeatureFlags() {
  return Object.values(_featureFlags);
}

export function getFeatureFlag(key) {
  return _featureFlags[key] || null;
}

export function updateFeatureFlag(key, updates = {}) {
  if (!_featureFlags[key]) {
    throw new Error(`Unknown feature flag: ${key}`);
  }
  if (typeof updates.enabled === 'boolean') {
    _featureFlags[key].enabled = updates.enabled;
  }
  if (updates.rules && typeof updates.rules === 'object') {
    _featureFlags[key].rules = { ..._featureFlags[key].rules, ...updates.rules };
  }
  _featureFlags[key].updatedAt = new Date().toISOString();
  return _featureFlags[key];
}

export function resetFeatureFlagsForTesting() {
  for (const [k, v] of Object.entries(DEFAULT_FLAGS)) {
    _featureFlags[k] = JSON.parse(JSON.stringify(v));
  }
}
