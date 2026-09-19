/**
 * lib/providers/gitlab/webhooks.js
 *
 * GitLab Webhook signature verification, deduplication, and parser.
 */

import crypto from 'crypto';

const processedGitLabEvents = new Map();

/**
 * Verify GitLab webhook secret token (X-Gitlab-Token).
 *
 * @param {string} tokenHeader - Value of X-Gitlab-Token header
 * @param {string} secret - Configured secret token
 * @returns {boolean}
 */
export function verifyGitLabWebhookToken(tokenHeader, secret = process.env.GITLAB_WEBHOOK_SECRET) {
  if (!tokenHeader || !secret) {
    return false;
  }

  try {
    const tokenBuffer = Buffer.from(tokenHeader, 'utf8');
    const secretBuffer = Buffer.from(secret, 'utf8');

    if (tokenBuffer.length !== secretBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  } catch {
    return false;
  }
}

/**
 * Idempotency check for GitLab event UUIDs.
 *
 * @param {string} eventUuid - Value of X-Gitlab-Event-UUID
 * @returns {boolean} True if duplicate, false if new
 */
export function isDuplicateGitLabDelivery(eventUuid) {
  if (!eventUuid) return false;

  const now = Date.now();
  for (const [id, timestamp] of processedGitLabEvents.entries()) {
    if (now - timestamp > 30 * 60 * 1000) {
      processedGitLabEvents.delete(id);
    }
  }

  if (processedGitLabEvents.has(eventUuid)) {
    return true;
  }

  processedGitLabEvents.set(eventUuid, now);
  return false;
}
