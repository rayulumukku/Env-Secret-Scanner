/**
 * lib/exposure/metrics.js
 *
 * Factual Exposure Metrics & Duration Engine for SecretShield.
 *
 * INVARIANT: No subjective scores or fabricated rankings; displays strictly factual metrics.
 */

import { formatDuration } from './model.js';

/**
 * Calculate factual exposure metrics from a list of correlated findings / clusters.
 *
 * @param {object[]} findings - Array of finding records
 * @param {object[]} [clusters=[]] - Array of correlated exposure clusters
 * @returns {object} Factual metrics summary
 */
export function calculateExposureMetrics(findings = [], clusters = []) {
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const activeFindings = findings.filter(f => f.status === 'OPEN' || f.status === 'CONFIRMED' || f.status === 'ACTIVE');
  const historicalFindings = findings.filter(f => f.status === 'REMEDIATED' || f.isHistorical || f.status === 'FALSE_POSITIVE');

  const uniqueFingerprints = new Set(findings.map(f => f.fingerprint).filter(Boolean));
  const uniqueRepos = new Set(findings.map(f => f.repositoryId).filter(Boolean));
  const uniqueBranches = new Set(findings.map(f => f.branch).filter(Boolean));
  const uniqueCommits = new Set(findings.map(f => f.commitHash).filter(Boolean));
  const uniqueFiles = new Set(findings.map(f => f.file).filter(Boolean));

  // Calculate maximum and average exposure durations
  let maxUnresolvedMs = 0;
  let totalUnresolvedMs = 0;
  let recentCount = 0;
  let removedNotVerifiedCount = 0;

  for (const f of activeFindings) {
    const firstSeen = new Date(f.commitDate || f.firstSeenAt || f.createdAt || now).getTime();
    const duration = Math.max(0, now - firstSeen);
    if (duration > maxUnresolvedMs) maxUnresolvedMs = duration;
    totalUnresolvedMs += duration;

    if (now - firstSeen < ONE_WEEK_MS) {
      recentCount++;
    }

    if (f.lifecycleStatus === 'ROTATION_REQUIRED' || f.isRemovedFromSource) {
      removedNotVerifiedCount++;
    }
  }

  const avgUnresolvedMs = activeFindings.length > 0
    ? Math.round(totalUnresolvedMs / activeFindings.length)
    : 0;

  const crossRepoClusters = clusters.filter(c => c.isCrossRepository || c.repositoryCount > 1);

  return {
    totalFindings: findings.length,
    activeFindingsCount: activeFindings.length,
    historicalFindingsCount: historicalFindings.length,
    uniqueFingerprintsCount: uniqueFingerprints.size,
    repositoriesAffectedCount: uniqueRepos.size,
    branchesAffectedCount: uniqueBranches.size || 1,
    commitsAffectedCount: uniqueCommits.size,
    filesAffectedCount: uniqueFiles.size,
    crossRepoClustersCount: crossRepoClusters.length,
    findingsIntroducedRecentlyCount: recentCount,
    findingsRemovedNotVerifiedCount: removedNotVerifiedCount,
    maxUnresolvedDurationMs: maxUnresolvedMs,
    maxUnresolvedDurationHuman: formatDuration(maxUnresolvedMs),
    avgUnresolvedDurationMs: avgUnresolvedMs,
    avgUnresolvedDurationHuman: formatDuration(avgUnresolvedMs),
  };
}
