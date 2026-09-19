/**
 * @file lib/integrations/events.js
 * @description Event Normalization Pipeline & Idempotency Deduplication.
 * 
 * IDEMPOTENCY & REPLAY PROTECTION:
 *   - Duplicate webhook deliveries sharing the same eventId + provider
 *     are recognized and suppressed to avoid duplicate scans or notifications.
 *   - Normalizes provider-specific payloads into a canonical event shape.
 *   - NEVER stores or forwards raw secrets in event payloads.
 */

import { randomUUID, createHash } from 'crypto';
import { redactSensitiveKeys } from '../security/secrets.js';

class EventDeduplicator {
  constructor(ttlMs = 1000 * 60 * 60) { // 1 hour TTL
    this.seenEvents = new Map();
    this.ttlMs = ttlMs;
  }

  getEventKey(provider, eventId, payloadHash) {
    return `${provider}:${eventId || payloadHash}`;
  }

  computePayloadHash(payload) {
    return createHash('sha256').update(JSON.stringify(payload || {})).digest('hex').slice(0, 16);
  }

  /**
   * Checks if an event is duplicate. If not seen, records it.
   * 
   * @param {string} provider 
   * @param {string} [eventId] 
   * @param {any} [rawPayload] 
   * @returns {boolean} true if already processed (duplicate), false if new
   */
  isDuplicate(provider, eventId, rawPayload) {
    this.cleanup();
    const hash = this.computePayloadHash(rawPayload);
    const key = this.getEventKey(provider, eventId, hash);

    if (this.seenEvents.has(key)) {
      return true;
    }

    this.seenEvents.set(key, Date.now());
    return false;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.seenEvents.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.seenEvents.delete(key);
      }
    }
  }

  reset() {
    this.seenEvents.clear();
  }
}

export const eventDeduplicator = new EventDeduplicator();

/**
 * Normalizes incoming provider events into a canonical SecretShield event object.
 * 
 * @param {string} provider - 'github' | 'gitlab' | 'slack' | 'webhooks'
 * @param {string} rawEventType 
 * @param {Object} rawPayload 
 * @param {Object} [context] 
 * @returns {Object} Normalized event
 */
export function normalizeIntegrationEvent(provider, rawEventType, rawPayload = {}, context = {}) {
  const eventId = rawPayload.id || rawPayload.eventId || rawPayload.deliveryId || `evt_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const timestamp = rawPayload.timestamp || new Date().toISOString();

  let eventType = rawEventType;
  let repositoryId = context.repositoryId || rawPayload.repository?.id || rawPayload.repository?.name || null;
  let repositoryName = rawPayload.repository?.name || rawPayload.project?.name || null;
  let branch = rawPayload.ref?.replace('refs/heads/', '') || rawPayload.branch || 'main';
  let commitHash = rawPayload.after || rawPayload.checkout_sha || rawPayload.commitHash || null;
  let prNumber = rawPayload.pull_request?.number || rawPayload.number || rawPayload.object_attributes?.iid || null;

  // Provider-specific normalizations
  if (provider === 'github') {
    if (rawEventType === 'push') eventType = 'push';
    else if (rawEventType.startsWith('pull_request')) eventType = 'pull_request';
    else if (rawEventType.startsWith('check_')) eventType = 'check_run';
  } else if (provider === 'gitlab') {
    if (rawEventType === 'Push Hook') eventType = 'push';
    else if (rawEventType === 'Merge Request Hook') eventType = 'pull_request';
    else if (rawEventType === 'Pipeline Hook') eventType = 'pipeline';
  }

  return {
    id: eventId,
    integration: provider,
    eventType,
    rawEventType,
    organizationId: context.organizationId || null,
    projectId: context.projectId || null,
    repositoryId,
    repositoryName,
    branch,
    commitHash,
    prNumber,
    timestamp,
    status: 'RECEIVED',
    metadata: redactSensitiveKeys(rawPayload.metadata || {})
  };
}
