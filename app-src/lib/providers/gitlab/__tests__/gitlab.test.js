/**
 * lib/providers/gitlab/__tests__/gitlab.test.js
 *
 * Automated tests for GitLab Webhook verification and token authentication.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyGitLabWebhookToken, isDuplicateGitLabDelivery } from '../webhooks.js';

test('GitLab Webhook Provider', async (t) => {
  await t.test('verifyGitLabWebhookToken validates matching token', () => {
    const secret = 'gl_webhook_secret_9988';
    assert.equal(verifyGitLabWebhookToken('gl_webhook_secret_9988', secret), true);
  });

  await t.test('verifyGitLabWebhookToken rejects invalid token', () => {
    const secret = 'gl_webhook_secret_9988';
    assert.equal(verifyGitLabWebhookToken('wrong_token', secret), false);
    assert.equal(verifyGitLabWebhookToken(null, secret), false);
    assert.equal(verifyGitLabWebhookToken(undefined, secret), false);
  });

  await t.test('isDuplicateGitLabDelivery suppresses repeated UUIDs', () => {
    const uuid = `gl_uuid_${Date.now()}`;
    assert.equal(isDuplicateGitLabDelivery(uuid), false, 'First delivery passes');
    assert.equal(isDuplicateGitLabDelivery(uuid), true, 'Duplicate delivery is suppressed');
  });
});
