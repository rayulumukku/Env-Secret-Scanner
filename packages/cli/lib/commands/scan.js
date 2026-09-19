/**
 * lib/commands/scan.js
 *
 * `secretshield scan [path]` command implementation.
 *
 * Modes:
 *   default:   scan directory
 *   --staged:  scan Git staged files (for pre-commit hook)
 *   --json:    JSON output
 *   --sarif:   SARIF 2.1.0 output
 *
 * Exit codes:
 *   0 = no findings (or all suppressed by baseline)
 *   1 = findings detected
 *   2 = scanner error / misconfiguration
 *
 * Security:
 *   - Raw secrets NEVER printed
 *   - File paths are not interpolated into shell commands
 */

import { resolve } from 'path';
import { collectFiles, readFiles, getScanner } from '../scanner-bridge.js';
import { loadConfig, meetsThreshold } from '../config.js';
import { loadBaseline, filterAgainstBaseline } from '../baseline.js';
import { getStagedFilePaths, getStagedContent, isGitAvailable } from '../git.js';
import { printBanner, printScanStart, printFindings, printSummary, printResult, printWarnings } from '../formatters/human.js';
import { toSarif } from '../formatters/sarif.js';

// ── MAIN ──────────────────────────────────────────────────────────────────────

/**
 * @param {string} scanPath
 * @param {object} opts - from commander
 * @returns {Promise<number>} exit code
 */
export async function runScan(scanPath, opts = {}) {
  const {
    staged    = false,
    json      = false,
    sarif     = false,
    quiet     = false,
    verbose   = false,
    config    = null,
    baseline  = null,
    failOn    = 'low',
  } = opts;

  const quiet_mode = quiet || json || sarif;

  // ── LOAD CONFIG ────────────────────────────────────────────────────────────
  const cwd = resolve(scanPath || process.cwd());
  const { config: cfg, warnings } = loadConfig(config, cwd);

  if (!json && !sarif) {
    printBanner(quiet);
    printWarnings(warnings, quiet);
  }

  // ── LOAD BASELINE ──────────────────────────────────────────────────────────
  let baselineFingerprints = new Set();
  if (baseline) {
    try {
      const bl = loadBaseline(baseline);
      baselineFingerprints = bl.fingerprints;
    } catch (err) {
      if (!quiet_mode) console.error(`Baseline error: ${err.message}`);
      return 2;
    }
  }

  // ── LOAD SCANNER ───────────────────────────────────────────────────────────
  let scan;
  try {
    scan = await getScanner();
  } catch (err) {
    console.error(`SecretShield scanner engine error: ${err.message}`);
    return 2;
  }

  // ── COLLECT FILES ──────────────────────────────────────────────────────────
  let files;
  let mode;

  if (staged) {
    mode = 'staged files';
    if (!isGitAvailable()) {
      console.error('Git is not available. Cannot scan staged files.');
      return 2;
    }

    const stagedPaths = getStagedFilePaths(cwd);

    if (stagedPaths.length === 0) {
      if (!quiet_mode) {
        printBanner(quiet);
        console.log('  No staged files to scan.\n');
      }
      return 0;
    }

    // Read staged content from Git index (not working tree)
    files = stagedPaths
      .map(p => {
        const content = getStagedContent(p, cwd);
        if (!content) return null;
        const relativePath = p.startsWith(cwd) ? p.slice(cwd.length + 1).replace(/\\/g, '/') : p;
        return { name: relativePath, content, size: Buffer.byteLength(content, 'utf8'), path: p };
      })
      .filter(Boolean);

  } else {
    mode = 'directory';
    if (!quiet_mode) {
      printScanStart({ target: scanPath || '.', mode }, quiet);
    }
    files = collectFiles(resolve(scanPath || '.'), {
      ignorePatterns: cfg.ignore,
      maxFileSize:    cfg.scan.maxFileSize,
      root:           resolve(scanPath || '.'),
    });
  }

  // ── SCAN ───────────────────────────────────────────────────────────────────
  let result;
  try {
    result = scan({
      files,
      allowlistFingerprints: Array.from(baselineFingerprints),
    });
  } catch (err) {
    console.error(`Scanner error: ${err.message}`);
    return 2;
  }

  // ── FILTER BY BASELINE & SEVERITY ─────────────────────────────────────────
  const { active, suppressed } = filterAgainstBaseline(result.findings || [], baselineFingerprints);

  const effectiveThreshold = opts.failOn || cfg.severityThreshold || 'low';
  const aboveThreshold     = active.filter(f => meetsThreshold(f.severity, effectiveThreshold));

  const stats = {
    total:        aboveThreshold.length,
    critical:     aboveThreshold.filter(f => f.severity === 'CRITICAL').length,
    high:         aboveThreshold.filter(f => f.severity === 'HIGH').length,
    medium:       aboveThreshold.filter(f => f.severity === 'MEDIUM').length,
    low:          aboveThreshold.filter(f => f.severity === 'LOW').length,
    filesScanned: result.statistics?.filesScanned ?? files.length,
  };

  // ── OUTPUT ─────────────────────────────────────────────────────────────────
  if (json) {
    // JSON output — structured, no ANSI, no raw secrets
    console.log(JSON.stringify({
      tool:       'SecretShield',
      version:    '2.0.0',
      timestamp:  new Date().toISOString(),
      target:     scanPath || '.',
      statistics: stats,
      suppressed,
      findings:   aboveThreshold.map(safeFinding),
    }, null, 2));

  } else if (sarif) {
    console.log(toSarif(aboveThreshold, {
      repoUri: null,
      commitSha: null,
    }));

  } else {
    if (staged && !quiet) {
      printBanner(quiet);
      console.log(`  Scanning staged files…\n`);
    }
    printFindings(aboveThreshold, { verbose, quiet, suppressed });
    printSummary(stats, { quiet, suppressed });
    printResult(aboveThreshold, { quiet });
  }

  return aboveThreshold.length > 0 ? 1 : 0;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Strip any raw secret fields before JSON output */
function safeFinding(f) {
  const { rawValue, raw, secret, ...safe } = f;
  void rawValue; void raw; void secret; // explicitly discarded
  return safe;
}
