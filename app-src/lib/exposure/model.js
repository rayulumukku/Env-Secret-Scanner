/**
 * lib/exposure/model.js
 *
 * Normalized Exposure Intelligence Model & Secret Lifecycle Engine for SecretShield.
 *
 * SECURITY INVARIANTS:
 * - NO raw secrets stored, returned, or logged.
 * - All findings and clusters reference masked values and cryptographic fingerprints.
 * - Every lifecycle transition must be backed by explicit evidence.
 * - Historical Git exposures are strictly preserved even if secret is absent from latest commit.
 */

export const LIFECYCLE_STATUS = {
  DISCOVERED: 'DISCOVERED',
  INTRODUCED: 'INTRODUCED',
  ACTIVE: 'ACTIVE',
  REMOVED_FROM_SOURCE: 'REMOVED_FROM_SOURCE',
  ROTATION_REQUIRED: 'ROTATION_REQUIRED',
  REMEDIATED: 'REMEDIATED',
  VERIFIED: 'VERIFIED',
};

export const LIFECYCLE_ORDER = [
  LIFECYCLE_STATUS.DISCOVERED,
  LIFECYCLE_STATUS.INTRODUCED,
  LIFECYCLE_STATUS.ACTIVE,
  LIFECYCLE_STATUS.REMOVED_FROM_SOURCE,
  LIFECYCLE_STATUS.ROTATION_REQUIRED,
  LIFECYCLE_STATUS.REMEDIATED,
  LIFECYCLE_STATUS.VERIFIED,
];

/**
 * Calculate exposure durations across detection, historical timeline, and remediation.
 *
 * @param {object} params
 * @param {string|Date} params.firstSeenAt
 * @param {string|Date} [params.lastSeenAt]
 * @param {string|Date} [params.introducedAt]
 * @param {string|Date} [params.resolvedAt]
 * @param {boolean} [params.isResolved=false]
 * @returns {object} Exposure duration metrics in milliseconds and humanized string
 */
export function calculateExposureDuration({
  firstSeenAt,
  lastSeenAt = null,
  introducedAt = null,
  resolvedAt = null,
  isResolved = false,
}) {
  const now = Date.now();
  const firstSeenMs = new Date(firstSeenAt || now).getTime();
  const lastSeenMs = lastSeenAt ? new Date(lastSeenAt).getTime() : now;
  const introducedMs = introducedAt ? new Date(introducedAt).getTime() : firstSeenMs;
  const resolvedMs = resolvedAt ? new Date(resolvedAt).getTime() : (isResolved ? now : null);

  // Unresolved duration = currentTime - firstSeen
  const unresolvedDurationMs = isResolved ? 0 : Math.max(0, now - firstSeenMs);

  // Detection duration = lastSeen - firstSeen
  const detectionDurationMs = Math.max(0, lastSeenMs - firstSeenMs);

  // Historical exposure duration = (resolvedAt || now) - introducedAt
  const historicalExposureDurationMs = Math.max(0, (resolvedMs || now) - introducedMs);

  // Remediation duration = resolvedAt - firstSeen
  const remediationDurationMs = resolvedMs ? Math.max(0, resolvedMs - firstSeenMs) : null;

  return {
    unresolvedDurationMs,
    detectionDurationMs,
    historicalExposureDurationMs,
    remediationDurationMs,
    unresolvedDurationHuman: formatDuration(unresolvedDurationMs),
    historicalDurationHuman: formatDuration(historicalExposureDurationMs),
    remediationDurationHuman: remediationDurationMs !== null ? formatDuration(remediationDurationMs) : 'Unresolved',
  };
}

/**
 * Format milliseconds into human-readable duration (e.g. "14d 6h", "2h 15m", "45m")
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) return '0m';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Create a normalized Exposure Record from finding and repository context.
 *
 * @param {object} finding
 * @param {object} [context={}]
 * @returns {object} Normalized exposure record
 */
export function createExposureRecord(finding, context = {}) {
  const now = new Date().toISOString();
  const firstSeen = finding.firstSeenAt || context.firstSeenAt || finding.createdAt || now;
  const lastSeen = finding.lastSeenAt || context.lastSeenAt || finding.updatedAt || now;
  const introducedAt = finding.commitDate || context.introducedAt || firstSeen;
  const resolvedAt = finding.resolvedAt || context.resolvedAt || null;
  const isResolved = Boolean(resolvedAt || finding.status === 'REMEDIATED');

  let lifecycleStatus = finding.lifecycleStatus || LIFECYCLE_STATUS.ACTIVE;
  if (isResolved) {
    lifecycleStatus = context.isVerified ? LIFECYCLE_STATUS.VERIFIED : LIFECYCLE_STATUS.REMEDIATED;
  } else if (context.isRemovedFromSource) {
    lifecycleStatus = LIFECYCLE_STATUS.ROTATION_REQUIRED;
  }

  const duration = calculateExposureDuration({
    firstSeenAt: firstSeen,
    lastSeenAt: lastSeen,
    introducedAt,
    resolvedAt,
    isResolved,
  });

  return {
    findingId: finding.id,
    fingerprint: finding.fingerprint,
    ruleId: finding.ruleId,
    ruleVersion: finding.ruleVersion || '1.0.0',
    ruleName: finding.name || finding.ruleName || finding.ruleId,
    category: finding.category || 'Generic Secrets',
    severity: finding.severity || 'HIGH',
    confidence: finding.confidence || 85,
    repositoryId: finding.repositoryId || context.repositoryId || 'unknown-repo',
    repositoryName: context.repositoryName || finding.repositoryName || 'unknown-repo',
    projectId: finding.projectId || context.projectId || 'unknown-project',
    organizationId: finding.organizationId || context.organizationId || 'default-org',
    branch: finding.branch || context.branch || 'main',
    commitHash: finding.commitHash || context.commitHash || null,
    commitAuthor: finding.author || context.commitAuthor || null,
    file: finding.file || context.file || 'unknown-file',
    lineRange: {
      start: finding.line || 1,
      end: finding.lineEnd || finding.line || 1,
      column: finding.column || 1,
    },
    maskedValue: finding.maskedValue,
    firstSeenAt: firstSeen,
    lastSeenAt: lastSeen,
    introducedAt,
    resolvedAt,
    lifecycleStatus,
    exposureDuration: duration,
    isGitTrackedRisk: Boolean(finding.isGitTrackedRisk),
    evidenceReferences: Array.isArray(finding.evidenceReferences) ? finding.evidenceReferences : [],
    remediationGuide: finding.remediation || 'Revoke and rotate credential in provider console immediately.',
    whyDetected: finding.whyDetected || ['Matches configured secret detection rule'],
  };
}
