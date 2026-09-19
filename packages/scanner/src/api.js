/**
 * packages/scanner/src/api.js
 *
 * High-level programmatic API for SecretShield scanner.
 *
 * Provides convenient async functions for:
 * - scanText()
 * - scanFile()
 * - scanFiles()
 * - scanDirectory()
 * - scanGitDiff()
 *
 * SECURITY GUARANTEE:
 * All returned findings contain ONLY masked values and fingerprints.
 * Raw secret values are NEVER returned in response objects.
 */

import fs from 'fs';
import path from 'path';
import { scan, scanSync } from './engine.js';
import { shouldScanFile, isBinaryContent } from './file-filter.js';

/**
 * @typedef {Object} Finding
 * @property {string} id - Unique identifier for the finding instance
 * @property {string} fingerprint - Deterministic 16-char hash of the secret
 * @property {string} ruleId - Detection rule identifier (e.g., 'AWS_ACCESS_KEY_ID')
 * @property {string} ruleName - Human-readable rule name
 * @property {string} category - Category (e.g., 'Cloud Credentials')
 * @property {string} severity - 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
 * @property {number} confidence - Confidence score between 0 and 100
 * @property {string} file - File path where secret was found
 * @property {number} line - 1-indexed line number
 * @property {number} column - 1-indexed column number
 * @property {string} maskedValue - Safely masked secret (e.g. 'AKIA••••EXAMPLE')
 * @property {string} lineContent - Masked line text context
 * @property {string} whyDetected - Explainability rationale
 * @property {string} recommendation - Immediate remediation advice
 * @property {string} [quickFix] - Safe replacement code snippet
 */

/**
 * @typedef {Object} ScanStatistics
 * @property {number} totalFindings
 * @property {number} criticalCount
 * @property {number} highCount
 * @property {number} mediumCount
 * @property {number} lowCount
 * @property {number} suppressedCount
 */

/**
 * @typedef {Object} ScanResult
 * @property {string} scanId - Unique scan execution ID
 * @property {string} status - 'COMPLETED' | 'FAILED'
 * @property {number} duration - Scan duration in milliseconds
 * @property {number} filesScanned - Total files inspected
 * @property {Finding[]} findings - Detected secret findings (masked)
 * @property {ScanStatistics} statistics - Aggregated counts
 * @property {string[]} scannedFiles - List of scanned file paths
 * @property {string[]} skippedFiles - List of skipped file paths
 * @property {string[]} errors - Non-fatal scan warnings or errors
 */

/**
 * Scan a single raw text string for credentials.
 *
 * @param {string} content - Raw source code or configuration string
 * @param {Object} [options] - Scan options
 * @param {string} [options.filename='input.txt'] - Virtual filename for syntax context
 * @param {Array<object>} [options.customRules] - Optional custom regex rules
 * @param {string[]} [options.allowlistFingerprints] - Suppressed fingerprints
 * @returns {Promise<ScanResult>}
 */
export async function scanText(content, options = {}) {
  const filename = options.filename || 'input.txt';
  const files = [{ name: filename, content: typeof content === 'string' ? content : String(content || '') }];

  return scan({
    files,
    customRules: options.customRules || [],
    allowlistFingerprints: options.allowlistFingerprints || [],
    allowlistFiles: options.allowlistFiles || [],
  });
}

/**
 * Scan a single file from the local filesystem.
 *
 * @param {string} filePath - Absolute or relative path to file
 * @param {Object} [options] - Scan options
 * @param {number} [options.maxFileSize=5242880] - Maximum file size in bytes (default 5MB)
 * @param {Array<object>} [options.customRules] - Optional custom regex rules
 * @param {string[]} [options.allowlistFingerprints] - Suppressed fingerprints
 * @returns {Promise<ScanResult>}
 */
export async function scanFile(filePath, options = {}) {
  const maxFileSize = options.maxFileSize || 5 * 1024 * 1024;
  const resolvedPath = path.resolve(filePath);

  const stats = await fs.promises.stat(resolvedPath);
  if (stats.size > maxFileSize) {
    return {
      scanId: `scan_${Date.now()}`,
      status: 'COMPLETED',
      duration: 0,
      filesScanned: 0,
      findings: [],
      statistics: { totalFindings: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, suppressedCount: 0 },
      scannedFiles: [],
      skippedFiles: [resolvedPath],
      errors: [`File size (${stats.size} bytes) exceeds limit (${maxFileSize} bytes)`],
    };
  }

  const buffer = await fs.promises.readFile(resolvedPath);
  if (isBinaryContent(buffer)) {
    return {
      scanId: `scan_${Date.now()}`,
      status: 'COMPLETED',
      duration: 0,
      filesScanned: 0,
      findings: [],
      statistics: { totalFindings: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, suppressedCount: 0 },
      scannedFiles: [],
      skippedFiles: [resolvedPath],
      errors: [],
    };
  }

  const content = buffer.toString('utf8');
  return scan({
    files: [{ name: path.basename(resolvedPath), content }],
    customRules: options.customRules || [],
    allowlistFingerprints: options.allowlistFingerprints || [],
  });
}

