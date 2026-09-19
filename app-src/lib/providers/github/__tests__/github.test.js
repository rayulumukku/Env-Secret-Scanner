/**
 * lib/providers/github/__tests__/github.test.js
 *
 * Automated tests for GitHub App Provider, JWTs, Webhook signatures, and Checks.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { generateGitHubAppJwt } from '../app.js';
import { verifyGitHubWebhookSignature, isDuplicateDelivery, parseGitHubWebhook } from '../webhooks.js';
import { formatCheckSummary } from '../checks.js';
import { formatPRComment } from '../comments.js';

test('GitHub App Provider & Webhooks', async (t) => {
  // Generate a transient test RSA key pair for testing JWT generation
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  await t.test('generateGitHubAppJwt creates a valid RS256 JWT structure', () => {
    const jwt = generateGitHubAppJwt('123456', privateKey);
    assert.ok(jwt, 'JWT should be generated');
    const parts = jwt.split('.');
    assert.equal(parts.length, 3, 'JWT must have 3 parts separated by dots');

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    assert.equal(header.alg, 'RS256');
    assert.equal(header.typ, 'JWT');

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    assert.equal(payload.iss, '123456');
    assert.ok(payload.exp > payload.iat);
  });

  await t.test('verifyGitHubWebhookSignature validates genuine HMAC-SHA256 signature', () => {
    const secret = 'test_webhook_secret_key_123';
    const body = JSON.stringify({ action: 'opened', repository: { name: 'backend' } });

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(body, 'utf8'));
    const validSignature = `sha256=${hmac.digest('hex')}`;

    assert.equal(verifyGitHubWebhookSignature(body, validSignature, secret), true);
  });

  await t.test('verifyGitHubWebhookSignature rejects tampered payload', () => {
    const secret = 'test_webhook_secret_key_123';
    const body = JSON.stringify({ action: 'opened' });
    const tamperedBody = JSON.stringify({ action: 'opened', hacker: true });

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(body, 'utf8'));
    const signature = `sha256=${hmac.digest('hex')}`;

    assert.equal(verifyGitHubWebhookSignature(tamperedBody, signature, secret), false);
  });

  await t.test('verifyGitHubWebhookSignature rejects wrong secret', () => {
    const body = JSON.stringify({ action: 'opened' });
    const hmac = crypto.createHmac('sha256', 'wrong_secret');
    hmac.update(Buffer.from(body, 'utf8'));
    const signature = `sha256=${hmac.digest('hex')}`;

    assert.equal(verifyGitHubWebhookSignature(body, signature, 'correct_secret'), false);
  });

  await t.test('isDuplicateDelivery prevents processing the same delivery ID twice', () => {
    const deliveryId = `del_${Date.now()}_test`;
    assert.equal(isDuplicateDelivery(deliveryId), false, 'First delivery should be processed');
    assert.equal(isDuplicateDelivery(deliveryId), true, 'Second identical delivery must be rejected as duplicate');
  });

  await t.test('formatCheckSummary maintains zero-exposure invariant', () => {
    const rawSecret = 'AKIAIOSFODNN7EXAMPLE';
    const findings = [
      {
        severity: 'CRITICAL',
        type: 'AWS Access Key',
        file: 'src/config.js',
        line: 42,
        confidence: 98,
        description: 'Exposed AWS Key',
        maskedValue: 'AKIA••••••••••••MPLE',
      },
    ];

    const summary = formatCheckSummary({ filesScanned: 10 }, findings, 'LOW');
    assert.ok(summary.includes('CRITICAL'));
    assert.ok(summary.includes('src/config.js:42'));
    assert.ok(summary.includes('AWS Access Key'));
    // STRICT ZERO-EXPOSURE: raw secret must NEVER appear
    assert.equal(summary.includes(rawSecret), false, 'Raw secret must NEVER appear in check summary');
  });

  await t.test('formatPRComment renders clean markdown without raw secrets', () => {
    const findings = [
      {
        severity: 'HIGH',
        type: 'Stripe Secret Key',
        file: 'server/billing.js',
        line: 18,
        maskedValue: 'sk_live_••••••••1234',
      },
    ];

    const comment = formatPRComment({ filesScanned: 5, findings, threshold: 'HIGH' });
    assert.ok(comment.includes('SecretShield Security Scan'));
    assert.ok(comment.includes('server/billing.js:18'));
    assert.ok(comment.includes('<!-- secretshield-pr-scan-comment -->'));
  });
});
