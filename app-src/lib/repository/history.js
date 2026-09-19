/**
 * lib/repository/history.js
 *
 * Two responsibilities:
 *
 * 1. Scan metadata store — recordScan / getScanRecord / listScanRecords
 *    Stores ONLY safe metadata (no raw secrets, no raw file content).
 *
 * 2. Local Git history scanner — scanGitHistory(repositoryPath, options)
 *    Uses git.js to walk commits in a local git repository and scans
 *    only added/changed lines for secrets.
 *
 * SECURITY:
 *   - Raw secrets never stored or returned
 *   - All findings masked at detection time
 *   - Commit content never returned in full if it contains secrets
 */

import { isGitRepository, getRepositoryInfo, listCommits, getCommitDiff } from './git.js';
import { extractAddedLines, scanCommitDiff as scanGitHubCommitDiff } from './commit-scanner.js';
import { scan } from '../scanner/engine.js';
import { createCommit, ExposureStatus } from '../models/index.js';

// ── SCAN METADATA STORE ────────────────────────────────────────────────────────

// In-memory store for the server session (resets on server restart).
// The real persistence happens in the client via localStorage (safe metadata only).
const serverSideHistory = new Map();

/**
 * Record a completed repository scan.
 * Stores only safe metadata — no raw secrets, no raw file content.
 *
 * @param {object} scanResult - result from scanZipRepository or GitHub scan
 * @returns {object} safe history record
 */
export function recordScan(scanResult) {
  const record = {
    scanId:    scanResult.scanId,
    status:    scanResult.status,
    timestamp: scanResult.timestamp,
    duration:  scanResult.duration,
    repository: {
      name:          scanResult.repository?.name,
      archiveName:   scanResult.repository?.archiveName,
      type:          scanResult.repository?.type,
      provider:      scanResult.repository?.provider,
      owner:         scanResult.repository?.owner,
      repo:          scanResult.repository?.repo,
      branch:        scanResult.repository?.branch,
      fullName:      scanResult.repository?.fullName,
      htmlUrl:       scanResult.repository?.htmlUrl,
      isPrivate:     scanResult.repository?.isPrivate,
    },
    statistics: {
      total:        scanResult.statistics?.total        ?? 0,
      critical:     scanResult.statistics?.CRITICAL     ?? 0,
      high:         scanResult.statistics?.HIGH         ?? 0,
      medium:       scanResult.statistics?.MEDIUM       ?? 0,
      low:          scanResult.statistics?.LOW          ?? 0,
      filesScanned: scanResult.statistics?.filesScanned ?? 0,
      filesSkipped: scanResult.statistics?.filesSkipped ?? 0,
      riskScore:    scanResult.statistics?.riskScore    ?? 0,
    },
    // Fingerprints of findings so the client can reference them
    findingFingerprints: (scanResult.findings || []).map(f => f.fingerprint).filter(Boolean),
  };

  serverSideHistory.set(record.scanId, record);
  return record;
}

/**
 * Get a scan record by ID (metadata only).
 * @param {string} scanId
 * @returns {object|null}
 */
export function getScanRecord(scanId) {
  return serverSideHistory.get(scanId) ?? null;
}

/**
 * List all scan records (metadata only).
 * @returns {object[]}
 */
