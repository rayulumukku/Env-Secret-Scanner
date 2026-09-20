/**
 * lib/exposure/timeline.js
 *
 * Evidence-backed Chronological Exposure Timeline Generator for SecretShield.
 *
 * Tracks every lifecycle phase of a secret across repositories, commits, branches, and remediation events.
 */

import { EVIDENCE_TYPES, createEvidence } from './evidence.js';
import { calculateExposureDuration } from './model.js';

export const TIMELINE_EVENT_TYPES = {
  FIRST_INTRODUCED: 'FIRST_INTRODUCED',
  FIRST_DETECTED: 'FIRST_DETECTED',
  BRANCH_PROPAGATION: 'BRANCH_PROPAGATION',
  CROSS_REPO_PROPAGATION: 'CROSS_REPO_PROPAGATION',
  DELETED_FROM_SOURCE: 'DELETED_FROM_SOURCE',
  RESURFACED_IN_PR: 'RESURFACED_IN_PR',
  LATEST_EXPOSURE: 'LATEST_EXPOSURE',
  REMEDIATION_ACTION: 'REMEDIATION_ACTION',
  VERIFICATION_SCAN: 'VERIFICATION_SCAN',
};

/**
 * Generate an evidence-backed chronological exposure timeline for a given secret fingerprint.
 *
 * @param {object} params
 * @param {string} params.fingerprint
 * @param {object[]} params.findings - All historical and active finding records matching this fingerprint
 * @param {object[]} [params.gitEvents=[]] - Git commit / diff history events
 * @param {object[]} [params.remediationEvents=[]] - Remediation status transitions
 * @param {object[]} [params.verificationScans=[]] - Post-remediation verification scans
 * @returns {object} Complete timeline with metrics and chronological events
 */
