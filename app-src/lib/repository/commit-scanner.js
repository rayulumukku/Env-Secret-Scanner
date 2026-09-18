/**
 * lib/repository/commit-scanner.js
 *
 * Scans Git commit diffs for exposed secrets using the existing detection engine.
 *
 * For GitHub repositories: uses the GitHub API to fetch commit patches.
 * For ZIP uploads: Git history is not available (ZIP contains no .git folder).
 *
 * SECURITY:
 *   - Only added lines (+) in diffs are scanned (efficient, avoids re-scanning unchanged code)
 *   - Raw secrets are masked immediately at detection time
 *   - Commit content is never stored — only masked findings and metadata are returned
 *   - NEVER log raw diff content that may contain secrets
 */

import { listCommits, getCommitDiff } from '../providers/github.js';
import { scan } from '../scanner/engine.js';
import { createCommit, ExposureStatus } from '../models/index.js';

// How many commits to scan per page
const COMMITS_PER_PAGE = 30;

// Maximum commits to scan in a single history scan (performance + memory)
const MAX_COMMITS = 500;

// Maximum patch size per file to process (prevent memory exhaustion)
const MAX_PATCH_BYTES = 500_000; // 500 KB

/**
 * Parse a GitHub commit patch into virtual "files" that contain only added lines.
 * This is the key efficiency win: we only scan lines that were ADDED in this commit.
 *
 * @param {object[]} commitFiles - GitHub commit files array (each has .filename, .patch)
 * @returns {Array<{name: string, content: string}>} virtual files with added lines only
 */
export function extractAddedLines(commitFiles) {
  if (!Array.isArray(commitFiles)) return [];

  const virtualFiles = [];

  for (const file of commitFiles) {
    // Skip files with no patch (binary files, renamed-only, etc.)
    if (!file.patch) continue;

    // Skip oversized patches
    if (file.patch.length > MAX_PATCH_BYTES) continue;

    // Skip deleted files (status = "removed")
    if (file.status === 'removed') continue;

    // Extract only lines that start with '+' (additions)
    // Exclude the +++ header line itself
    const addedLines = file.patch
      .split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.slice(1)) // strip the leading '+'
      .join('\n');

    if (addedLines.trim()) {
      virtualFiles.push({
        name:    file.filename,
        content: addedLines,
        size:    addedLines.length,
      });
    }
  }

  return virtualFiles;
}

/**
 * Scan a single commit's diff for secrets.
 *
 * @param {object} commitData - GitHub commit API response (with files[].patch)
 * @param {object} options
 * @param {string[]} options.allowlistFingerprints
 * @returns {object[]} masked findings enriched with commit metadata
 */
export function scanCommitDiff(commitData, options = {}) {
  const { allowlistFingerprints = [] } = options;

  const virtualFiles = extractAddedLines(commitData.files || []);
  if (virtualFiles.length === 0) return [];

  const result = scan({ files: virtualFiles, allowlistFingerprints });

  const commit = commitData.commit || {};
  const author = commit.author || {};

  // Enrich findings with commit metadata (NEVER expose raw diff content)
  return result.findings.map(finding => ({
    ...finding,
    commitHash:    commitData.sha,
    shortHash:     commitData.sha?.slice(0, 7),
    author:        author.name || 'Unknown',
    authorEmail:   author.email,     // included for audit purposes
    commitDate:    author.date,
    commitMessage: (commit.message || '').split('\n')[0].slice(0, 120),
    exposureStatus: ExposureStatus.REMOVED, // will be updated by caller based on current scan
  }));
}

/**
 * Scan the full Git history of a GitHub repository.
 *
 * Process:
 * 1. Fetch commits page by page
 * 2. For each commit, fetch its diff
 * 3. Scan only added lines
 * 4. Deduplicate by fingerprint
 * 5. Correlate with current scan findings to determine exposure status
 *
 * @param {object} options
 * @param {string} options.token       - GitHub access token (server-side only)
 * @param {string} options.owner
 * @param {string} options.repo
 * @param {string} options.branch
 * @param {Set}    options.currentFingerprints - fingerprints present in current scan
 * @param {string[]} options.allowlistFingerprints
 * @param {number} options.maxCommits
 * @param {function} options.onProgress
 * @returns {Promise<object>} history scan result
 */
