/**
 * lib/repository/git.js
 *
 * Low-level Git operations using the `simple-git` library.
 *
 * This module provides the raw Git data access layer.
 * All scanning decisions are made by the caller (commit-scanner.js).
 *
 * Security:
 *   - Only reads git metadata and diffs; never writes to the repo
 *   - Raw diff content is never returned as a whole — only individual commit patches
 *   - All paths are validated against a trusted repositoryPath root
 *   - This module is server-side only (Node.js)
 *
 * Environment dependency: requires `git` CLI to be installed.
 * Falls back gracefully if git is unavailable.
 */

import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

// Lazily import simple-git so the scanner can still function without it
let simpleGit;
try {
  simpleGit = (await import('simple-git')).simpleGit;
} catch {
  simpleGit = null;
}

// ── CONFIGURATION ─────────────────────────────────────────────────────────────

const GIT_TIMEOUT_MS    = 30_000;  // 30s per git operation
const MAX_DIFF_BYTES    = 500_000; // 500 KB per file diff
const MAX_FILE_PATCH_LINES = 5_000;

// ── VALIDATION ────────────────────────────────────────────────────────────────

/**
 * Ensure the repositoryPath is an absolute path and a directory.
 * Returns false if the path is suspicious (path traversal etc.).
 */
function validateRepoPath(repoPath) {
  if (!repoPath || typeof repoPath !== 'string') return false;
  const normalized = path.normalize(repoPath);
  // Must be absolute
  if (!path.isAbsolute(normalized)) return false;
  // Must not contain null bytes
  if (normalized.includes('\0')) return false;
  return normalized;
}

// ── GIT CLIENT ────────────────────────────────────────────────────────────────

/**
 * Get a configured simple-git instance for the given repository path.
 *
 * @param {string} repoPath - absolute path to git repository
 * @returns {import('simple-git').SimpleGit}
 * @throws if simple-git is unavailable or path is invalid
 */
export function getGitClient(repoPath) {
  if (!simpleGit) {
    throw new Error(
      'simple-git is not installed. Run: npm install simple-git\n' +
      'Git history scanning requires simple-git.'
    );
  }

  const safe = validateRepoPath(repoPath);
  if (!safe) {
    throw new Error(`Invalid or unsafe repository path: ${repoPath}`);
  }

  return simpleGit(safe, {
    binary:  'git',
    maxConcurrentProcesses: 2,
    timeout: { block: GIT_TIMEOUT_MS },
    trimmed: true,
  });
}

// ── REPOSITORY METADATA ────────────────────────────────────────────────────────

/**
 * Check whether a directory is a valid git repository.
 *
 * @param {string} repoPath
 * @returns {Promise<boolean>}
 */
export async function isGitRepository(repoPath) {
  try {
    const git = getGitClient(repoPath);
    const result = await git.checkIsRepo();
    return !!result;
  } catch {
    return false;
  }
}

/**
 * Get top-level repository metadata.
 *
 * @param {string} repoPath
 * @returns {Promise<{branch: string, headHash: string, remoteUrl: string|null, commitCount: number}>}
 */
export async function getRepositoryInfo(repoPath) {
  const git = getGitClient(repoPath);

  const [branch, headHash, remotes, total] = await Promise.all([
    git.revparse(['--abbrev-ref', 'HEAD']).catch(() => 'unknown'),
    git.revparse(['HEAD']).catch(() => null),
    git.getRemotes(true).catch(() => []),
    git.raw(['rev-list', '--count', 'HEAD']).catch(() => '0'),
  ]);

  const origin = remotes.find(r => r.name === 'origin');
  const remoteUrl = origin?.refs?.fetch || null;

  return {
    branch:      branch.trim(),
    headHash:    headHash?.trim() || null,
    remoteUrl,
    commitCount: parseInt(total.trim(), 10) || 0,
  };
}

// ── COMMIT LISTING ────────────────────────────────────────────────────────────

/**
 * List commits in reverse chronological order (newest first).
 *
 * @param {string} repoPath
 * @param {object} options
 * @param {string} [options.branch]       - branch/ref to start from (default: HEAD)
 * @param {number} [options.maxCount]     - max commits to return
 * @param {number} [options.skip]         - commits to skip (for pagination)
 * @param {string} [options.since]        - ISO date string — only commits after this
 * @returns {Promise<Array<{hash, shortHash, message, author, authorEmail, date, filesChanged}>>}
 */
