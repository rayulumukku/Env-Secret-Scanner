import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, statSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Path to the shared scanner engine (relative from packages/cli/lib/)
const SCANNER_ROOT = resolve(__dirname, '..', '..', '..', 'app-src', 'lib', 'scanner');
const ENGINE_PATH  = resolve(SCANNER_ROOT, 'engine.js');
// Convert to file:// URL for cross-platform ESM compatibility (required on Windows)
const ENGINE_URL   = pathToFileURL(ENGINE_PATH).href;

// ── ENGINE ────────────────────────────────────────────────────────────────────

let _scan = null;

export async function getScanner() {
  if (_scan) return _scan;
  try {
    const mod = await import(ENGINE_URL);
    _scan = mod.scan;
    return _scan;
  } catch (err) {
    throw new Error(
      `Cannot load SecretShield scanner engine.\n` +
      `Expected at: ${ENGINE_PATH}\n` +
      `Error: ${err.message}`
    );
  }
}

// ── FILE COLLECTION ───────────────────────────────────────────────────────────

const MAX_FILE_SIZE   = 2 * 1024 * 1024; // 2 MB default
const SKIP_DIRS       = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build',
  'coverage', 'vendor', '.cache', '__pycache__', '.pytest_cache',
  '.turbo', '.vercel', '.svelte-kit', 'target', 'out',
]);
const BINARY_EXTS     = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
  '.mp4', '.mp3', '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.wasm', '.bin', '.lock',
  '.ttf', '.woff', '.woff2', '.eot', '.otf',
  '.pyc', '.class', '.o', '.obj',
]);

/**
 * Recursively collect scannable files from a directory.
 *
 * @param {string} dirPath    - absolute path to directory
 * @param {object} options
 * @param {string[]} [options.ignorePatterns] - glob-like prefix patterns to ignore
 * @param {number}  [options.maxFileSize]
 * @param {string}  [options.root]            - root path (for relative path calculation)
 * @returns {Array<{name: string, content: string, size: number, path: string}>}
 */
export function collectFiles(dirPath, options = {}) {
  const {
    ignorePatterns = [],
    maxFileSize    = MAX_FILE_SIZE,
    root           = dirPath,
  } = options;

  const files = [];

  function walk(current) {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return; // unreadable directory — skip silently
    }

    for (const entry of entries) {
      // Sanitize: skip entries with suspicious names
      if (entry.name.includes('\0') || entry.name.includes('..')) continue;

      const fullPath    = resolve(current, entry.name);
      const relativePath = fullPath.slice(root.length + 1).replace(/\\/g, '/');

      // Skip symlinks (security: avoid traversal outside root)
      if (entry.isSymbolicLink()) continue;

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (isIgnored(relativePath + '/', ignorePatterns)) continue;
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      // Skip binary extensions
      const ext = getExt(entry.name);
      if (BINARY_EXTS.has(ext)) continue;

      if (isIgnored(relativePath, ignorePatterns)) continue;

      // Check file size
      let size;
      try {
        size = statSync(fullPath).size;
      } catch { continue; }
      if (size > maxFileSize || size === 0) continue;

      // Read file safely
      let content;
      try {
        content = readFileSync(fullPath, 'utf8');
      } catch {
        // Binary or encoding error — skip
        try {
          content = readFileSync(fullPath, 'latin1');
        } catch { continue; }
      }

      files.push({ name: relativePath, content, size, path: fullPath });
    }
  }

  walk(dirPath);
  return files;
}

/**
 * Read specific files by absolute path (for staged file scanning).
 * @param {string[]} absolutePaths
 * @param {object}   options
 * @returns {Array<{name, content, size, path}>}
 */
export function readFiles(absolutePaths, options = {}) {
  const { maxFileSize = MAX_FILE_SIZE, root = process.cwd() } = options;
  const files = [];

  for (const fullPath of absolutePaths) {
    // Sanitize path — no null bytes, no traversal
    if (fullPath.includes('\0')) continue;

    const ext = getExt(fullPath);
    if (BINARY_EXTS.has(ext)) continue;

    let size;
    try {
      const stat = statSync(fullPath);
      if (stat.isSymbolicLink() || !stat.isFile()) continue;
      size = stat.size;
    } catch { continue; }

    if (size > maxFileSize || size === 0) continue;

    let content;
    try {
      content = readFileSync(fullPath, 'utf8');
    } catch {
      try { content = readFileSync(fullPath, 'latin1'); } catch { continue; }
    }

    const relativePath = fullPath.startsWith(root)
      ? fullPath.slice(root.length + 1).replace(/\\/g, '/')
      : fullPath.replace(/\\/g, '/');

    files.push({ name: relativePath, content, size, path: fullPath });
  }

  return files;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getExt(filename) {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function isIgnored(relativePath, patterns) {
  for (const pattern of patterns) {
    // Simple prefix/glob matching (**, *, ?)
    if (matchGlob(pattern, relativePath)) return true;
  }
  return false;
}

/**
 * Minimal glob matcher supporting * and ** wildcards.
 * Used for ignore patterns in .secretshield.json.
 * Does NOT use shell — safe against injection.
 */
function matchGlob(pattern, path) {
  const p = pattern.replace(/\\/g, '/');
  const s = path.replace(/\\/g, '/');

  let regexStr = '';
  let i = 0;
  while (i < p.length) {
    if (p.slice(i, i + 2) === '**') {
      if (p[i + 2] === '/') {
        regexStr += '(?:.+/)?';
        i += 3;
      } else {
        regexStr += '.*';
        i += 2;
      }
    } else if (p[i] === '*') {
      regexStr += '[^/]*';
      i += 1;
    } else if (p[i] === '?') {
      regexStr += '[^/]';
      i += 1;
    } else if (['.', '+', '^', '$', '(', ')', '[', ']', '{', '}', '|', '\\'].includes(p[i])) {
      regexStr += '\\' + p[i];
      i += 1;
    } else {
      regexStr += p[i];
      i += 1;
    }
  }

  try {
    const regex = new RegExp(`^${regexStr}$|^${regexStr}/`);
    return regex.test(s) || regex.test(s + '/');
  } catch {
    return false;
  }
}
