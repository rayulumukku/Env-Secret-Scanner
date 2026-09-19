/**
 * lib/webhooks/signer.js
 *
 * HMAC-SHA256 Webhook Payload Signing.
 *
 * Security:
 *   - Uses crypto.createHmac('sha256', secret)
 *   - Verifies with timingSafeEqual to avoid timing side-channels
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Sign a payload string with an HMAC secret.
 * @param {string|object} payload
 * @param {string} secret
 * @returns {string} Hex-encoded HMAC signature
 */
export function signWebhookPayload(payload, secret) {
  if (!secret) throw new Error('Webhook secret required for signing');
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verify an incoming webhook signature.
 * @param {string|object} payload
 * @param {string} signatureHeader - e.g. "sha256=1234..."
 * @param {string} secret
 * @returns {boolean}
 */
export function verifyWebhookSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  try {
    const expected = signWebhookPayload(payload, secret);
    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signatureHeader);
    if (expectedBuf.length !== signatureBuf.length) return false;
    return timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}
