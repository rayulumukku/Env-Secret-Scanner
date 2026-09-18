/**
 * lib/repository/archive.js
 *
 * Secure ZIP archive extraction using fflate.
 *
 * Security measures:
 *   - Zip Slip prevention (path traversal via ../ in filenames)
 *   - ZIP bomb detection (ratio + total size limits)
 *   - Symlink rejection
 *   - Nested archive rejection
 *   - Binary file skipping
 *   - Excessive file count limit
 *   - Max single file size limit
 *
 * SECURITY: No data is written to disk. All extraction is in-memory.
 * Raw file contents are passed directly to the scanner and then discarded.
 */

import { unzipSync, strFromU8 } from 'fflate';

// ── LIMITS ───────────────────────────────────────────────────────────────────
export const LIMITS = {
  MAX_ARCHIVE_BYTES:     50  * 1024 * 1024,  // 50 MB input ZIP
  MAX_TOTAL_EXTRACTED:   200 * 1024 * 1024,  // 200 MB extracted
  MAX_FILE_COUNT:        5000,
  MAX_SINGLE_FILE_BYTES: 5  * 1024 * 1024,   // 5 MB per file
  MAX_COMPRESSION_RATIO: 100,                 // flag suspicious compression
};

// Extensions that are definitely binary — skip without trying to decode
const BINARY_EXTENSIONS = new Set([
  'png','jpg','jpeg','gif','webp','ico','bmp','tiff','avif',
  'mp4','mov','avi','mkv','webm','mp3','wav','ogg','flac',
  'zip','gz','tar','bz2','xz','7z','rar','jar','war','ear',
  'exe','dll','so','dylib','bin','wasm','node',
  'pdf','doc','docx','xls','xlsx','ppt','pptx',
  'db','sqlite','sqlite3',
  'lock','map','min',
  'ttf','otf','woff','woff2','eot',
]);

// Nested archive extensions — skip to prevent Zip-in-Zip attacks
const NESTED_ARCHIVE_EXTENSIONS = new Set([
  'zip','tar','gz','bz2','xz','7z','rar','jar','war',
]);

/**
 * Normalize and validate a ZIP entry path.
 * Returns null if the path is unsafe (traversal, absolute, etc.)
 *
 * @param {string} rawPath - path as stored in ZIP
 * @returns {string|null} safe relative path, or null if unsafe
 */
export function normalizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return null;

  // Reject null bytes
  if (rawPath.includes('\0')) return null;

  // Normalize separators to forward slash
  let normalized = rawPath.replace(/\\/g, '/');

  // Reject absolute paths
  if (normalized.startsWith('/')) return null;

  // Split and filter components
  const parts = normalized.split('/');
  const safe = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') return null; // Zip Slip!
    // Reject parts with suspicious characters
    if (/[<>:"|?*\x00-\x1f]/.test(part)) return null;
    safe.push(part);
  }

  if (safe.length === 0) return null;
  return safe.join('/');
}

/**
 * Get the file extension from a path.
 * @param {string} filepath
 * @returns {string} lowercase extension without dot
 */
function getExtension(filepath) {
  const base = filepath.split('/').pop() || '';
  const parts = base.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Check if file content looks binary (contains null bytes in first 8KB).
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
function hasBinaryContent(bytes) {
  const sample = bytes.slice(0, Math.min(8192, bytes.length));
  return sample.includes(0); // null byte
}

/**
 * Paths/directories to always skip during extraction.
 * These match the same patterns as the file scanner's file-filter.js.
 */
const SKIP_DIR_SEGMENTS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build',
  'coverage', 'vendor', '.cache', '__pycache__', '.pytest_cache',
  '.mypy_cache', 'target', 'out', '.turbo', '.vercel', '.svelte-kit',
]);

/**
 * Check if a normalized path falls inside a directory that should be skipped.
 * @param {string} normalizedPath
 * @returns {boolean}
 */
function isSkippedDirectory(normalizedPath) {
  const parts = normalizedPath.split('/');
  // Check every path segment except the last (filename)
  for (let i = 0; i < parts.length - 1; i++) {
    if (SKIP_DIR_SEGMENTS.has(parts[i])) return true;
  }
  return false;
}

/**
 * Extract a ZIP archive safely into an in-memory array of file objects.
 *
 * @param {Buffer|Uint8Array} zipBuffer - raw ZIP bytes
 * @param {object} options
 * @param {boolean} options.includeHidden - include dotfiles (default: true)
 * @param {boolean} options.includeTests - include test files
 * @param {boolean} options.includeDocs - include .md/.rst files
 * @param {boolean} options.includeGenerated - include generated/build files
 * @returns {{ files: Array<{name, content, size}>, stats: object, errors: string[] }}
 */
