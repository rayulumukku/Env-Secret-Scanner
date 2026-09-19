/**
 * file-filter.js — Determine which files/paths should be scanned.
 *
 * Skips: node_modules, .git, build dirs, binary files, oversized files.
 * SECURITY: Never logs file content.
 */

/** Directories to always skip */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build',
  'coverage', 'vendor', '.cache', '__pycache__', '.pytest_cache',
  '.mypy_cache', 'target', 'out', '.turbo', '.vercel', '.svelte-kit',
]);

/** File extensions that are almost certainly binary */
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'bmp', 'tiff',
  'mp4', 'mov', 'avi', 'mkv', 'mp3', 'wav', 'ogg', 'flac',
  'zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar', 'jar', 'war',
  'exe', 'dll', 'so', 'dylib', 'bin', 'wasm',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'db', 'sqlite', 'sqlite3',
  'lock',  // package-lock.json handled separately — skip .lock binary lockfiles
  'map',   // source maps — huge and rarely useful
  'min',   // minified — skip
]);

/** Extensions always worth scanning */
const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'php', 'java', 'go', 'rs', 'cs', 'cpp', 'c', 'h',
  'env', 'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config', 'properties',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'tf', 'tfvars', 'hcl',
  'xml', 'gradle', 'pom',
  'txt', 'md', 'mdx', 'rst',
  'sql',
  'npmrc', 'nvmrc', 'gitignore', 'dockerignore', 'editorconfig',
  'pem', 'key', 'crt', 'cert', 'p12',
]);

/** Max file size to scan: 2MB */
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Check if a path component is a directory that should be skipped.
 * @param {string} filepath - full or partial path
 * @returns {boolean}
 */
export function isSkippedPath(filepath) {
  if (!filepath) return false;
  const parts = filepath.replace(/\\/g, '/').split('/');
  return parts.some(part => SKIP_DIRS.has(part));
}

/**
 * Check if a filename has a binary extension.
 * @param {string} filename
 * @returns {boolean}
 */
export function isBinaryFile(filename) {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return !!ext && BINARY_EXTENSIONS.has(ext);
}

/**
 * Detect binary content by looking for null bytes in the first 8KB.
 * @param {string} content
 * @returns {boolean}
 */
export function hasBinaryContent(content) {
  if (!content) return false;
  const sample = content.slice(0, 8192);
  return sample.includes('\0');
}

/**
 * Detect binary content from Buffer, Uint8Array, or string.
 * @param {Buffer|Uint8Array|string} data
 * @returns {boolean}
 */
export function isBinaryContent(data) {
  if (!data) return false;
  if (typeof data === 'string') {
    return hasBinaryContent(data);
  }
  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    const sample = data.slice(0, Math.min(8192, data.length));
    return sample.includes(0);
  }
  return false;
}

/**
 * Check if a file should be scanned.
 * @param {string|object} file - filename string or { name: string, content: string }
 * @returns {{ skip: boolean, reason?: string }|boolean}
 */
export function shouldScanFile(file) {
  if (!file) return typeof file === 'string' ? false : { skip: true, reason: 'invalid file' };

  const name = typeof file === 'string' ? file : file.name;
  const content = typeof file === 'string' ? '' : (file.content || '');

  // Skip by directory
  if (isSkippedPath(name)) {
    return typeof file === 'string' ? false : { skip: true, reason: 'excluded directory' };
  }

  // Skip binary extensions
  if (isBinaryFile(name)) {
    return typeof file === 'string' ? false : { skip: true, reason: 'binary file extension' };
  }

  if (typeof file === 'string') {
    return true;
  }

  // Skip oversized files
  const sizeBytes = new TextEncoder().encode(content).length;
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { skip: true, reason: `file too large (${Math.round(sizeBytes / 1024)}KB > ${MAX_FILE_SIZE_BYTES / 1024}KB)` };
  }

  // Skip binary content
  if (hasBinaryContent(content)) {
    return { skip: true, reason: 'binary content detected' };
  }

  // Skip empty files
  if (!content.trim()) {
    return { skip: true, reason: 'empty file' };
  }

  return { skip: false };
}
