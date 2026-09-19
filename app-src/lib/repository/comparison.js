/**
 * @file lib/repository/comparison.js
 * @description Compares findings between two Git branches (e.g. main vs feature branch).
 * 
 * Uses deterministic secret fingerprints to categorize findings into:
 *   - NEW (INTRODUCED_BY_PR / INTRODUCED_IN_BRANCH)
 *   - RESOLVED (RESOLVED_BY_PR / REMOVED_IN_BRANCH)
 *   - PERSISTENT (EXISTING / PRE_EXISTING)
 * 
 * SECURITY:
 *   - Purely compares safe findings with masked values and fingerprints.
 */

/**
 * @typedef {'INTRODUCED_BY_PR'|'EXISTING'|'RESOLVED_BY_PR'} FindingOriginCategory
 * 
 * @typedef {Object} BranchComparisonResult
 * @property {string} baseBranch
 * @property {string} compareBranch
 * @property {Array<Object>} newFindings - Introduced in compare branch
 * @property {Array<Object>} resolvedFindings - Eliminated in compare branch
 * @property {Array<Object>} persistentFindings - Existed in base and still in compare
 * @property {Object} statistics
 * @property {number} statistics.newCount
 * @property {number} statistics.resolvedCount
 * @property {number} statistics.persistentCount
 * @property {number} statistics.baseTotal
 * @property {number} statistics.compareTotal
 * @property {'CLEAN'|'BLOCKING_SECRETS_INTRODUCED'|'EXISTING_ONLY'|'RESOLVED_ALL'} securityVerdict
 */

/**
 * Compares two sets of findings between a base branch and a compare branch.
 * 
 * @param {Array<Object>} baseFindings - Findings in the base branch (e.g. main)
 * @param {Array<Object>} compareFindings - Findings in the compare branch (e.g. feature)
 * @param {Object} [options]
 * @param {string} [options.baseBranch='main']
 * @param {string} [options.compareBranch='feature']
 * @param {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} [options.severityThreshold='LOW']
 * @returns {BranchComparisonResult}
 */
export function compareBranches(baseFindings = [], compareFindings = [], options = {}) {
  const baseBranch = options.baseBranch || 'main';
  const compareBranch = options.compareBranch || 'feature';

  const baseFpMap = new Map();
  for (const f of baseFindings || []) {
    if (f.fingerprint) {
      baseFpMap.set(f.fingerprint, f);
    }
  }

  const compareFpMap = new Map();
  for (const f of compareFindings || []) {
    if (f.fingerprint) {
      compareFpMap.set(f.fingerprint, f);
    }
  }

  const newFindings = [];
  const persistentFindings = [];
  const resolvedFindings = [];

  // Check compare findings
  for (const [fp, finding] of compareFpMap.entries()) {
    if (baseFpMap.has(fp)) {
      // Existed in base branch -> PERSISTENT / EXISTING
      persistentFindings.push({
        ...finding,
        originCategory: 'EXISTING',
        originLabel: 'Pre-existing finding (in base branch)',
        isIntroducedInBranch: false
      });
    } else {
      // Newly added -> INTRODUCED
      newFindings.push({
        ...finding,
        originCategory: 'INTRODUCED_BY_PR',
        originLabel: 'Newly introduced in this branch',
        isIntroducedInBranch: true
      });
    }
  }

  // Check base findings that are no longer in compare branch -> RESOLVED
  for (const [fp, finding] of baseFpMap.entries()) {
    if (!compareFpMap.has(fp)) {
      resolvedFindings.push({
        ...finding,
        originCategory: 'RESOLVED_BY_PR',
        originLabel: 'Resolved in this branch',
        isResolvedInBranch: true
      });
    }
  }

  // Verdict calculation
  let securityVerdict = 'CLEAN';
  if (newFindings.length > 0) {
    securityVerdict = 'BLOCKING_SECRETS_INTRODUCED';
  } else if (persistentFindings.length > 0) {
    securityVerdict = 'EXISTING_ONLY';
  } else if (resolvedFindings.length > 0 && compareFindings.length === 0) {
    securityVerdict = 'RESOLVED_ALL';
  }

  return {
    baseBranch,
    compareBranch,
    newFindings,
    resolvedFindings,
    persistentFindings,
    statistics: {
      newCount: newFindings.length,
      resolvedCount: resolvedFindings.length,
      persistentCount: persistentFindings.length,
      baseTotal: baseFindings.length,
      compareTotal: compareFindings.length
    },
    securityVerdict
  };
}
