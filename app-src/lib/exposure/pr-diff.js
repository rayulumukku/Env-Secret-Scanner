/**
 * lib/exposure/pr-diff.js
 *
 * Change-Based Intelligence & Pull Request Finding Classification Engine.
 *
 * CLASSIFICATIONS:
 * - INTRODUCED_BY_PR: Newly added secret in PR diff lines
 * - EXISTING_BEFORE_PR: Pre-existing secret in target base branch (non-blocking)
 * - REMOVED_BY_PR: Secret removed from active file by PR
 * - RESURFACED_BY_PR: Historical secret reappearing in PR changes
 * - RESOLVED_BY_PR: Secret confirmed resolved/rotated
 */

export const PR_FINDING_CLASSIFICATIONS = {
  INTRODUCED_BY_PR: 'INTRODUCED_BY_PR',
  EXISTING_BEFORE_PR: 'EXISTING_BEFORE_PR',
  REMOVED_BY_PR: 'REMOVED_BY_PR',
  RESURFACED_BY_PR: 'RESURFACED_BY_PR',
  RESOLVED_BY_PR: 'RESOLVED_BY_PR',
};

/**
 * Classify findings in a PR branch against base branch findings and repository history.
 *
 * @param {object} params
 * @param {object[]} params.prFindings - Findings detected on the PR branch
 * @param {object[]} params.baseFindings - Findings detected on the target base branch
 * @param {object[]} [params.historicalFingerprints=[]] - Set of fingerprints known in historical git history
 * @returns {object} Classified findings summary
 */
export function classifyPullRequestFindings({
  prFindings = [],
  baseFindings = [],
  historicalFingerprints = [],
}) {
  const baseFpSet = new Set(baseFindings.map(f => f.fingerprint).filter(Boolean));
  const prFpSet = new Set(prFindings.map(f => f.fingerprint).filter(Boolean));
  const historicalFpSet = new Set(historicalFingerprints);

  const introduced = [];
  const existing = [];
  const resurfaced = [];
  const removed = [];

  // Evaluate PR branch findings
  for (const f of prFindings) {
    const fp = f.fingerprint;
    if (baseFpSet.has(fp)) {
      existing.push({
        ...f,
        classification: PR_FINDING_CLASSIFICATIONS.EXISTING_BEFORE_PR,
        isBlocking: false,
        reason: 'Pre-existed on base branch before this PR',
      });
    } else if (historicalFpSet.has(fp)) {
      resurfaced.push({
        ...f,
        classification: PR_FINDING_CLASSIFICATIONS.RESURFACED_BY_PR,
        isBlocking: true,
        reason: 'Historical secret previously deleted has resurfaced in this PR',
      });
      introduced.push(f);
    } else {
      introduced.push({
        ...f,
        classification: PR_FINDING_CLASSIFICATIONS.INTRODUCED_BY_PR,
        isBlocking: true,
        reason: 'Newly committed credential introduced in this PR',
      });
    }
  }

  // Detect secrets removed by PR
  for (const baseFinding of baseFindings) {
    if (!prFpSet.has(baseFinding.fingerprint)) {
      removed.push({
        ...baseFinding,
        classification: PR_FINDING_CLASSIFICATIONS.REMOVED_BY_PR,
        reason: 'Secret removed from active source code in PR changes',
      });
    }
  }

  const isPassed = introduced.length === 0;

  return {
    isPassed,
    status: isPassed ? 'PASSED' : 'FAILED',
    counts: {
      introduced: introduced.length,
      existing: existing.length,
      resurfaced: resurfaced.length,
      removed: removed.length,
      totalPRFindings: prFindings.length,
    },
    introducedFindings: introduced,
    existingFindings: existing,
    resurfacedFindings: resurfaced,
    removedFindings: removed,
  };
}
