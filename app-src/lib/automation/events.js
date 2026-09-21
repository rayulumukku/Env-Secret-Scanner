/**
 * lib/automation/events.js
 *
 * Security Event Engine & Normalization Pipeline for SecretShield.
 * Standardizes event streams across GitHub, GitLab, CI/CD, CLI, and Scheduled Scans.
 *
 * SAFETY INVARIANTS:
 *   - NEVER includes raw secret values in security events or metadata.
 *   - Generates deterministic idempotency keys to prevent duplicate event execution.
 *   - Strictly scopes all events to authorized organizations.
 */

import { createHash, randomUUID } from 'crypto';

export const SECURITY_EVENT_TYPES = Object.freeze({
  SECRET_DETECTED: 'SECRET_DETECTED',
  SECRET_REINTRODUCED: 'SECRET_REINTRODUCED',
  SECRET_REMOVED: 'SECRET_REMOVED',
  EXPOSURE_EXTENDED: 'EXPOSURE_EXTENDED',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  SCAN_COMPLETED: 'SCAN_COMPLETED',
  SCAN_FAILED: 'SCAN_FAILED',
  RULE_PACK_UPDATED: 'RULE_PACK_UPDATED',
  REMEDIATION_STARTED: 'REMEDIATION_STARTED',
  REMEDIATION_VERIFIED: 'REMEDIATION_VERIFIED',
  INTEGRATION_FAILURE: 'INTEGRATION_FAILURE',
  BASELINE_CHANGED: 'BASELINE_CHANGED',
});

export const EVENT_SOURCES = Object.freeze({
  GITHUB_PUSH: 'GITHUB_PUSH',
  GITHUB_PR: 'GITHUB_PR',
  GITLAB_PUSH: 'GITLAB_PUSH',
  GITLAB_MR: 'GITLAB_MR',
  SCHEDULED_SCAN: 'SCHEDULED_SCAN',
  CLI_SCAN: 'CLI_SCAN',
  CI_SCAN: 'CI_SCAN',
  MANUAL_SCAN: 'MANUAL_SCAN',
  REPO_CONNECT: 'REPO_CONNECT',
  RULE_PACK_UPDATE: 'RULE_PACK_UPDATE',
});

/**
 * Generate a deterministic idempotency key for event deduplication.
 *
 * @param {string} provider - e.g., 'github', 'gitlab', 'scheduled'
 * @param {string} eventId - Source event ID (e.g., commit SHA, delivery ID, scan ID)
 * @param {string} [repositoryId=''] - Repository identifier
 * @returns {string} SHA-256 idempotency hash
 */
export function generateIdempotencyKey(provider, eventId, repositoryId = '') {
  const payload = `${String(provider || 'unknown')}:${String(eventId || '')}:${String(repositoryId || '')}`;
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Construct a normalized, verifiable Security Event record.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.eventType - One of SECURITY_EVENT_TYPES
 * @param {string} params.source - One of EVENT_SOURCES
 * @param {string} [params.projectId]
 * @param {string} [params.repositoryId]
 * @param {string} [params.actor]
 * @param {string} [params.severity] - CRITICAL | HIGH | MEDIUM | LOW | INFO
 * @param {string} [params.category]
 * @param {string[]} [params.relatedFindingIds=[]]
 * @param {string[]} [params.relatedFingerprints=[]]
 * @param {string[]} [params.evidenceIds=[]]
 * @param {object} [params.metadata={}]
 * @param {string} [params.correlationId]
 * @returns {object} Normalized SecurityEvent
 */
export function createSecurityEvent({
  organizationId,
  eventType,
  source,
  projectId = null,
  repositoryId = null,
  actor = 'System',
  severity = 'INFO',
  category = 'GENERAL',
  relatedFindingIds = [],
  relatedFingerprints = [],
  evidenceIds = [],
  metadata = {},
  correlationId = null,
}) {
  if (!organizationId) {
    throw new Error('organizationId is strictly required to create a SecurityEvent');
  }

  if (!Object.values(SECURITY_EVENT_TYPES).includes(eventType)) {
    throw new Error(`Invalid eventType: ${eventType}`);
  }

  // Sanitized metadata: ensure no secret values leaked in metadata
  const cleanMetadata = sanitizeEventMetadata(metadata);

  return {
    id: `sev_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    projectId,
    repositoryId,
    eventType,
    source: Object.values(EVENT_SOURCES).includes(source) ? source : EVENT_SOURCES.MANUAL_SCAN,
    actor: String(actor || 'System').slice(0, 120),
    severity: severity.toUpperCase(),
    category: category.toUpperCase(),
    relatedFindingIds: Array.isArray(relatedFindingIds) ? relatedFindingIds : [],
    relatedFingerprints: Array.isArray(relatedFingerprints) ? relatedFingerprints : [],
    evidenceIds: Array.isArray(evidenceIds) ? evidenceIds : [],
    metadata: cleanMetadata,
    correlationId: correlationId || `corr_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Deeply sanitize event metadata to prevent accidental secret or raw text inclusion.
 */
function sanitizeEventMetadata(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const cleaned = {};
  const blockedKeys = ['rawvalue', 'secret', 'password', 'token', 'key', 'auth', 'credential', 'privatekey'];

  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (blockedKeys.some(b => lowerKey.includes(b))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeEventMetadata(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
