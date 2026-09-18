/**
 * lib/repository/repository-scanner.js
 *
 * Orchestrates: archive extraction → file filtering → secret scanning → aggregation.
 *
 * SECURITY:
 *   - All file content is processed in-memory and never written to disk.
 *   - Raw secret values are masked at the scanner level before aggregation here.
 *   - Only masked findings, statistics, and metadata are returned.
 */

import { extractZip, isValidZipBuffer, LIMITS } from './archive.js';
import { scan } from '../scanner/engine.js';
import { createFingerprint } from '../scanner/fingerprint.js';

// Severity ordering for sorting
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/**
 * Scan a ZIP archive buffer.
 *
 * @param {Buffer|Uint8Array} zipBuffer
 * @param {object} options
 * @param {string} options.repositoryName
 * @param {string} options.archiveName
 * @param {object} options.scanConfig - scan configuration options
 * @param {string[]} options.allowlistFingerprints
 * @param {function} options.onProgress - progress callback(state)
 * @returns {object} scan result (only safe, masked data)
 */
export async function scanZipRepository(zipBuffer, options = {}) {
  const {
    repositoryName = 'Unknown Repository',
    archiveName = 'upload.zip',
    scanConfig = {},
    allowlistFingerprints = [],
    onProgress,
  } = options;

  const startTime = Date.now();
  const scanId = `repo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const progress = (stage, detail = {}) => {
    if (typeof onProgress === 'function') {
      onProgress({ stage, ...detail, elapsed: Date.now() - startTime });
    }
  };

  // ── 1. VALIDATE ─────────────────────────────────────────────────────────
  progress('validating', { message: 'Validating archive...' });

  if (!isValidZipBuffer(zipBuffer)) {
    throw new Error('File does not appear to be a valid ZIP archive.');
  }

  // ── 2. EXTRACT ───────────────────────────────────────────────────────────
  progress('extracting', { message: 'Extracting files...' });

  const extractConfig = {
    includeHidden: scanConfig.includeHidden !== false,
    includeTests: scanConfig.includeTests !== false,
    includeDocs: scanConfig.includeDocs !== false,
  };

  let extracted;
  try {
    extracted = extractZip(zipBuffer, extractConfig);
  } catch (err) {
    throw new Error(`Archive extraction failed: ${err.message}`);
  }

  const { files, stats: extractStats, errors: extractErrors } = extracted;
  const totalFiles = files.length;

  progress('scanning', {
    message: 'Scanning files for secrets...',
    filesTotal: totalFiles,
    filesScanned: 0,
  });

  // ── 3. APPLY SCAN LIMITS ─────────────────────────────────────────────────
  const maxFiles = scanConfig.maxFiles || LIMITS.MAX_FILE_COUNT;
  const filesToScan = files.slice(0, maxFiles);

  if (files.length > maxFiles) {
    extractErrors.push(`File limit reached: only scanned ${maxFiles} of ${files.length} files.`);
  }

  // ── 4. STRIP COMMON ROOT PREFIX ──────────────────────────────────────────
  // ZIP archives often wrap everything in a top-level folder — strip it for cleaner display
  const strippedFiles = stripCommonRoot(filesToScan);

  // ── 5. SCAN ──────────────────────────────────────────────────────────────
  // Batch files in chunks of 100 to emit progress updates
  const CHUNK_SIZE = 100;
  const allFindings = [];
  const scannedPaths = [];
  const skippedPaths = [];
  let filesScanned = 0;

  for (let i = 0; i < strippedFiles.length; i += CHUNK_SIZE) {
    const chunk = strippedFiles.slice(i, i + CHUNK_SIZE);

    const result = scan({
      files: chunk,
      allowlistFingerprints,
      customRules: scanConfig.customRules || [],
      allowlistFiles: scanConfig.allowlistFiles || [],
    });

    allFindings.push(...result.findings);
    scannedPaths.push(...result.scannedFiles);
    skippedPaths.push(...result.skippedFiles);
    filesScanned += result.filesScanned;

    progress('scanning', {
      message: `Scanning files... ${filesScanned}/${totalFiles}`,
      filesTotal: totalFiles,
      filesScanned,
    });

    // Yield to event loop on large batches
    if (i + CHUNK_SIZE < strippedFiles.length) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  // ── 6. ANALYZE & DEDUPLICATE ─────────────────────────────────────────────
  progress('analyzing', { message: 'Analyzing findings...' });

  // Deduplicate by fingerprint
  const seen = new Set();
  const uniqueFindings = allFindings.filter(f => {
    if (!f.fingerprint) return true;
    if (seen.has(f.fingerprint)) return false;
    seen.add(f.fingerprint);
    return true;
  });

  // Sort by severity then file
  uniqueFindings.sort((a, b) => {
    const sA = SEVERITY_ORDER[a.severity] ?? 9;
    const sB = SEVERITY_ORDER[b.severity] ?? 9;
    if (sA !== sB) return sA - sB;
    return (a.file || '').localeCompare(b.file || '');
  });

  // ── 7. BUILD STATISTICS ──────────────────────────────────────────────────
  const statistics = buildStatistics(uniqueFindings, filesScanned, skippedPaths, startTime, extractStats);

  // ── 8. BUILD FILE TREE ───────────────────────────────────────────────────
  const fileTree = buildFileTree(strippedFiles, uniqueFindings);

  // ── 9. GROUP FINDINGS ────────────────────────────────────────────────────
  const groupedFindings = groupFindings(uniqueFindings);

  // ── 10. FINALIZE ─────────────────────────────────────────────────────────
  progress('finalizing', { message: 'Finalizing report...' });

  return {
    scanId,
    status: 'completed',
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,

    repository: {
      name: repositoryName,
      archiveName,
      type: 'zip',
    },

    statistics,
    findings: uniqueFindings,          // masked values only
    groupedFindings,
    fileTree,

    scannedFiles: scannedPaths,
    skippedFiles: skippedPaths,
    errors: extractErrors,

    // Safe metadata only — no raw content, no raw secrets
    config: {
      ...extractConfig,
      maxFiles,
    },
  };
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * If all files share a common top-level directory prefix, strip it.
 * e.g. "my-repo-main/src/app.js" → "src/app.js"
 */
function stripCommonRoot(files) {
  if (files.length === 0) return files;

  const firstSegment = files[0].name.split('/')[0];
  if (!firstSegment) return files;

  const allShareRoot = files.every(f => f.name.startsWith(firstSegment + '/'));
  if (!allShareRoot) return files;

  return files.map(f => ({
    ...f,
    name: f.name.slice(firstSegment.length + 1),
  })).filter(f => f.name); // drop the root dir entry itself
}

/**
 * Build statistics object from findings.
 */
function buildStatistics(findings, filesScanned, skippedFiles, startTime, extractStats) {
  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const byCategory = {};
  const byType = {};

  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;

    if (f.category) {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    }
    if (f.type) {
      byType[f.type] = (byType[f.type] || 0) + 1;
    }
  }

  const riskScore = Math.min(100,
    bySeverity.CRITICAL * 25 +
    bySeverity.HIGH * 10 +
    bySeverity.MEDIUM * 3 +
    bySeverity.LOW * 1
  );

  return {
    ...bySeverity,
    total: findings.length,
    filesScanned,
    filesSkipped: skippedFiles.length,
    duration: Date.now() - startTime,
    riskScore,
    byCategory,
    byType,
    extractStats,
  };
}

/**
 * Build a nested file tree structure with finding indicators.
 *
 * @param {Array} files
 * @param {Array} findings
 * @returns {object} tree root node
 */
function buildFileTree(files, findings) {
  // Map file → findings
  const findingsByFile = {};
  for (const f of findings) {
    if (!findingsByFile[f.file]) findingsByFile[f.file] = [];
    findingsByFile[f.file].push(f);
  }

  // Build nested tree
  const root = { name: '', children: {}, files: [] };

  for (const file of files) {
    const parts = file.name.split('/');
    let node = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!node.children[part]) {
        node.children[part] = { name: part, path: parts.slice(0, i + 1).join('/'), children: {}, files: [] };
      }
      node = node.children[part];
    }

    const filename = parts[parts.length - 1];
    const filePath = file.name;
    const fileFindings = findingsByFile[filePath] || [];
    const maxSeverity = fileFindings.reduce((max, f) => {
      return SEVERITY_ORDER[f.severity] < SEVERITY_ORDER[max] ? f.severity : max;
    }, 'LOW');

    node.files.push({
      name: filename,
      path: filePath,
      size: file.size,
      findingCount: fileFindings.length,
      maxSeverity: fileFindings.length > 0 ? maxSeverity : null,
    });
  }

  return flattenTree(root);
}

/**
 * Convert tree with children maps to arrays for JSON serialization.
 */
function flattenTree(node) {
  return {
    name: node.name,
    path: node.path,
    children: Object.values(node.children).map(flattenTree).sort((a, b) => a.name.localeCompare(b.name)),
    files: node.files.sort((a, b) => {
      // Files with findings first
      if (b.findingCount !== a.findingCount) return b.findingCount - a.findingCount;
      return a.name.localeCompare(b.name);
    }),
  };
}

/**
 * Group findings by severity, file, and category for UI display.
 */
function groupFindings(findings) {
  const bySeverity = {};
  const byFile = {};
  const byCategory = {};

  for (const f of findings) {
    // By severity
    if (!bySeverity[f.severity]) bySeverity[f.severity] = [];
    bySeverity[f.severity].push(f);

    // By file
    if (!byFile[f.file]) byFile[f.file] = [];
    byFile[f.file].push(f);

    // By category
    const cat = f.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f);
  }

  return { bySeverity, byFile, byCategory };
}
