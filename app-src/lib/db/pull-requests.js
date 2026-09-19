/**
 * lib/db/pull-requests.js
 *
 * Pull Request scan tracking & repository persistence.
 */

// In-memory PR registry
const pullRequestStore = new Map();

/**
 * Save or update a Pull Request scan record.
 *
 * @param {object} prData
 */
export async function savePullRequestScan({
  projectId,
  repositoryId,
  pullNumber,
  title,
  author,
  branch,
  targetBranch = 'main',
  commitHash,
  status = 'OPEN',
  checkConclusion = 'success',
  findings = [],
  filesScanned = 0,
  scanId = null,
}) {
  const prKey = `${projectId}_${repositoryId}_${pullNumber}`;
  const now = new Date().toISOString();

  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;
  const low = findings.filter(f => f.severity === 'LOW').length;

  const record = {
    id: `pr_${Date.now()}_${pullNumber}`,
    projectId,
    repositoryId,
    pullNumber,
    title,
    author,
    branch,
    targetBranch,
    commitHash,
    status,
    checkConclusion,
    filesScanned,
    scanId,
    findingCount: findings.length,
    criticalCount: critical,
    highCount: high,
    mediumCount: medium,
    lowCount: low,
    lastScannedAt: now,
    updatedAt: now,
    createdAt: pullRequestStore.get(prKey)?.createdAt || now,
  };

  pullRequestStore.set(prKey, record);
  return record;
}

/**
 * List all Pull Requests for a project.
 *
 * @param {string} projectId
 * @returns {Promise<Array>}
 */
export async function listProjectPullRequests(projectId) {
  const prs = Array.from(pullRequestStore.values())
    .filter(pr => pr.projectId === projectId)
    .sort((a, b) => new Date(b.lastScannedAt) - new Date(a.lastScannedAt));

  return prs;
}

/**
 * Get a specific Pull Request scan record.
 *
 * @param {string} projectId
 * @param {number|string} pullNumber
 */
export async function getPullRequestRecord(projectId, pullNumber) {
  for (const pr of pullRequestStore.values()) {
    if (pr.projectId === projectId && String(pr.pullNumber) === String(pullNumber)) {
      return pr;
    }
  }
  return null;
}
