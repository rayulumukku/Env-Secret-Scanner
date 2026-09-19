/**
 * @file lib/repository/intelligence/exposure-timeline.js
 * @description Generates an exposure timeline for a secret fingerprint across commits and scans.
 * 
 * SECURITY:
 *   - NEVER exposes the underlying raw secret value.
 *   - Aggregates strictly masked findings, fingerprints, and commit metadata.
 */

/**
 * @typedef {Object} TimelineEvent
 * @property {'FIRST_DETECTED'|'OBSERVED_IN_COMMIT'|'RESCAN'|'REMOVED_FROM_SOURCE'|'STATUS_CHANGE'} eventType
 * @property {string} timestamp
 * @property {string} title
 * @property {string} description
 * @property {string} [commitHash]
 * @property {string} [commitShort]
 * @property {string} [author]
 * @property {string} [file]
 * @property {number} [line]
 */

/**
 * @typedef {Object} ExposureTimeline
 * @property {string} fingerprint
 * @property {string} ruleId
 * @property {string} ruleName
 * @property {string} severity
 * @property {string} maskedValue
 * @property {string} firstDetectedDate
 * @property {string} firstDetectedCommit
 * @property {string} lastDetectedDate
 * @property {string} lastDetectedCommit
 * @property {number} occurrencesCount
 * @property {'ACTIVE_IN_SOURCE'|'REMOVED_FROM_CURRENT_SOURCE'} currentStatus
 * @property {TimelineEvent[]} timeline
 */

/**
 * Computes the exposure timeline for a given fingerprint from its scan/commit history.
 * 
 * @param {string} fingerprint 
 * @param {Array<Object>} occurrences - Finding instances sharing this fingerprint
 * @param {boolean} [isPresentInHead=true] - Whether currently found in latest branch HEAD
 * @returns {ExposureTimeline}
 */
export function buildExposureTimeline(fingerprint, occurrences = [], isPresentInHead = true) {
  if (!occurrences || occurrences.length === 0) {
    return {
      fingerprint: fingerprint || 'unknown',
      ruleId: 'UNKNOWN',
      ruleName: 'Secret Finding',
      severity: 'HIGH',
      maskedValue: '••••••••',
      firstDetectedDate: new Date().toISOString(),
      firstDetectedCommit: 'initial',
      lastDetectedDate: new Date().toISOString(),
      lastDetectedCommit: 'latest',
      occurrencesCount: 0,
      currentStatus: isPresentInHead ? 'ACTIVE_IN_SOURCE' : 'REMOVED_FROM_CURRENT_SOURCE',
      timeline: []
    };
  }

  // Sort chronological
  const sorted = [...occurrences].sort((a, b) => {
    const da = new Date(a.date || a.commitDate || a.createdAt || 0);
    const db = new Date(b.date || b.commitDate || b.createdAt || 0);
    return da - db;
  });

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const firstCommit = first.commitHash || first.firstSeenCommit || 'initial';
  const firstShort = firstCommit.length > 7 ? firstCommit.slice(0, 7) : firstCommit;
  const firstDate = first.date || first.commitDate || first.createdAt || new Date().toISOString();

  const lastCommit = last.commitHash || 'latest';
  const lastShort = lastCommit.length > 7 ? lastCommit.slice(0, 7) : lastCommit;
  const lastDate = last.date || last.commitDate || last.createdAt || new Date().toISOString();

  const timeline = [];

  // Event 1: First Introduction
  timeline.push({
    eventType: 'FIRST_DETECTED',
    timestamp: firstDate,
    title: `First detected in commit ${firstShort}`,
    description: `Introduced by ${first.author || 'Developer'} in ${first.file || 'unknown'} (Line ${first.line || 1})`,
    commitHash: firstCommit,
    commitShort: firstShort,
    author: first.author || 'Developer',
    file: first.file,
    line: first.line
  });

  // Intermediate commits (if multiple distinct commits)
  const seenCommits = new Set([firstCommit]);
  for (let i = 1; i < sorted.length; i++) {
    const occ = sorted[i];
    const cHash = occ.commitHash || 'commit';
    if (!seenCommits.has(cHash)) {
      seenCommits.add(cHash);
      const cShort = cHash.length > 7 ? cHash.slice(0, 7) : cHash;
      timeline.push({
        eventType: 'OBSERVED_IN_COMMIT',
        timestamp: occ.date || occ.commitDate || occ.createdAt || new Date().toISOString(),
        title: `Observed in commit ${cShort}`,
        description: `Persisted in ${occ.file || 'repository'} (Line ${occ.line || 1})`,
        commitHash: cHash,
        commitShort: cShort,
        author: occ.author,
        file: occ.file,
        line: occ.line
      });
    }
  }

  // Event 3: Current Status Event
  if (!isPresentInHead) {
    timeline.push({
      eventType: 'REMOVED_FROM_SOURCE',
      timestamp: new Date().toISOString(),
      title: 'Removed from active branch source code',
      description: 'The secret is no longer present in current files. Notice: Revoke and rotate this credential in the provider console to eliminate historical risk.',
      commitHash: lastCommit,
      commitShort: lastShort
    });
  }

  return {
    fingerprint,
    ruleId: first.ruleId || 'GENERIC_SECRET',
    ruleName: first.ruleName || first.ruleId || 'Secret Finding',
    severity: first.severity || 'HIGH',
    maskedValue: first.maskedValue || '••••••••',
    firstDetectedDate: typeof firstDate === 'string' ? firstDate.split('T')[0] : String(firstDate),
    firstDetectedCommit: firstShort,
    lastDetectedDate: typeof lastDate === 'string' ? lastDate.split('T')[0] : String(lastDate),
    lastDetectedCommit: lastShort,
    occurrencesCount: sorted.length,
    currentStatus: isPresentInHead ? 'ACTIVE_IN_SOURCE' : 'REMOVED_FROM_CURRENT_SOURCE',
    timeline
  };
}