export async function scanGitHistory(options = {}) {
  const {
    token,
    owner,
    repo,
    branch = 'HEAD',
    currentFingerprints = new Set(),
    allowlistFingerprints = [],
    maxCommits = MAX_COMMITS,
    onProgress,
  } = options;

  if (!token || !owner || !repo) {
    throw new Error('token, owner, and repo are required for Git history scanning.');
  }

  const startTime = Date.now();
  const progress = (stage, detail = {}) => {
    if (typeof onProgress === 'function') {
      onProgress({ stage, ...detail, elapsed: Date.now() - startTime });
    }
  };

  progress('fetching', { message: 'Fetching repository history…' });

  // ── FETCH COMMITS ─────────────────────────────────────────────────────────
  const allCommits = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && allCommits.length < maxCommits) {
    const remaining = maxCommits - allCommits.length;
    const perPage = Math.min(COMMITS_PER_PAGE, remaining);

    const commits = await listCommits(token, owner, repo, {
      sha: branch,
      page,
      perPage,
    });

    if (!commits || commits.length === 0) {
      hasMore = false;
      break;
    }

    allCommits.push(...commits);
    hasMore = commits.length === perPage;
    page++;

    progress('fetching', {
      message: `Fetched ${allCommits.length} commits…`,
      commitsTotal: maxCommits,
      commitsFetched: allCommits.length,
    });

    // Small delay to avoid hammering the API
    if (hasMore) await new Promise(r => setTimeout(r, 100));
  }

  progress('scanning', {
    message: `Scanning ${allCommits.length} commits…`,
    commitsTotal: allCommits.length,
    commitsScanned: 0,
  });

  // ── SCAN COMMITS ──────────────────────────────────────────────────────────
  // Track all findings by fingerprint to build exposure lifecycle
  const findingsByFingerprint = new Map(); // fingerprint → {finding, commits[]}
  const scannedCommits = [];
  let commitsScanned = 0;

  for (const commit of allCommits) {
    commitsScanned++;

    progress('scanning', {
      message: `Scanning commit ${commitsScanned} / ${allCommits.length}`,
      commitsTotal: allCommits.length,
      commitsScanned,
      currentCommit: commit.sha?.slice(0, 7),
    });

    let commitData;
    try {
      commitData = await getCommitDiff(token, owner, repo, commit.sha);
    } catch {
      // Skip commits that fail to fetch (deleted branches, permissions, etc.)
      continue;
    }

    const findings = scanCommitDiff(commitData, { allowlistFingerprints });
    const commitAuthor = commit.commit?.author || {};

    const commitRecord = createCommit({
      hash:         commit.sha,
      message:      (commit.commit?.message || '').split('\n')[0].slice(0, 120),
      author:       commitAuthor.name || 'Unknown',
      authorEmail:  commitAuthor.email,
      date:         commitAuthor.date,
      addedLines:   commitData.stats?.additions || 0,
      deletedLines: commitData.stats?.deletions || 0,
      filesChanged: (commitData.files || []).map(f => f.filename),
      findings:     findings, // already masked
    });

    scannedCommits.push(commitRecord);

    // Aggregate by fingerprint for lifecycle tracking
    for (const finding of findings) {
      if (!finding.fingerprint) continue;

      if (!findingsByFingerprint.has(finding.fingerprint)) {
        findingsByFingerprint.set(finding.fingerprint, {
          finding,
          commits: [],
        });
      }
      findingsByFingerprint.get(finding.fingerprint).commits.push({
        hash:    commit.sha,
        date:    commitAuthor.date,
        message: (commit.commit?.message || '').split('\n')[0],
      });
    }

    // Rate limit protection
    if (commitsScanned % 10 === 0) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  progress('analyzing', { message: 'Correlating findings and building lifecycle…' });

  // ── EXPOSURE LIFECYCLE ────────────────────────────────────────────────────
  const lifecycles = [];

  for (const [fingerprint, { finding, commits: fCommits }] of findingsByFingerprint) {
    // Sort commits oldest first
    const sortedCommits = fCommits.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstCommit = sortedCommits[0];
    const lastCommit  = sortedCommits[sortedCommits.length - 1];

    // Determine current status
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
      type:          finding.type,
      category:      finding.category,
      severity:      finding.severity,
      maskedValue:   finding.maskedValue,   // never raw
      description:   finding.description,
      exposureStatus,
      firstCommit:   firstCommit?.hash,
      firstCommitDate: firstCommit?.date,
      lastCommit:    lastCommit?.hash,
      lastCommitDate: lastCommit?.date,
      commitCount:   fCommits.length,
      // Do NOT include commit content or file content
    });
  }

  // Sort: ACTIVE first, then REMOVED, then ALLOWLISTED
  const statusOrder = { ACTIVE: 0, REMOVED: 1, ROTATED_UNKNOWN: 2, ALLOWLISTED: 3 };
  lifecycles.sort((a, b) => (statusOrder[a.exposureStatus] ?? 9) - (statusOrder[b.exposureStatus] ?? 9));

  return {
    scannedCommits,
    lifecycles,
    statistics: {
      totalCommits:   allCommits.length,
      commitsScanned,
      totalFindings:  findingsByFingerprint.size,
      activeFindings: lifecycles.filter(l => l.exposureStatus === ExposureStatus.ACTIVE).length,
      removedFindings: lifecycles.filter(l => l.exposureStatus === ExposureStatus.REMOVED).length,
      duration:       Date.now() - startTime,
    },
  };
}