/**
 * Scan multiple in-memory files.
 *
 * @param {Array<{ name: string, content: string }>} files - Array of file objects
 * @param {Object} [options] - Scan options
 * @returns {Promise<ScanResult>}
 */
export async function scanFiles(files, options = {}) {
  return scan({
    files: Array.isArray(files) ? files : [],
    customRules: options.customRules || [],
    allowlistFingerprints: options.allowlistFingerprints || [],
    allowlistFiles: options.allowlistFiles || [],
  });
}

/**
 * Scan an entire directory recursively.
 *
 * @param {string} dirPath - Directory path to scan
 * @param {Object} [options] - Scan options
 * @param {string[]} [options.ignorePatterns] - Glob/path patterns to ignore
 * @param {number} [options.maxFiles=5000] - Maximum file count limit
 * @param {number} [options.maxFileSize=5242880] - Maximum single file size in bytes
 * @returns {Promise<ScanResult>}
 */
export async function scanDirectory(dirPath, options = {}) {
  const resolvedDir = path.resolve(dirPath);
  const maxFiles = options.maxFiles || 5000;
  const maxFileSize = options.maxFileSize || 5 * 1024 * 1024;
  const filesToScan = [];
  const errors = [];

  const defaultIgnored = new Set([
    'node_modules', '.git', '.next', '.nuxt', 'dist', 'build',
    'coverage', 'vendor', '.cache', '__pycache__', '.turbo'
  ]);

  async function walk(currentDir) {
    if (filesToScan.length >= maxFiles) return;

    let entries = [];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      errors.push(`Failed to read directory: ${currentDir}`);
      return;
    }

    for (const entry of entries) {
      if (filesToScan.length >= maxFiles) break;

      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(resolvedDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (defaultIgnored.has(entry.name) || (options.ignorePatterns && options.ignorePatterns.some(p => relPath.includes(p)))) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        if (!shouldScanFile(entry.name)) {
          continue;
        }

        try {
          const stats = await fs.promises.stat(fullPath);
          if (stats.size > maxFileSize) continue;

          const buffer = await fs.promises.readFile(fullPath);
          if (isBinaryContent(buffer)) continue;

          filesToScan.push({
            name: relPath,
            content: buffer.toString('utf8'),
          });
        } catch {
          // Ignore unreadable file
        }
      }
    }
  }

  await walk(resolvedDir);

  const result = scan({
    files: filesToScan,
    customRules: options.customRules || [],
    allowlistFingerprints: options.allowlistFingerprints || [],
    allowlistFiles: options.allowlistFiles || [],
  });

  if (errors.length > 0) {
    result.errors = [...(result.errors || []), ...errors];
  }

  return result;
}

/**
 * Scan a unified Git diff / patch string (e.g. from `git diff` or PR changes).
 *
 * @param {string} diffText - Unified diff text
 * @param {Object} [options] - Scan options
 * @returns {Promise<ScanResult>}
 */
export async function scanGitDiff(diffText, options = {}) {
  if (!diffText || typeof diffText !== 'string') {
    return {
      scanId: `scan_${Date.now()}`,
      status: 'COMPLETED',
      duration: 0,
      filesScanned: 0,
      findings: [],
      statistics: { totalFindings: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, suppressedCount: 0 },
      scannedFiles: [],
      skippedFiles: [],
      errors: [],
    };
  }

  // Parse diff into added line chunks per file
  const files = [];
  const lines = diffText.split('\n');
  let currentFile = 'diff.patch';
  let addedLines = [];

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (addedLines.length > 0) {
        files.push({ name: currentFile, content: addedLines.join('\n') });
        addedLines = [];
      }
      const match = line.match(/b\/(.+)$/);
      if (match) currentFile = match[1];
    } else if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      addedLines.push(line.slice(1));
    }
  }

  if (addedLines.length > 0) {
    files.push({ name: currentFile, content: addedLines.join('\n') });
  }

  return scan({
    files,
    customRules: options.customRules || [],
    allowlistFingerprints: options.allowlistFingerprints || [],
    allowlistFiles: options.allowlistFiles || [],
  });
}
