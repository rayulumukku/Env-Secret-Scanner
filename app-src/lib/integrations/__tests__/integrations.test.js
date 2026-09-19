import test from 'node:test';
import assert from 'node:assert/strict';
import { integrationRegistry } from '../registry.js';
import { getManifestById } from '../manifest.js';
import { getIntegrationPermissions } from '../permissions.js';
import { normalizeIntegrationEvent, eventDeduplicator } from '../events.js';
import { rateLimitTracker, checkIntegrationHealth } from '../health.js';
import { secureIntegrationConfig, readSecureIntegrationConfig } from '../storage.js';

test('integrations - manifests contain supported and planned integrations with factual statuses', () => {
  const manifests = integrationRegistry.listManifests();
  assert.ok(manifests.length >= 4);

  const gh = getManifestById('github');
  assert.equal(gh.status, 'SUPPORTED');
  assert.equal(gh.category, 'Source Control');

  const jira = getManifestById('jira');
  assert.equal(jira.status, 'COMING_SOON');
});

test('integrations - permissions provide clear read/write scopes and neverAccesses list', () => {
  const ghPerms = getIntegrationPermissions('github');
  assert.ok(ghPerms.read.length > 0);
  assert.ok(ghPerms.write.length > 0);
  assert.ok(ghPerms.neverAccesses.length > 0);
  assert.ok(ghPerms.neverAccesses.some(n => n.includes('billing') || n.includes('payment')));
});

test('integrations - event normalization and deduplication prevents replayed events', () => {
  eventDeduplicator.reset();

  const rawEvent = {
    id: 'evt_push_1001',
    ref: 'refs/heads/main',
    after: 'abc1234',
    repository: { name: 'backend-api' }
  };

  const normalized = normalizeIntegrationEvent('github', 'push', rawEvent, { organizationId: 'org_1' });
  assert.equal(normalized.integration, 'github');
  assert.equal(normalized.eventType, 'push');
  assert.equal(normalized.branch, 'main');
  assert.equal(normalized.repositoryName, 'backend-api');

  // First occurrence: not duplicate
  const isDup1 = eventDeduplicator.isDuplicate('github', normalized.id, rawEvent);
  assert.equal(isDup1, false);

  // Second occurrence: duplicate recognized
  const isDup2 = eventDeduplicator.isDuplicate('github', normalized.id, rawEvent);
  assert.equal(isDup2, true);
});

test('integrations - storage encrypts credentials at rest and decrypts accurately', () => {
  const rawConfig = {
    apiKey: 'sk_live_stripe_secret_key_12345',
    channel: '#security-alerts',
    token: 'ghp_github_access_token_67890'
  };

  const secured = secureIntegrationConfig(rawConfig);
  assert.ok(secured.encryptedPayload);
  assert.notEqual(secured.encryptedPayload, JSON.stringify(rawConfig));
  assert.equal(secured.maskedSummary.channel, '#security-alerts');
  assert.ok(secured.maskedSummary.apiKey.includes('••••••••'));

  const decrypted = readSecureIntegrationConfig(secured.encryptedPayload);
  assert.equal(decrypted.apiKey, rawConfig.apiKey);
  assert.equal(decrypted.channel, rawConfig.channel);
  assert.equal(decrypted.token, rawConfig.token);
});

test('integrations - health check tracks rate limits and failure counts safely', async () => {
  rateLimitTracker.reset();

  // Test rate limiting
  rateLimitTracker.recordRateLimit('github', 'org_1', 30);
  const healthWhenRateLimited = await checkIntegrationHealth('github', { organizationId: 'org_1', status: 'CONNECTED' });
  assert.equal(healthWhenRateLimited.status, 'RATE_LIMITED');
  assert.equal(healthWhenRateLimited.healthy, false);
  assert.ok(healthWhenRateLimited.message.includes('rate limit'));
});
