/**
 * @file lib/repository/diff/diff-scanner.js
 * @description Core Git Diff Scanner engine.
 * 
 * Prioritizes added/modified content in Git diffs, skips unchanged/deleted lines,
 * maps finding line numbers accurately to target files, and produces masked findings.
 * 
 * SECURITY:
 *   - Raw secrets are masked immediately upon detection.
 *   - No raw credential values are returned or persisted.
 */

import { parseUnifiedDiff } from './parser.js';
import { getChangedFiles, filterScannableFiles } from './changed-files.js';
import { getChangedLinesByFile, buildVirtualFileForScan } from './changed-lines.js';
import { scanSync } from '../../scanner/engine.js';
import { meetsThreshold, DEFAULT_CONFIG } from '../../../../packages/config/index.js';
import { SCANNER_VERSION, RULE_VERSION, CONFIG_VERSION } from '../../version.js';

/**
 * @typedef {Object} DiffScanResult
 * @property {string} scanId
 * @property {'COMPLETED'|'FAILED'} status
 * @property {number} duration - ms
 * @property {number} filesChanged - Total files touched in the diff
 * @property {number} filesScanned - Scannable files inspected
 * @property {import('./changed-files.js').ChangedFileSummary[]} changedFiles
 * @property {Array<Object>} findings - Masked secret findings
 * @property {Object} statistics
 * @property {string} scannerVersion
 * @property {string} ruleVersion
 * @property {string} configurationVersion
 */

/**
 * Scans a Git diff text for exposed secrets in added or modified lines.
 * 
 * @param {string} diffText - Raw unified git diff string
 * @param {Object} [options] - Scan options
 * @param {Array<Object>} [options.customRules] - Custom regex rules
 * @param {string[]} [options.allowlistFingerprints] - Suppressed fingerprints
 * @param {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} [options.severityThreshold='LOW']
 * @param {number} [options.maxFileSize=5242880]
 * @returns {DiffScanResult}
 */
export function scanGitDiff(diffText, options = {}) {
  const startTime = Date.now();
  const scanId = `diff_scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (!diffText || typeof diffText !== 'string' || diffText.trim() === '') {
    return {
      scanId,
      status: 'COMPLETED',
      duration: Date.now() - startTime,
      filesChanged: 0,
      filesScanned: 0,
      changedFiles: [],
      findings: [],
      statistics: { total: 0, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
      scannerVersion: SCANNER_VERSION,
      ruleVersion: RULE_VERSION,
      configurationVersion: CONFIG_VERSION
    };
  }

  // 1. Parse unified diff
  const parsedFiles = parseUnifiedDiff(diffText);
  const allChangedFiles = getChangedFiles(parsedFiles);
  const scannableFiles = filterScannableFiles(allChangedFiles);
  const changedLinesByFile = getChangedLinesByFile(parsedFiles);

  const allFindings = [];

  // 2. Scan added/modified lines for each scannable file
  for (const scannable of scannableFiles) {
    const entries = changedLinesByFile.get(scannable.filePath) || [];
    if (entries.length === 0) continue;

    const { text, lineMap } = buildVirtualFileForScan(entries);

    // Run engine scan on the virtual added text
    const scanResult = scanSync({
      files: [{ name: scannable.filePath, content: text }],
      customRules: options.customRules || [],
      allowlistFingerprints: options.allowlistFingerprints || []
    });

    const fileFindings = scanResult.findings || [];

    // Map virtual line numbers back to target file line numbers
    for (const f of fileFindings) {
      const virtualLine = f.line || 1;
      const actualLine = lineMap.get(virtualLine) || virtualLine;
      
      f.line = actualLine;
      f.file = scannable.filePath;
      f.changeType = scannable.changeType;
      f.isIntroducedInDiff = true;
      f.ruleVersion = RULE_VERSION;
      f.scannerVersion = SCANNER_VERSION;

      allFindings.push(f);
    }
  }

  // 3. Filter by severity threshold
  const threshold = options.severityThreshold || 'LOW';
  const filteredFindings = allFindings.filter(f => meetsThreshold(f.severity, threshold));

  // 4. Calculate statistics
  const statistics = {
    total: filteredFindings.length,
    CRITICAL: filteredFindings.filter(f => f.severity === 'CRITICAL').length,
    HIGH: filteredFindings.filter(f => f.severity === 'HIGH').length,
    MEDIUM: filteredFindings.filter(f => f.severity === 'MEDIUM').length,
    LOW: filteredFindings.filter(f => f.severity === 'LOW').length
  };

  return {
    scanId,
    status: 'COMPLETED',
    duration: Date.now() - startTime,
    filesChanged: allChangedFiles.length,
    filesScanned: scannableFiles.length,
    changedFiles: allChangedFiles,
    findings: filteredFindings,
    statistics,
    scannerVersion: SCANNER_VERSION,
    ruleVersion: RULE_VERSION,
    configurationVersion: CONFIG_VERSION
  };
}
