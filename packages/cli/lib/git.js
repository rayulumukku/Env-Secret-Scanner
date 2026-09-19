/**
 * lib/git.js
 *
 * Git operations for the CLI.
 *
 * Used for:
 *   - Getting staged file paths (--staged / pre-commit)
 *   - PR-aware changed file detection
 *   - Reading staged file content (from index, not working tree)
 *
 * Security:
 *   - Uses execFileSync (NOT exec/execSync with shell interpolation)
 *   - All arguments are passed as array elements — no shell string building
 *   - File paths from git output are validated before use
 *   - Never logs file content
 */

import { execFileSync } from 'child_process';
import { resolve, isAbsolute } from 'path';

// ── GIT AVAILABILITY ──────────────────────────────────────────────────────────

export function isGitAvailable() {
  try {
    execFileSync('git', ['--version'], { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export function getGitRoot(cwd = process.cwd()) {
  try {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd, stdio: 'pipe', encoding: 'utf8', timeout: 5000,
    }).trim();
    return root;
  } catch {
    return null;
  }
}

// ── STAGED FILES ──────────────────────────────────────────────────────────────

/**
 * Get the list of staged (index) file paths.
 * Returns absolute paths.
 *
 * @param {string} cwd
 * @returns {string[]}
 */
export function getStagedFilePaths(cwd = process.cwd()) {
  const gitRoot = getGitRoot(cwd);
  if (!gitRoot) return [];

  let output;
  try {
    output = execFileSync('git', [
      'diff', '--cached', '--name-only', '--diff-filter=ACMRT',
    ], {
      cwd: gitRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 10_000,
    });
  } catch {
    return [];
  }

  return output
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !l.includes('\0') && !l.includes('..'))  // security
    .map(l => resolve(gitRoot, l));
}

/**
 * Read staged content for a file from Git index (not working tree).
 * This is what will actually be committed.
 *
 * @param {string} absolutePath
 * @param {string} cwd
 * @returns {string|null}
 */
export function getStagedContent(absolutePath, cwd = process.cwd()) {
  const gitRoot = getGitRoot(cwd);
  if (!gitRoot) return null;

  // Calculate path relative to git root
  let relPath;
  if (absolutePath.startsWith(gitRoot)) {
    relPath = absolutePath.slice(gitRoot.length + 1).replace(/\\/g, '/');
  } else {
    return null;
  }

  // Sanitize: no null bytes, no traversal
  if (relPath.includes('\0') || relPath.includes('..')) return null;

  try {
    const content = execFileSync('git', ['show', `:${relPath}`], {
      cwd: gitRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 10_000,
      maxBuffer: 5 * 1024 * 1024, // 5 MB
    });
    return content;
  } catch {
    return null;
  }
}

// ── PR-AWARE CHANGED FILES ────────────────────────────────────────────────────

/**
 * Get files changed between base and head refs (for PR scanning).
 * Returns absolute paths.
 *
 * @param {string} baseRef  - e.g. 'origin/main'
 * @param {string} headRef  - e.g. 'HEAD'
 * @param {string} cwd
 * @returns {string[]}
 */
export function getChangedFilePaths(baseRef, headRef, cwd = process.cwd()) {
  // Validate refs — no shell injection
  const safeRef = /^[a-zA-Z0-9_./\-]+$/;
  if (!safeRef.test(baseRef) || !safeRef.test(headRef)) return [];

  const gitRoot = getGitRoot(cwd);
  if (!gitRoot) return [];

  let output;
  try {
    output = execFileSync('git', [
      'diff', '--name-only', '--diff-filter=ACMRT',
      `${baseRef}...${headRef}`,
    ], {
      cwd: gitRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 30_000,
    });
  } catch {
    return [];
  }

  return output
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.includes('\0') && !l.includes('..'))
    .map(l => resolve(gitRoot, l));
}

// ── PR CONTEXT ────────────────────────────────────────────────────────────────

/**
 * Detect PR context from GitHub Actions environment variables.
 */
export function getPrContext() {
  return {
    isPr:      process.env.GITHUB_EVENT_NAME === 'pull_request',
    sha:       process.env.GITHUB_SHA        || null,
    baseRef:   process.env.GITHUB_BASE_REF   || null,
    headRef:   process.env.GITHUB_HEAD_REF   || null,
    repo:      process.env.GITHUB_REPOSITORY || null,
    runId:     process.env.GITHUB_RUN_ID     || null,
    workspace: process.env.GITHUB_WORKSPACE  || null,
  };
}
