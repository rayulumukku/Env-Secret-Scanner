/**
 * @file lib/repository/intelligence/multi-repo.js
 * @description Multi-repository correlation for secret fingerprints within an organization.
 * 
 * ORGANIZATIONAL ISOLATION GUARANTEE:
 *   - Correlates findings ONLY within the same organizationId.
 *   - Never leaks finding data or repository names across organization boundaries.
 *   - NEVER reveals the raw secret — only safe repository names and counts.
 */

/**
 * @typedef {Object} RepoCorrelationResult
 * @property {string} fingerprint
 * @property {number} repositoryCount
 * @property {string[]} repositoryNames
 * @property {string} summary
 * @property {Array<{ repositoryId: string, repositoryName: string, file: string, line: number }>} occurrences
 */

/**
 * Correlates findings across multiple repositories within an organization.
 * 
 * @param {Array<Object>} organizationFindings - Findings from repositories belonging to one organization
 * @param {string} targetOrganizationId - Target organization to verify boundary
 * @returns {Map<string, RepoCorrelationResult>} Map of fingerprint -> RepoCorrelationResult
 */
export function correlateOrganizationFindings(organizationFindings = [], targetOrganizationId) {
  const correlationMap = new Map();

  for (const finding of organizationFindings) {
    // Validate organization boundary
    if (finding.organizationId && targetOrganizationId && finding.organizationId !== targetOrganizationId) {
      continue; // Skip out-of-boundary finding
    }

    const fp = finding.fingerprint;
    if (!fp) continue;

    const repoName = finding.repositoryName || finding.repository?.name || finding.repositoryId || 'unknown-repo';
    const repoId = finding.repositoryId || repoName;

    if (!correlationMap.has(fp)) {
      correlationMap.set(fp, {
        fingerprint: fp,
        repositoryCount: 0,
        repositoryNames: [],
        summary: '',
        occurrences: []
      });
    }

    const entry = correlationMap.get(fp);
    entry.occurrences.push({
      repositoryId: repoId,
      repositoryName: repoName,
      file: finding.file || 'unknown',
      line: finding.line || 1
    });

    if (!entry.repositoryNames.includes(repoName)) {
      entry.repositoryNames.push(repoName);
    }
  }

  // Finalize counts and summaries
  for (const entry of correlationMap.values()) {
    entry.repositoryCount = entry.repositoryNames.length;
    if (entry.repositoryCount > 1) {
      entry.summary = `Detected across ${entry.repositoryCount} repositories (${entry.repositoryNames.join(', ')})`;
    } else {
      entry.summary = `Detected in 1 repository (${entry.repositoryNames[0] || 'local'})`;
    }
  }

  return correlationMap;
}

/**
 * Gets the correlation summary for a specific fingerprint in an organization.
 * 
 * @param {string} fingerprint 
 * @param {Array<Object>} organizationFindings 
 * @param {string} organizationId 
 * @returns {RepoCorrelationResult|null}
 */
export function getFingerprintMultiRepoCorrelation(fingerprint, organizationFindings = [], organizationId) {
  const map = correlateOrganizationFindings(organizationFindings, organizationId);
  return map.get(fingerprint) || null;
}
