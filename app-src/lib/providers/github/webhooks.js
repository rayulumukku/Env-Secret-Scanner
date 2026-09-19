/**
 * lib/providers/github/webhooks.js
 *
 * GitHub Webhook verification, idempotency tracking, and event routing.
 */

import crypto from 'crypto';

// In-memory idempotency cache for recent webhook deliveries (max 5000 items)
const processedDeliveries = new Map();

/**
 * Verify GitHub webhook signature (X-Hub-Signature-256).
 * Uses crypto.timingSafeEqual to protect against timing attacks.
 *
 * @param {string|Buffer} rawPayload - Raw request body text or buffer
 * @param {string} signatureHeader - Value of X-Hub-Signature-256 header
 * @param {string} secret - Secret configured in GitHub App
 * @returns {boolean}
 */
export function verifyGitHubWebhookSignature(rawPayload, signatureHeader, secret = process.env.GITHUB_WEBHOOK_SECRET) {
  if (!signatureHeader || !secret) {
    return false;
  }

  const payloadBuffer = Buffer.isBuffer(rawPayload) ? rawPayload : Buffer.from(rawPayload, 'utf8');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadBuffer);
  const calculatedSignature = `sha256=${hmac.digest('hex')}`;

  try {
    const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
    const calculatedBuffer = Buffer.from(calculatedSignature, 'utf8');

    if (signatureBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}

/**
 * Check if a delivery ID has already been processed (idempotency check).
 *
 * @param {string} deliveryId - Value of X-GitHub-Delivery header
 * @returns {boolean} True if already processed (duplicate), false if new
 */
export function isDuplicateDelivery(deliveryId) {
  if (!deliveryId) return false;

  const now = Date.now();
  // Evict items older than 30 minutes
  for (const [id, timestamp] of processedDeliveries.entries()) {
    if (now - timestamp > 30 * 60 * 1000) {
      processedDeliveries.delete(id);
    }
  }

  if (processedDeliveries.has(deliveryId)) {
    return true;
  }

  processedDeliveries.set(deliveryId, now);
  return false;
}

/**
 * Parse and validate a GitHub webhook payload.
 *
 * @param {string} eventName - Value of X-GitHub-Event
 * @param {object} payload - Parsed JSON payload
 * @returns {object} Normalized event details
 */
export function parseGitHubWebhook(eventName, payload) {
  const installationId = payload.installation?.id || null;
  const repository = payload.repository ? {
    id: payload.repository.id,
    name: payload.repository.name,
    fullName: payload.repository.full_name,
    owner: payload.repository.owner?.login,
    isPrivate: payload.repository.private,
    htmlUrl: payload.repository.html_url,
    defaultBranch: payload.repository.default_branch || 'main',
  } : null;

  const sender = payload.sender ? {
    login: payload.sender.login,
    id: payload.sender.id,
    avatarUrl: payload.sender.avatar_url,
  } : null;

  return {
    eventType: eventName,
    action: payload.action || null,
    installationId,
    repository,
    sender,
    payload,
  };
}
