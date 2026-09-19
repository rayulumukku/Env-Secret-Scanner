/**
 * @file lib/repository/intelligence/removal-tracker.js
 * @description Tracks secret disappearance from current branch HEAD.
 * 
 * FACTUAL & SECURITY GUARANTEE:
 *   - Factual display: "Detected: abc123", "Removed: def456", "Current source: Not detected".
 *   - Does NOT claim the credential was revoked (states clearly that rotation is required).
 */

/**
 * @typedef {Object} RemovalStatus
 * @property {boolean} isRemovedFromCurrentSource
 * @property {'PRESENT'|'REMOVED_FROM_CURRENT_SOURCE'} currentSourceStatus
 * @property {string} detectedCommit
 * @property {string} [removedCommit]
 * @property {string} statusSummary
 * @property {string} advisoryNote
 */

/**
 * Evaluates whether a historical finding has been removed from the current branch source code.
 * 
 * @param {Object} historicalFinding - The past finding
 * @param {Array<Object>} currentHeadFindings - All active findings in the current branch HEAD
 * @param {string} [removedInCommit] - Optional commit hash where code was modified
 * @returns {RemovalStatus}
 */
export function trackSecretRemoval(historicalFinding, currentHeadFindings = [], removedInCommit = null) {
  if (!historicalFinding) {
    return {
      isRemovedFromCurrentSource: false,
      currentSourceStatus: 'PRESENT',
      detectedCommit: 'unknown',
      statusSummary: 'Status unavailable',
      advisoryNote: 'Review finding state.'
    };
  }

  // Correlate by fingerprint
  const isPresentInHead = (currentHeadFindings || []).some(
    hf => hf.fingerprint === historicalFinding.fingerprint
  );

  const detectedCommit = historicalFinding.firstSeenShortCommit 
    || (historicalFinding.commitHash ? historicalFinding.commitHash.slice(0, 7) : 'initial');

  if (!isPresentInHead) {
    const removedShort = removedInCommit ? (removedInCommit.length > 7 ? removedInCommit.slice(0, 7) : removedInCommit) : 'latest';
    
    return {
      isRemovedFromCurrentSource: true,
      currentSourceStatus: 'REMOVED_FROM_CURRENT_SOURCE',
      detectedCommit,
      removedCommit: removedShort,
      statusSummary: `Detected: ${detectedCommit} | Removed: ${removedShort} | Current source: Not detected`,
      advisoryNote: 'The secret is no longer in current source files. However, Git history still contains the commit — ensure the credential is rotated in your provider portal.'
    };
  }

  return {
    isRemovedFromCurrentSource: false,
    currentSourceStatus: 'PRESENT',
    detectedCommit,
    statusSummary: `Detected: ${detectedCommit} | Current source: Active in source tree`,
    advisoryNote: 'The credential remains present in the active branch. Immediate remediation required.'
  };
}

/**
 * Categorizes a collection of historical findings against current HEAD findings.
 * 
 * @param {Array<Object>} historicalFindings 
 * @param {Array<Object>} currentHeadFindings 
 * @returns {{ activeInSource: Array<Object>, removedFromSource: Array<Object> }}
 */
export function partitionFindingsBySourcePresence(historicalFindings = [], currentHeadFindings = []) {
  const currentFpSet = new Set((currentHeadFindings || []).map(f => f.fingerprint));

  const activeInSource = [];
  const removedFromSource = [];

  for (const hf of historicalFindings) {
    if (currentFpSet.has(hf.fingerprint)) {
      activeInSource.push({
        ...hf,
        ...trackSecretRemoval(hf, currentHeadFindings)
      });
    } else {
      removedFromSource.push({
        ...hf,
        ...trackSecretRemoval(hf, currentHeadFindings)
      });
    }
  }

  return {
    activeInSource,
    removedFromSource
  };
}
