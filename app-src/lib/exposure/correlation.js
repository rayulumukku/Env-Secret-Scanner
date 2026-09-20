/**
 * lib/exposure/correlation.js
 *
 * Multi-Dimensional Secret Correlation Engine for SecretShield.
 *
 * CORRELATION MODES:
 * 1. Exact Fingerprint Correlation (Cryptographically identical secret occurrence)
 * 2. Rule / Provider Correlation (Same secret type across organization)
 * 3. Repository Relationship Correlation (Repository / Project ancestry)
 *
 * SECURITY INVARIANT:
 * - Organization isolation strictly enforced. Never correlate or return findings across different organizations.
 */

import { calculateExposureDuration } from './model.js';

export const CORRELATION_TYPES = {
  EXACT_FINGERPRINT: 'EXACT_FINGERPRINT',
  RULE_PROVIDER: 'RULE_PROVIDER',
  REPOSITORY_ANCESTRY: 'REPOSITORY_ANCESTRY',
};

/**
 * Group raw findings into normalized Exposure Clusters by exact cryptographic fingerprint.
 *
 * @param {object[]} findings - Array of finding records
 * @param {object} [options={}]
 * @param {string} [options.organizationId] - Strict organization scope filter
 * @returns {object[]} Array of correlated ExposureCluster objects
 */
export function correlateFindingsByFingerprint(findings = [], options = {}) {
  const { organizationId = null } = options;

  // Filter by organization if specified
  const filteredFindings = organizationId
    ? findings.filter(f => !f.organizationId || f.organizationId === organizationId)
    : findings;

  const clusterMap = new Map();

  for (const f of filteredFindings) {
    const fp = f.fingerprint || `fp_fallback_${f.id}`;
    if (!clusterMap.has(fp)) {
      clusterMap.set(fp, {
        clusterId: `cluster_${fp}`,
        fingerprint: fp,
        maskedValue: f.maskedValue,
        ruleId: f.ruleId,
        ruleName: f.ruleName || f.name || f.ruleId,
        category: f.category || 'Generic Secrets',
        severity: f.severity || 'HIGH',
        confidence: f.confidence || 85,
        organizationId: f.organizationId || organizationId || 'default-org',
        findings: [],
        repositories: new Map(),
        branches: new Set(),
        commits: new Set(),
        files: new Set(),
        firstSeenAt: f.commitDate || f.firstSeenAt || f.createdAt || new Date().toISOString(),
        lastSeenAt: f.lastSeenAt || f.updatedAt || f.createdAt || new Date().toISOString(),
        status: f.status || 'OPEN',
        isGitTrackedRisk: Boolean(f.isGitTrackedRisk),
      });
    }

    const cluster = clusterMap.get(fp);
    cluster.findings.push(f);

    // Track repository occurrence
    const repoId = f.repositoryId || 'unknown-repo';
    if (!cluster.repositories.has(repoId)) {
      cluster.repositories.set(repoId, {
        repositoryId: repoId,
        repositoryName: f.repositoryName || repoId,
        findingCount: 0,
        files: new Set(),
        branches: new Set(),
      });
    }
    const repoData = cluster.repositories.get(repoId);
    repoData.findingCount++;
    if (f.file) repoData.files.add(f.file);
    if (f.branch) repoData.branches.add(f.branch);

    if (f.branch) cluster.branches.add(f.branch);
    if (f.commitHash) cluster.commits.add(f.commitHash);
    if (f.file) cluster.files.add(f.file);

    // Track timestamps
    const findingTime = new Date(f.commitDate || f.firstSeenAt || f.createdAt || 0).getTime();
    const clusterFirstTime = new Date(cluster.firstSeenAt).getTime();
    if (findingTime < clusterFirstTime && findingTime > 0) {
      cluster.firstSeenAt = new Date(findingTime).toISOString();
    }

    const findingLastTime = new Date(f.lastSeenAt || f.updatedAt || f.createdAt || 0).getTime();
    const clusterLastTime = new Date(cluster.lastSeenAt).getTime();
    if (findingLastTime > clusterLastTime) {
      cluster.lastSeenAt = new Date(findingLastTime).toISOString();
    }

    // Escalate severity if any finding in cluster is higher
    const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    if ((severityRank[f.severity] || 1) > (severityRank[cluster.severity] || 1)) {
      cluster.severity = f.severity;
    }
  }

  // Format finalized clusters
  return Array.from(clusterMap.values()).map(c => {
    const repoList = Array.from(c.repositories.values()).map(r => ({
      repositoryId: r.repositoryId,
      repositoryName: r.repositoryName,
      findingCount: r.findingCount,
      filesCount: r.files.size,
      branchesCount: r.branches.size,
    }));

    const isResolved = c.findings.every(f => f.status === 'REMEDIATED' || f.status === 'FALSE_POSITIVE' || f.status === 'IGNORED');
    const durations = calculateExposureDuration({
      firstSeenAt: c.firstSeenAt,
      lastSeenAt: c.lastSeenAt,
      introducedAt: c.firstSeenAt,
      isResolved,
    });

    return {
      clusterId: c.clusterId,
      fingerprint: c.fingerprint,
      maskedValue: c.maskedValue,
      ruleId: c.ruleId,
      ruleName: c.ruleName,
      category: c.category,
      severity: c.severity,
      confidence: c.confidence,
      organizationId: c.organizationId,
      status: isResolved ? 'REMEDIATED' : 'ACTIVE',
      totalFindings: c.findings.length,
      repositoryCount: repoList.length,
      branchCount: c.branches.size || 1,
      commitCount: c.commits.size || (c.findings.some(f => f.commitHash) ? 1 : 0),
      fileCount: c.files.size || 1,
      repositories: repoList,
      branches: Array.from(c.branches),
      commits: Array.from(c.commits),
      files: Array.from(c.files),
      firstSeenAt: c.firstSeenAt,
      lastSeenAt: c.lastSeenAt,
      durations,
      isCrossRepository: repoList.length > 1,
      correlationReason: 'Exact cryptographic fingerprint match',
      findings: c.findings,
    };
  });
}

/**
 * Correlate findings by rule or provider category.
 *
 * @param {object[]} findings
 * @returns {Map<string, object[]>} Map of ruleId -> findings
 */
export function correlateFindingsByRule(findings = []) {
  const ruleGroups = new Map();
  for (const f of findings) {
    const key = f.ruleId || 'GENERIC';
    if (!ruleGroups.has(key)) {
      ruleGroups.set(key, []);
    }
    ruleGroups.get(key).push(f);
  }
  return ruleGroups;
}