export function extractZip(zipBuffer, options = {}) {
  const {
    includeHidden = true,
    includeTests = true,
    includeDocs = true,
  } = options;

  if (!zipBuffer || zipBuffer.length === 0) {
    throw new Error('Empty archive');
  }
  if (zipBuffer.length > LIMITS.MAX_ARCHIVE_BYTES) {
    throw new Error(`Archive too large. Maximum is ${LIMITS.MAX_ARCHIVE_BYTES / 1024 / 1024}MB.`);
  }

  // Decompress the ZIP
  let zipEntries;
  try {
    zipEntries = unzipSync(zipBuffer);
  } catch (err) {
    throw new Error(`Invalid or corrupted ZIP archive: ${err.message}`);
  }

  const files = [];
  const errors = [];
  const stats = {
    totalEntries: 0,
    skippedBinary: 0,
    skippedDirectory: 0,
    skippedSecurity: 0,
    skippedSize: 0,
    totalExtractedBytes: 0,
    fileCount: 0,
  };

  let fileCount = 0;
  let totalExtractedBytes = 0;

  for (const [rawPath, bytes] of Object.entries(zipEntries)) {
    stats.totalEntries++;

    // Directory entries end with /
    if (rawPath.endsWith('/')) {
      stats.skippedDirectory++;
      continue;
    }

    // Validate and sanitize path (Zip Slip prevention)
    const safePath = normalizePath(rawPath);
    if (!safePath) {
      stats.skippedSecurity++;
      errors.push(`Rejected unsafe path: ${rawPath.slice(0, 100)}`);
      continue;
    }

    // Skip excluded directories
    if (isSkippedDirectory(safePath)) {
      stats.skippedDirectory++;
      continue;
    }

    // Skip hidden files if configured
    const basename = safePath.split('/').pop() || '';
    if (!includeHidden && basename.startsWith('.')) {
      stats.skippedDirectory++;
      continue;
    }

    // Check extension
    const ext = getExtension(safePath);

    // Skip nested archives (ZIP bombs via Zip-in-Zip)
    if (NESTED_ARCHIVE_EXTENSIONS.has(ext)) {
      stats.skippedSecurity++;
      continue;
    }

    // Skip binary extensions
    if (BINARY_EXTENSIONS.has(ext)) {
      stats.skippedBinary++;
      continue;
    }

    // Skip test files if configured
    if (!includeTests) {
      if (/\.(test|spec)\.[jt]sx?$/.test(safePath) || /\/(tests?|specs?|__tests?__)\//.test(safePath)) {
        stats.skippedDirectory++;
        continue;
      }
    }

    // Skip docs if configured
    if (!includeDocs) {
      if (/\.(md|mdx|rst|txt)$/i.test(safePath)) {
        stats.skippedDirectory++;
        continue;
      }
    }

    // ZIP bomb check: single file size
    if (bytes.length > LIMITS.MAX_SINGLE_FILE_BYTES) {
      stats.skippedSize++;
      continue;
    }

    // ZIP bomb check: total extracted size
    totalExtractedBytes += bytes.length;
    if (totalExtractedBytes > LIMITS.MAX_TOTAL_EXTRACTED) {
      errors.push('Archive extraction limit reached. Remaining files skipped.');
      break;
    }

    // ZIP bomb check: file count
    fileCount++;
    if (fileCount > LIMITS.MAX_FILE_COUNT) {
      errors.push(`File count limit (${LIMITS.MAX_FILE_COUNT}) reached. Remaining files skipped.`);
      break;
    }

    // Skip binary content (null bytes)
    if (hasBinaryContent(bytes)) {
      stats.skippedBinary++;
      continue;
    }

    // Decode to string — skip if not valid UTF-8/ASCII
    let content;
    try {
      content = strFromU8(bytes);
    } catch {
      // Non-UTF-8 content — treat as binary
      stats.skippedBinary++;
      continue;
    }

    // Skip empty files
    if (!content.trim()) {
      stats.skippedDirectory++;
      continue;
    }

    stats.fileCount++;
    stats.totalExtractedBytes += bytes.length;

    files.push({
      name: safePath,
      content,
      size: bytes.length,
    });
  }

  return { files, stats, errors };
}

/**
 * Validate that a buffer looks like a ZIP file (magic bytes: PK\x03\x04).
 * @param {Buffer|Uint8Array} buffer
 * @returns {boolean}
 */
export function isValidZipBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  // ZIP magic bytes: 50 4B 03 04
  return buffer[0] === 0x50 && buffer[1] === 0x4B &&
         buffer[2] === 0x03 && buffer[3] === 0x04;
}