export function listScanRecords() {
  return Array.from(serverSideHistory.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ── LOCAL GIT HISTORY SCANNER ─────────────────────────────────────────────────

const MAX_COMMITS_DEFAULT = 200;
const ABSOLUTE_MAX_COMMITS = 1000;
const BATCH_SIZE = 10; // commits to process in parallel

/**
 * Scan the Git history of a local repository for exposed secrets.
 *
 * This is used when a developer has SecretShield running locally against
 * their own repository (not via GitHub API).
 *
 * @param {string} repositoryPath - absolute path to the local git repository
 * @param {object} options
 * @param {number}   [options.maxCommits=200]
 * @param {Set}      [options.currentFingerprints] - fingerprints in current scan
 * @param {string[]} [options.allowlistFingerprints]
 * @param {function} [options.onProgress]
 * @returns {Promise<object>} history scan result
 */
export async function scanGitHistory(repositoryPath, options = {}) {
  const {
    maxCommits           = MAX_COMMITS_DEFAULT,
    currentFingerprints  = new Set(),
    allowlistFingerprints = [],
    onProgress,
  } = options;

  const startTime = Date.now();
  const cappedMax = Math.min(maxCommits, ABSOLUTE_MAX_COMMITS);

  function progress(stage, detail = {}) {
    if (typeof onProgress === 'function') {
      onProgress({ stage, ...detail, elapsed: Date.now() - startTime });
    }
  }

  // ── VALIDATION ──────────────────────────────────────────────────────────────
  progress('checking', { message: 'Validating repository…' });

  const isRepo = await isGitRepository(repositoryPath).catch(() => false);
  if (!isRepo) {
    throw new Error(`Not a git repository: ${repositoryPath}`);
  }

  const repoInfo = await getRepositoryInfo(repositoryPath);
  progress('info', {
    message: `Repository: ${repoInfo.branch}, ${repoInfo.commitCount} commits`,
    commitCount: repoInfo.commitCount,
    branch: repoInfo.branch,
  });

  // ── FETCH COMMITS ────────────────────────────────────────────────────────────
  progress('fetching', { message: 'Fetching commit list…' });

  const commits = await listCommits(repositoryPath, {
    branch:   repoInfo.branch,
    maxCount: cappedMax,
  });

  if (commits.length === 0) {
    return {
      repositoryPath,
      repoInfo,
      scannedCommits: [],
      lifecycles: [],
      statistics: {
        totalCommits: 0, commitsScanned: 0,
        totalFindings: 0, activeFindings: 0, removedFindings: 0,
        duration: Date.now() - startTime,
      },
    };
  }

  progress('fetched', {
    message: `Fetched ${commits.length} commits`,
    commitsTotal: commits.length,
  });

  // ── SCAN COMMITS ─────────────────────────────────────────────────────────────
  const findingsByFingerprint = new Map(); // fingerprint → { finding, commits[] }
  const scannedCommits = [];
  let commitsScanned = 0;

  // Process in batches to limit memory usage
  for (let i = 0; i < commits.length; i += BATCH_SIZE) {
    const batch = commits.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (commit) => {
      commitsScanned++;

      progress('scanning', {
        message: `Scanning commit ${commitsScanned} / ${commits.length}`,
        commitsTotal: commits.length,
        commitsScanned,
        currentCommit: commit.shortHash,
      });

      // Get diff for this commit
      let diffFiles = [];
      try {
        diffFiles = await getCommitDiff(repositoryPath, commit.hash);
      } catch {
        // Skip commits that can't be diffed (merge commits, broken history, etc.)
        scannedCommits.push(createCommit({ ...commit, findings: [] }));
        return;
      }

      // Extract only added lines for scanning (efficient — skip unchanged code)
      const virtualFiles = extractAddedLines(diffFiles);

      let findings = [];
      if (virtualFiles.length > 0) {
        const scanResult = scan({ files: virtualFiles, allowlistFingerprints });

        // Enrich findings with commit metadata
        findings = (scanResult.findings || []).map(f => ({
          ...f,
          commitHash:    commit.hash,
          shortHash:     commit.shortHash,
          author:        commit.author,
          authorEmail:   commit.authorEmail,
          commitDate:    commit.date,
          commitMessage: commit.message,
          exposureStatus: ExposureStatus.REMOVED, // caller updates based on current scan
        }));
      }

      const commitRecord = createCommit({
        hash:         commit.hash,
        message:      commit.message,
        author:       commit.author,
        authorEmail:  commit.authorEmail,
        date:         commit.date,
        addedLines:   diffFiles.reduce((s, f) => s + f.addedLines, 0),
        deletedLines: diffFiles.reduce((s, f) => s + f.deletedLines, 0),
        filesChanged: diffFiles.map(f => f.filename),
        findings,
      });

      scannedCommits.push(commitRecord);

      // Aggregate by fingerprint for lifecycle tracking
      for (const finding of findings) {
        if (!finding.fingerprint) continue;
        if (!findingsByFingerprint.has(finding.fingerprint)) {
          findingsByFingerprint.set(finding.fingerprint, { finding, commits: [] });
        }
        findingsByFingerprint.get(finding.fingerprint).commits.push({
          hash:    commit.hash,
          date:    commit.date,
          message: commit.message,
        });
      }
    }));
  }

  // Sort commits newest-first
  scannedCommits.sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── EXPOSURE LIFECYCLE ────────────────────────────────────────────────────────
  progress('analyzing', { message: 'Correlating findings and determining lifecycle…' });

  const lifecycles = [];

  for (const [fingerprint, { finding, commits: fCommits }] of findingsByFingerprint) {
    const sorted = [...fCommits].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstCommit = sorted[0];
    const lastCommit  = sorted[sorted.length - 1];

    let exposureStatus;
    if (allowlistFingerprints.includes(fingerprint)) {
      exposureStatus = ExposureStatus.ALLOWLISTED;
    } else if (currentFingerprints.has(fingerprint)) {
      exposureStatus = ExposureStatus.ACTIVE;
    } else {
      exposureStatus = ExposureStatus.REMOVED;
    }

    lifecycles.push({
      fingerprint,
      type:           finding.type,
      category:       finding.category,
      severity:       finding.severity,
      maskedValue:    finding.maskedValue,
      description:    finding.description,
      exposureStatus,
      firstCommit:    firstCommit?.hash,
      firstCommitDate: firstCommit?.date,
      lastCommit:     lastCommit?.hash,
      lastCommitDate: lastCommit?.date,
      commitCount:    fCommits.length,
    });
  }

  // Sort: ACTIVE → REMOVED → ROTATED_UNKNOWN → ALLOWLISTED
  const ORDER = { ACTIVE: 0, REMOVED: 1, ROTATED_UNKNOWN: 2, ALLOWLISTED: 3 };
  lifecycles.sort((a, b) => (ORDER[a.exposureStatus] ?? 9) - (ORDER[b.exposureStatus] ?? 9));

  const result = {
    repositoryPath,
    repoInfo,
    scannedCommits,
    lifecycles,
    statistics: {
      totalCommits:    commits.length,
      commitsScanned,
      totalFindings:   findingsByFingerprint.size,
      activeFindings:  lifecycles.filter(l => l.exposureStatus === ExposureStatus.ACTIVE).length,
      removedFindings: lifecycles.filter(l => l.exposureStatus === ExposureStatus.REMOVED).length,
      duration:        Date.now() - startTime,
    },
  };

  progress('done', {
    message: 'History scan complete',
    ...result.statistics,
  });

  return result;
}
