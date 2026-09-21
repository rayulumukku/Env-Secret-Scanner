/**
 * lib/automation/notifications.js
 *
 * Notification Deduplication & Escalation Engine for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Prevents notification spam by deduplicating alerts for unchanged exposures.
 *   - Implements progressive escalation tiers (Initial -> Reminder -> Escalation -> Resolution).
 *   - NEVER formats or includes raw secret credentials in outbound notifications.
 */

import { createHash } from 'crypto';

export const NOTIFICATION_TIERS = Object.freeze({
  INITIAL: 'INITIAL',
  REMINDER: 'REMINDER',
  ESCALATION: 'ESCALATION',
  RESOLUTION: 'RESOLUTION',
});

// Cache of recent notification timestamps by fingerprint & org
const recentNotificationLog = new Map();

/**
 * Determine if a notification should be dispatched or suppressed.
 *
 * @param {string} organizationId
 * @param {string} fingerprint
 * @param {'INITIAL' | 'REMINDER' | 'ESCALATION' | 'RESOLUTION'} tier
 * @param {number} [throttleMinutes=60]
 * @returns {{ shouldSend: boolean, reason: string }}
 */
export function evaluateNotificationThrottle(organizationId, fingerprint, tier, throttleMinutes = 60) {
  const key = `${organizationId}:${fingerprint}:${tier}`;
  const now = Date.now();
  const lastSent = recentNotificationLog.get(key);

  if (tier === NOTIFICATION_TIERS.RESOLUTION) {
    // Resolutions should always send immediately
    recentNotificationLog.set(key, now);
    return { shouldSend: true, reason: 'Resolution event bypassed throttle' };
  }

  if (lastSent && (now - lastSent) < throttleMinutes * 60 * 1000) {
    const remainingMins = Math.round((throttleMinutes * 60 * 1000 - (now - lastSent)) / 60000);
    return {
      shouldSend: false,
      reason: `Throttled: identical ${tier} notification was sent recently (${remainingMins}m remaining in suppression window)`,
    };
  }

  recentNotificationLog.set(key, now);
  return { shouldSend: true, reason: 'Throttle window clear' };
}

/**
 * Build a safe notification payload without raw secrets.
 *
 * @param {object} params
 * @param {string} params.eventType
 * @param {string} params.fingerprint
 * @param {string} params.ruleName
 * @param {string} params.severity
 * @param {string} params.repositoryName
 * @param {'INITIAL' | 'REMINDER' | 'ESCALATION' | 'RESOLUTION'} [params.tier='INITIAL']
 * @returns {object} Safe notification message
 */
export function formatSafeNotification({
  eventType,
  fingerprint,
  ruleName,
  severity,
  repositoryName,
  tier = NOTIFICATION_TIERS.INITIAL,
}) {
  const maskedFp = fingerprint ? `${fingerprint.slice(0, 8)}...` : 'Unknown';
  let title = `[SecretShield ${tier}] Secret Finding in ${repositoryName}`;
  if (tier === NOTIFICATION_TIERS.RESOLUTION) {
    title = `[SecretShield RESOLVED] Secret Exposure Remediated in ${repositoryName}`;
  } else if (tier === NOTIFICATION_TIERS.ESCALATION) {
    title = `[SecretShield ESCALATION] Unresolved ${severity} Secret in ${repositoryName}`;
  }

  return {
    tier,
    title,
    severity: severity?.toUpperCase() || 'HIGH',
    repository: repositoryName || 'Repository',
    ruleName: ruleName || 'Security Rule',
    fingerprint: maskedFp,
    summary: `SecretShield detected a ${severity} credential finding (${ruleName}) matching fingerprint [${maskedFp}].`,
    actionUrl: `/exposure/${fingerprint}`,
    timestamp: new Date().toISOString(),
  };
}
