/**
 * @file lib/repository/intelligence/introduction-tracker.js
 * @description Tracks when and where secrets were first introduced in repository history.
 * 
 * FACTUAL & NEUTRAL LANGUAGE GUARANTEE:
 *   - Never infers malicious intent or assigns blame.
 *   - Outputs neutral attribution statements focusing on code history and process improvement.
 */

/**
 * @typedef {Object} IntroductionMetadata
 * @property {string} firstSeenCommit
 * @property {string} firstSeenShortCommit
 * @property {string} firstSeenBranch
 * @property {string} firstSeenFile
 * @property {string} firstSeenAuthor
 * @property {string} firstSeenDate
 * @property {string} introductionStatement
 */

/**
 * Derives introduction metadata for a finding given its commit history or historical scan entries.
 * 
 * @param {Object} finding 
 * @param {Array<Object>} [commitHistory=[]] - Chronological commit array (oldest first or newest first)
 * @returns {IntroductionMetadata}
 */
export function trackSecretIntroduction(finding, commitHistory = []) {
  if (!finding) {
    return {
      firstSeenCommit: '',
      firstSeenShortCommit: '',
      firstSeenBranch: '',
      firstSeenFile: '',
      firstSeenAuthor: '',
      firstSeenDate: '',
      introductionStatement: 'Introduction details unavailable'
    };
  }

  // If chronological commits provided, find the earliest commit matching this fingerprint or finding
  let earliestCommit = null;
  if (commitHistory && commitHistory.length > 0) {
    // Sort oldest first if dates are present
    const sorted = [...commitHistory].sort((a, b) => new Date(a.date || a.commitDate || 0) - new Date(b.date || b.commitDate || 0));
    earliestCommit = sorted.find(c => {
      if (c.fingerprint && finding.fingerprint && c.fingerprint === finding.fingerprint) return true;
      if (c.commitHash && finding.commitHash && c.commitHash === finding.commitHash) return true;
      return false;
    }) || sorted[0];
  }

  const commitHash = earliestCommit?.hash || earliestCommit?.commitHash || finding.commitHash || finding.firstSeenCommit || 'unknown';
  const shortHash = commitHash.length > 7 ? commitHash.slice(0, 7) : commitHash;
  const branch = earliestCommit?.branch || finding.branch || finding.firstSeenBranch || 'main';
  const file = earliestCommit?.file || finding.file || finding.firstSeenFile || 'unknown';
  const author = earliestCommit?.author || finding.author || finding.firstSeenAuthor || 'Developer';
  const date = earliestCommit?.date || earliestCommit?.commitDate || finding.commitDate || finding.firstSeenDate || new Date().toISOString().split('T')[0];

  const statement = `Introduced in commit ${shortHash} on ${date} (${file})`;

  return {
    firstSeenCommit: commitHash,
    firstSeenShortCommit: shortHash,
    firstSeenBranch: branch,
    firstSeenFile: file,
    firstSeenAuthor: author,
    firstSeenDate: date,
    introductionStatement: statement
  };
}

/**
 * Enhances a list of findings with introduction tracking metadata.
 * 
 * @param {Array<Object>} findings 
 * @param {Array<Object>} commitHistory 
 * @returns {Array<Object>}
 */
export function enrichFindingsWithIntroduction(findings, commitHistory = []) {
  return (findings || []).map(f => {
    const intro = trackSecretIntroduction(f, commitHistory);
    return {
      ...f,
      ...intro
    };
  });
}