export function generateExposureTimeline({
  fingerprint,
  findings = [],
  gitEvents = [],
  remediationEvents = [],
  verificationScans = [],
}) {
  const events = [];
  const seenRepositories = new Set();
  const seenBranches = new Set();
  const seenCommits = new Set();
  const seenFiles = new Set();

  // 1. Sort all findings chronologically by commit date or detection date
  const sortedFindings = [...findings].sort((a, b) => {
    const timeA = new Date(a.commitDate || a.firstSeenAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.commitDate || b.firstSeenAt || b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  if (sortedFindings.length > 0) {
    const earliest = sortedFindings[0];
    const latest = sortedFindings[sortedFindings.length - 1];

    // First Introduction / First Detection Event
    const firstEvidence = createEvidence({
      type: earliest.commitHash ? EVIDENCE_TYPES.GIT_COMMIT : EVIDENCE_TYPES.SCANNER_RESULT,
      sourceId: earliest.commitHash || earliest.id,
      fingerprint,
      repositoryId: earliest.repositoryId,
      repositoryName: earliest.repositoryName,
      commitHash: earliest.commitHash,
      branch: earliest.branch,
      file: earliest.file,
      summary: earliest.commitHash
        ? `Secret first introduced in commit ${earliest.commitHash.slice(0, 8)} (${earliest.file})`
        : `Secret first discovered by scanner in ${earliest.file} on line ${earliest.line || 1}`,
      metadata: { author: earliest.author, line: earliest.line },
    });

    events.push({
      id: `evt_first_${earliest.id}`,
      type: earliest.commitHash ? TIMELINE_EVENT_TYPES.FIRST_INTRODUCED : TIMELINE_EVENT_TYPES.FIRST_DETECTED,
      timestamp: earliest.commitDate || earliest.firstSeenAt || earliest.createdAt,
      title: earliest.commitHash ? 'Secret Introduced in Git Commit' : 'First Detected in Source File',
      description: earliest.commitHash
        ? `Committed by ${earliest.author || 'Unknown'} into ${earliest.file}`
        : `Discovered in ${earliest.file} (Line ${earliest.line || 1})`,
      repositoryId: earliest.repositoryId,
      repositoryName: earliest.repositoryName,
      branch: earliest.branch || 'main',
      commitHash: earliest.commitHash,
      file: earliest.file,
      evidence: firstEvidence,
      severity: earliest.severity,
      badge: 'First Appearance',
    });

    // Track initial context
    if (earliest.repositoryId) seenRepositories.add(earliest.repositoryId);
    if (earliest.branch) seenBranches.add(earliest.branch);
    if (earliest.commitHash) seenCommits.add(earliest.commitHash);
    if (earliest.file) seenFiles.add(earliest.file);

    // Subsequent Appearances and Propagations
    for (let i = 1; i < sortedFindings.length; i++) {
      const f = sortedFindings[i];
      const isNewRepo = f.repositoryId && !seenRepositories.has(f.repositoryId);
      const isNewBranch = f.branch && !seenBranches.has(f.branch);
      const isNewCommit = f.commitHash && !seenCommits.has(f.commitHash);

      if (isNewRepo) {
        seenRepositories.add(f.repositoryId);
        events.push({
          id: `evt_repo_${f.id}`,
          type: TIMELINE_EVENT_TYPES.CROSS_REPO_PROPAGATION,
          timestamp: f.commitDate || f.firstSeenAt || f.createdAt,
          title: 'Cross-Repository Exposure Detected',
          description: `Identical secret fingerprint detected in repository '${f.repositoryName || f.repositoryId}' (${f.file})`,
          repositoryId: f.repositoryId,
          repositoryName: f.repositoryName,
          branch: f.branch || 'main',
          commitHash: f.commitHash,
          file: f.file,
          evidence: createEvidence({
            type: EVIDENCE_TYPES.SCANNER_RESULT,
            sourceId: f.id,
            fingerprint,
            repositoryId: f.repositoryId,
            repositoryName: f.repositoryName,
            summary: `Secret fingerprint matched in repository '${f.repositoryName || f.repositoryId}'`,
          }),
          severity: f.severity,
          badge: 'Cross-Repository',
        });
      } else if (isNewBranch) {
        seenBranches.add(f.branch);
        events.push({
          id: `evt_branch_${f.id}`,
          type: TIMELINE_EVENT_TYPES.BRANCH_PROPAGATION,
          timestamp: f.commitDate || f.firstSeenAt || f.createdAt,
          title: `Propagated to Branch: ${f.branch}`,
          description: `Exposure observed on branch '${f.branch}' in ${f.file}`,
          repositoryId: f.repositoryId,
          repositoryName: f.repositoryName,
          branch: f.branch,
          commitHash: f.commitHash,
          file: f.file,
          evidence: createEvidence({
            type: EVIDENCE_TYPES.GIT_COMMIT,
            sourceId: f.commitHash || f.id,
            fingerprint,
            branch: f.branch,
            file: f.file,
            summary: `Observed on branch '${f.branch}'`,
          }),
          severity: f.severity,
          badge: 'Branch Expansion',
        });
      }

      if (f.commitHash) seenCommits.add(f.commitHash);
      if (f.file) seenFiles.add(f.file);
    }

    // Latest Known Exposure Event (if multiple occurrences)
    if (sortedFindings.length > 1) {
      events.push({
        id: `evt_latest_${latest.id}`,
        type: TIMELINE_EVENT_TYPES.LATEST_EXPOSURE,
        timestamp: latest.lastSeenAt || latest.updatedAt || new Date().toISOString(),
        title: 'Latest Known Active Exposure',
        description: `Most recent active finding verified in ${latest.file} (${latest.repositoryName || 'repository'})`,
        repositoryId: latest.repositoryId,
        repositoryName: latest.repositoryName,
        branch: latest.branch || 'main',
        commitHash: latest.commitHash,
        file: latest.file,
        evidence: createEvidence({
          type: EVIDENCE_TYPES.SCANNER_RESULT,
          sourceId: latest.id,
          fingerprint,
          repositoryId: latest.repositoryId,
          summary: `Latest active finding verified in ${latest.file}`,
        }),
        severity: latest.severity,
        badge: 'Latest Scan',
      });
    }
  }

  // 2. Add Historical Git Removal / Resurfacing Events
  for (const gitEvt of gitEvents) {
    events.push({
      id: `evt_git_${gitEvt.id || Math.random().toString(36).slice(2, 8)}`,
      type: gitEvt.isDeleted ? TIMELINE_EVENT_TYPES.DELETED_FROM_SOURCE : TIMELINE_EVENT_TYPES.RESURFACED_IN_PR,
      timestamp: gitEvt.timestamp || new Date().toISOString(),
      title: gitEvt.isDeleted ? 'Secret Deleted From File (Preserved in Git History)' : 'Historical Secret Resurfaced in PR',
      description: gitEvt.summary || (gitEvt.isDeleted
        ? `Secret removed in commit ${gitEvt.commitHash?.slice(0, 8) || 'HEAD'}, but previous commit history still contains credential.`
        : `Pull request #${gitEvt.prNumber} modified lines containing previously exposed secret.`),
      repositoryId: gitEvt.repositoryId,
      repositoryName: gitEvt.repositoryName,
      branch: gitEvt.branch,
      commitHash: gitEvt.commitHash,
      file: gitEvt.file,
      evidence: createEvidence({
        type: EVIDENCE_TYPES.GIT_DIFF,
        sourceId: gitEvt.commitHash || gitEvt.prNumber || 'diff',
        fingerprint,
        repositoryId: gitEvt.repositoryId,
        summary: gitEvt.summary || 'Git history transition event',
      }),
      severity: 'HIGH',
      badge: gitEvt.isDeleted ? 'Source Removed' : 'PR Resurfaced',
    });
  }

  // 3. Add Remediation & Verification Events
  for (const rem of remediationEvents) {
    events.push({
      id: `evt_rem_${rem.id || Math.random().toString(36).slice(2, 8)}`,
      type: TIMELINE_EVENT_TYPES.REMEDIATION_ACTION,
      timestamp: rem.timestamp || rem.createdAt || new Date().toISOString(),
      title: `Remediation Status: ${rem.status || 'ROTATED'}`,
      description: rem.note || `Remediation initiated by ${rem.author || 'Security Admin'}. Credential rotation marked in provider console.`,
      repositoryId: rem.repositoryId,
      evidence: createEvidence({
        type: EVIDENCE_TYPES.REMEDIATION_EVENT,
        sourceId: rem.id || 'rem_event',
        fingerprint,
        summary: rem.note || 'Remediation event logged',
      }),
      severity: 'LOW',
      badge: 'Remediation',
    });
  }

  for (const ver of verificationScans) {
    events.push({
      id: `evt_ver_${ver.scanId || Math.random().toString(36).slice(2, 8)}`,
      type: TIMELINE_EVENT_TYPES.VERIFICATION_SCAN,
      timestamp: ver.scannedAt || new Date().toISOString(),
      title: 'Verification Scan Completed',
      description: ver.isClean
        ? 'Automated repository scan verified zero remaining occurrences in active source code.'
        : 'Verification scan detected remaining occurrences in repository history.',
      repositoryId: ver.repositoryId,
      evidence: createEvidence({
        type: EVIDENCE_TYPES.VERIFICATION_SCAN,
        sourceId: ver.scanId || 'scan',
        fingerprint,
        summary: `Verification scan completed (clean: ${Boolean(ver.isClean)})`,
      }),
      severity: ver.isClean ? 'LOW' : 'HIGH',
      badge: ver.isClean ? 'Verified Clean' : 'Verification Alert',
    });
  }

  // Sort final merged event stream chronologically
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate durations
  const earliestTimestamp = events[0]?.timestamp || new Date().toISOString();
  const latestTimestamp = events[events.length - 1]?.timestamp || earliestTimestamp;
  const isResolved = remediationEvents.some(r => r.status === 'REMEDIATED' || r.status === 'VERIFIED');

  const durations = calculateExposureDuration({
    firstSeenAt: earliestTimestamp,
    lastSeenAt: latestTimestamp,
    introducedAt: earliestTimestamp,
    isResolved,
  });

  return {
    fingerprint,
    totalEvents: events.length,
    affectedRepositoriesCount: seenRepositories.size || 1,
    affectedBranchesCount: seenBranches.size || 1,
    affectedCommitsCount: seenCommits.size || 1,
    affectedFilesCount: seenFiles.size || 1,
    firstSeenAt: earliestTimestamp,
    lastSeenAt: latestTimestamp,
    durations,
    events,
  };
}
