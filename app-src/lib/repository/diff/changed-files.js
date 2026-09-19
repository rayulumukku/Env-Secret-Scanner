/**
 * @file lib/repository/diff/changed-files.js
 * @description Changed files extractor and classifier for Git diffs.
 */

import { parseUnifiedDiff } from './parser.js';

/**
 * @typedef {Object} ChangedFileSummary
 * @property {string} filePath - Current relative file path
 * @property {string} oldPath - Previous file path (for renames)
 * @property {'ADDED'|'MODIFIED'|'DELETED'|'RENAMED'} changeType
 * @property {number} additions - Count of added lines
 * @property {number} deletions - Count of deleted lines
 * @property {number} changes - Total changed lines
 * @property {boolean} isBinary - Whether file appears to be binary
 */

/**
 * Extracts a concise summary list of all changed files from a diff.
 * 
 * @param {string|Array} diffInput - Raw diff string or parsed DiffFile array
 * @returns {ChangedFileSummary[]}
 */
export function getChangedFiles(diffInput) {
  const parsedFiles = Array.isArray(diffInput) ? diffInput : parseUnifiedDiff(diffInput);

  return parsedFiles.map(file => {
    let additions = 0;
    let deletions = 0;

    for (const hunk of file.hunks || []) {
      for (const line of hunk.lines || []) {
        if (line.type === 'ADD') additions++;
        if (line.type === 'DELETE') deletions++;
      }
    }

    const filePath = file.newPath && file.newPath !== '/dev/null' ? file.newPath : file.oldPath;

    return {
      filePath,
      oldPath: file.oldPath,
      changeType: file.status || 'MODIFIED',
      additions,
      deletions,
      changes: additions + deletions,
      isBinary: isBinaryPath(filePath)
    };
  });
}

/**
 * Simple extension check for binary files.
 * @param {string} filePath 
 * @returns {boolean}
 */
export function isBinaryPath(filePath) {
  if (!filePath) return false;
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svgz',
    '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.wasm',
    '.ttf', '.woff', '.woff2', '.eot',
    '.mp3', '.mp4', '.mov', '.avi'
  ];
  const lower = filePath.toLowerCase();
  return binaryExtensions.some(ext => lower.endsWith(ext));
}

/**
 * Filters out deleted files and binary files that should not be scanned.
 * 
 * @param {ChangedFileSummary[]} changedFiles 
 * @returns {ChangedFileSummary[]} Scannable files
 */
export function filterScannableFiles(changedFiles) {
  return (changedFiles || []).filter(f => f.changeType !== 'DELETED' && !f.isBinary);
}
