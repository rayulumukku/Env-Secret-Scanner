/**
 * packages/dependency-engine/src/pr/index.js
 *
 * Pull Request Dependency Intelligence & Differential Impact Analysis.
 * Analyzes dependency modifications between base and head branches.
 *
 * SECURITY INVARIANTS:
 * - Detects subtle lockfile-only manipulations and dependency confusion risks.
 * - Distinguishes upgrades vs downgrades and highlights newly introduced vulnerabilities.
 */

import { compareVersions } from '../semver/index.js';

export const PR_CHANGE_TYPE = {
  NEW_DEPENDENCY: 'NEW_DEPENDENCY',
  REMOVED_DEPENDENCY: 'REMOVED_DEPENDENCY',
  UPGRADED_DEPENDENCY: 'UPGRADED_DEPENDENCY',
  DOWNGRADED_DEPENDENCY: 'DOWNGRADED_DEPENDENCY',
  REPLACED_DEPENDENCY: 'REPLACED_DEPENDENCY',
  LOCKFILE_ONLY_CHANGE: 'LOCKFILE_ONLY_CHANGE',
  UNCHANGED: 'UNCHANGED',
};

/**
 * Analyzes differential dependency changes and security impact between base and head graphs.
 *
 * @param {object} params
 * @param {object} params.baseGraph - Graph constructed from PR base branch
 * @param {object} params.headGraph - Graph constructed from PR head branch
 * @param {Array<object>} [params.baseVulnerabilities=[]] - Base findings
 * @param {Array<object>} [params.headVulnerabilities=[]] - Head findings
 * @param {Array<object>} [params.headSignals=[]] - Head heuristic signals
 * @returns {object} PR dependency security impact analysis
 */
export function analyzePullRequestDependencies({
  baseGraph = { nodes: [] },
  headGraph = { nodes: [] },
  baseVulnerabilities = [],
  headVulnerabilities = [],
  headSignals = []
}) {
  const baseMap = new Map();
  for (const node of baseGraph.nodes || []) {
    baseMap.set(`${node.ecosystem}:${node.name}`, node);
  }

  const headMap = new Map();
  for (const node of headGraph.nodes || []) {
    headMap.set(`${node.ecosystem}:${node.name}`, node);
  }

  const dependencyChanges = [];

  // Check additions and modifications in head
  for (const [key, headNode] of headMap.entries()) {
    const baseNode = baseMap.get(key);

    if (!baseNode) {
      dependencyChanges.push({
        package: headNode.name,
        ecosystem: headNode.ecosystem,
        changeType: PR_CHANGE_TYPE.NEW_DEPENDENCY,
        oldVersion: null,
        newVersion: headNode.version,
        isDirect: headNode.isDirect,
        manifestPath: headNode.manifestPath,
      });
    } else {
      const cmp = compareVersions(headNode.version, baseNode.version);
      const isLockfileOnly = Boolean(headNode.manifestPath) &&
        (headNode.manifestPath === baseNode.manifestPath) &&
        Boolean(headNode.versionConstraint) &&
        (headNode.versionConstraint === baseNode.versionConstraint) &&
        (headNode.version !== baseNode.version);

      if (isLockfileOnly) {
        dependencyChanges.push({
          package: headNode.name,
          ecosystem: headNode.ecosystem,
          changeType: PR_CHANGE_TYPE.LOCKFILE_ONLY_CHANGE,
          oldVersion: baseNode.version,
          newVersion: headNode.version,
          isDirect: headNode.isDirect,
          note: 'Lockfile updated while manifest constraint remained unchanged.',
        });
      } else if (cmp > 0) {
        dependencyChanges.push({
          package: headNode.name,
          ecosystem: headNode.ecosystem,
          changeType: PR_CHANGE_TYPE.UPGRADED_DEPENDENCY,
          oldVersion: baseNode.version,
          newVersion: headNode.version,
          isDirect: headNode.isDirect,
        });
      } else if (cmp < 0) {
        dependencyChanges.push({
          package: headNode.name,
          ecosystem: headNode.ecosystem,
          changeType: PR_CHANGE_TYPE.DOWNGRADED_DEPENDENCY,
          oldVersion: baseNode.version,
          newVersion: headNode.version,
          isDirect: headNode.isDirect,
        });
      }
    }
  }

  // Check removals
  for (const [key, baseNode] of baseMap.entries()) {
    if (!headMap.has(key)) {
      dependencyChanges.push({
        package: baseNode.name,
        ecosystem: baseNode.ecosystem,
        changeType: PR_CHANGE_TYPE.REMOVED_DEPENDENCY,
        oldVersion: baseNode.version,
        newVersion: null,
        isDirect: baseNode.isDirect,
      });
    }
  }

  // Evaluate Vulnerabilities Introduced vs Resolved
  const baseVulnIds = new Set(baseVulnerabilities.map(v => v.id || `${v.advisoryId}:${v.package}`));
  const headVulnIds = new Set(headVulnerabilities.map(v => v.id || `${v.advisoryId}:${v.package}`));

  const vulnerabilitiesIntroduced = headVulnerabilities.filter(
    v => !baseVulnIds.has(v.id || `${v.advisoryId}:${v.package}`)
  );
  const vulnerabilitiesResolved = baseVulnerabilities.filter(
    v => !headVulnIds.has(v.id || `${v.advisoryId}:${v.package}`)
  );

  // Evaluate License Changes
  const licenseChanges = [];
  for (const [key, headNode] of headMap.entries()) {
    const baseNode = baseMap.get(key);
    if (baseNode && headNode.license && baseNode.license && headNode.license !== baseNode.license) {
      licenseChanges.push({
        package: headNode.name,
        oldLicense: baseNode.license,
        newLicense: headNode.license,
      });
    }
  }

  return {
    hasChanges: dependencyChanges.length > 0,
    totalChanges: dependencyChanges.length,
    dependencyChanges,
    securityImpact: {
      vulnerabilitiesIntroduced,
      vulnerabilitiesResolved,
      licenseChanges,
      suspiciousSignals: headSignals,
      graphDelta: {
        totalDiff: (headGraph.totalDependencies || 0) - (baseGraph.totalDependencies || 0),
        directDiff: (headGraph.directCount || 0) - (baseGraph.directCount || 0),
        transitiveDiff: (headGraph.transitiveCount || 0) - (baseGraph.transitiveCount || 0),
      }
    }
  };
}
