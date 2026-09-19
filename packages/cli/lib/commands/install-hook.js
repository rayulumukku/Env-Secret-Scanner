/**
 * lib/commands/install-hook.js
 *
 * `secretshield install-hook` — installs a Git pre-commit hook.
 *
 * The hook runs `secretshield scan --staged` before each commit.
 * If HIGH or CRITICAL secrets are found, the commit is blocked.
 * Developers can bypass with `git commit --no-verify`.
 *
 * Security:
 *   - Writes a shell script with no user input interpolated into it
 *   - Validates the .git/hooks directory path before writing
 *   - Does not overwrite existing hook without --force
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execFileSync } from 'child_process';

const HOOK_PATH = '.git/hooks/pre-commit';
const HOOK_MARKER = '# installed-by: secretshield';

// ── HOOK SCRIPT ───────────────────────────────────────────────────────────────

// The hook script content is static — no user input is interpolated into it
const HOOK_SCRIPT = `#!/usr/bin/env sh
# SecretShield pre-commit hook
# ${HOOK_MARKER}
# This hook scans staged files for exposed secrets.
# To bypass: git commit --no-verify (not recommended)
#
# Uninstall: rm .git/hooks/pre-commit
#            or: secretshield install-hook --remove

# Check if secretshield is available
if ! command -v secretshield >/dev/null 2>&1; then
  # Try npx fallback
  if command -v npx >/dev/null 2>&1; then
    npx secretshield scan --staged --fail-on high
    exit $?
  fi
  echo "SecretShield: secretshield not found. Skipping pre-commit scan."
  echo "Install with: npm install -g @secretshield/cli"
  exit 0
fi

secretshield scan --staged --fail-on high
exit $?
`;

// ── MAIN ──────────────────────────────────────────────────────────────────────

export async function installHook(opts = {}) {
  const { force = false } = opts;
  const cwd      = process.cwd();
  const gitDir   = findGitDir(cwd);

  if (!gitDir) {
    console.error('  Error: Not a git repository (no .git directory found).');
    console.error('  Run this command from the root of your project.\n');
    return 2;
  }

  const hooksDir  = join(gitDir, 'hooks');
  const hookFile  = join(hooksDir, 'pre-commit');

  // Validate that hookFile is truly inside the gitDir (path traversal protection)
  if (!hookFile.startsWith(gitDir)) {
    console.error('  Security error: hook path is outside git directory.');
    return 2;
  }

  // Ensure hooks directory exists
  if (!existsSync(hooksDir)) {
    try {
      mkdirSync(hooksDir, { recursive: true });
    } catch (err) {
      console.error(`  Cannot create hooks directory: ${err.message}`);
      return 2;
    }
  }

  // Check for existing hook
  if (existsSync(hookFile) && !force) {
    const existing = readFileSafe(hookFile);
    if (existing && !existing.includes(HOOK_MARKER)) {
      console.error('  A pre-commit hook already exists and was not installed by SecretShield.');
      console.error('  Use --force to overwrite it, or manually add SecretShield to it.');
      console.error(`  Hook location: ${hookFile}\n`);
      return 2;
    }
  }

  // Write the hook
  try {
    writeFileSync(hookFile, HOOK_SCRIPT, 'utf8');
    // Make executable (chmod +x equivalent)
    chmodSync(hookFile, 0o755);
  } catch (err) {
    console.error(`  Cannot write hook: ${err.message}`);
    return 2;
  }

  console.log('');
  console.log('  ✓ SecretShield pre-commit hook installed.');
  console.log(`  Location: ${hookFile}`);
  console.log('');
  console.log('  The hook will scan staged files before each commit.');
  console.log('  Commits containing HIGH or CRITICAL secrets will be blocked.');
  console.log('');
  console.log('  To bypass (not recommended):');
  console.log('    git commit --no-verify');
  console.log('');
  console.log('  To uninstall:');
  console.log('    rm ' + hookFile);
  console.log('');
  return 0;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function findGitDir(startDir) {
  let current = resolve(startDir);

  // Walk up to find .git
  for (let i = 0; i < 20; i++) {
    const gitPath = join(current, '.git');
    if (existsSync(gitPath)) return gitPath;
    const parent = resolve(current, '..');
    if (parent === current) break; // reached filesystem root
    current = parent;
  }
  return null;
}

function readFileSafe(path) {
  try { return readFileSync(path, 'utf8'); } catch { return null; }
}