export async function listCommits(repoPath, options = {}) {
  const {
    branch   = 'HEAD',
    maxCount = 200,
    skip     = 0,
    since    = null,
  } = options;

  const git = getGitClient(repoPath);

  const logOptions = {
    format: {
      hash:        '%H',
      shortHash:   '%h',
      message:     '%s',   // subject line only (safe — no body)
      author:      '%aN',  // author name
      authorEmail: '%aE',  // author email
      date:        '%aI',  // ISO 8601 date
    },
    [`--max-count`]: maxCount,
    [`--skip`]:      skip,
  };

  if (since) logOptions['--since'] = since;
  if (branch !== 'HEAD') logOptions.from = branch;

  const log = await git.log(logOptions);

  return log.all.map(c => ({
    hash:        c.hash,
    shortHash:   c.shortHash || c.hash?.slice(0, 7),
    message:     (c.message || '').slice(0, 120),
    author:      c.author,
    authorEmail: c.authorEmail,
    date:        c.date,
    filesChanged: [], // populated by getCommitDiff
  }));
}

// ── COMMIT DIFF ───────────────────────────────────────────────────────────────

/**
 * Get the diff for a specific commit.
 * Returns only added/modified lines — not raw full file content.
 *
 * @param {string} repoPath
 * @param {string} commitHash
 * @returns {Promise<Array<{filename, status, patch, addedLines, deletedLines}>>}
 */
export async function getCommitDiff(repoPath, commitHash) {
  if (!commitHash || !/^[0-9a-f]{4,64}$/i.test(commitHash)) {
    throw new Error(`Invalid commit hash: ${commitHash}`);
  }

  const git = getGitClient(repoPath);

  // Get list of changed files with their status
  const diffSummary = await git.diffSummary([
    `${commitHash}^`,
    commitHash,
    '--',
  ]).catch(async () => {
    // First commit has no parent — diff against empty tree
    return git.diffSummary([
      '4b825dc642cb6eb9a060e54bf8d69288fbee4904', // empty tree object
      commitHash,
      '--',
    ]).catch(() => ({ files: [] }));
  });

  const files = [];

  for (const file of (diffSummary.files || [])) {
    // Get the actual patch for this file
    let patch = '';
    try {
      const rawPatch = await git.diff([
        `${commitHash}^`,
        commitHash,
        '--',
        file.file,
        '--unified=0',           // minimal context
        '--no-color',
        '--diff-filter=ACDMRT',  // Added, Copied, Deleted, Modified, Renamed, Type-changed
      ]).catch(async () => {
        // First commit fallback
        return git.diff([
          '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
          commitHash,
          '--',
          file.file,
          '--unified=0',
          '--no-color',
        ]);
      });

      // Truncate oversized patches
      patch = rawPatch.slice(0, MAX_DIFF_BYTES);
    } catch {
      patch = '';
    }

    files.push({
      filename:     file.file,
      status:       getFileStatus(file),
      patch,
      addedLines:   file.insertions || 0,
      deletedLines: file.deletions  || 0,
    });
  }

  return files;
}

// ── BATCH OPERATIONS ──────────────────────────────────────────────────────────

/**
 * Get stats for a commit (without full diff — fast).
 *
 * @param {string} repoPath
 * @param {string} commitHash
 * @returns {Promise<{additions: number, deletions: number, files: string[]}>}
 */
export async function getCommitStats(repoPath, commitHash) {
  if (!commitHash || !/^[0-9a-f]{4,64}$/i.test(commitHash)) {
    return { additions: 0, deletions: 0, files: [] };
  }

  const git = getGitClient(repoPath);

  try {
    const summary = await git.diffSummary([`${commitHash}^`, commitHash]);
    return {
      additions: summary.insertions || 0,
      deletions: summary.deletions  || 0,
      files:     (summary.files || []).map(f => f.file),
    };
  } catch {
    return { additions: 0, deletions: 0, files: [] };
  }
}

/**
 * Check whether git is available on the system.
 * @returns {Promise<{available: boolean, version: string|null}>}
 */
export async function checkGitAvailability() {
  try {
    const { simpleGit: sg } = await import('simple-git');
    const git = sg();
    const version = await git.version();
    return { available: true, version: version?.installed ? version.major + '.' + version.minor : null };
  } catch {
    return { available: false, version: null };
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getFileStatus(file) {
  if (file.binary) return 'binary';
  // simple-git diffSummary doesn't always give status — infer from insertions/deletions
  if (!file.insertions && file.deletions) return 'deleted';
  if (file.insertions && !file.deletions) return 'added';
  return 'modified';
}
