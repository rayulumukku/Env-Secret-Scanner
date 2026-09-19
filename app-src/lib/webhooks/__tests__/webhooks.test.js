/**
 * lib/webhooks/__tests__/webhooks.test.js
 *
 * Webhook HMAC Signing and Delivery tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { signWebhookPayload, verifyWebhookSignature } from '../signer.js';

describe('HMAC Webhook Signing', () => {
  const secret = 'whsec_test_secret_key_1234567890';
  const samplePayload = {
    event: 'critical.finding.created',
    timestamp: '2026-09-19T20:00:00.000Z',
    data: {
      findingId: 'f_test_123',
      type: 'AWS_ACCESS_KEY_ID',
      maskedValue: 'AKIAIOSF••••••••KEY1',
    },
  };

  test('generates sha256= prefixed hex signature', () => {
    const signature = signWebhookPayload(samplePayload, secret);
    assert.ok(signature.startsWith('sha256='));
    assert.strictEqual(signature.length, 7 + 64); // "sha256=" + 64 hex chars
  });

  test('verifies valid signature successfully', () => {
    const signature = signWebhookPayload(samplePayload, secret);
    const isValid = verifyWebhookSignature(samplePayload, signature, secret);
    assert.strictEqual(isValid, true);
  });

  test('rejects tampered payload', () => {
    const signature = signWebhookPayload(samplePayload, secret);
    const tamperedPayload = { ...samplePayload, event: 'tampered.event' };
    const isValid = verifyWebhookSignature(tamperedPayload, signature, secret);
    assert.strictEqual(isValid, false);
  });

  test('rejects wrong secret', () => {
    const signature = signWebhookPayload(samplePayload, secret);
    const isValid = verifyWebhookSignature(samplePayload, signature, 'wrong_secret');
    assert.strictEqual(isValid, false);
  });
});
