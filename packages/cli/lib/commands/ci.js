/**
 * lib/commands/ci.js
 *
 * `secretshield ci` — CI/CD mode with PR awareness.
 *
 * Behavior:
 *   - Scans repository (or changed files in PR mode)
 *   - Emits JSON/SARIF or human output
 *   - Exits 0 on pass, 1 on findings above threshold, 2 on error
 *   - Baseline suppression supported
 *   - Never exposes raw secrets
 */

import { resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { collectFiles, readFiles, getScanner, isIgnored } from '../scanner-bridge.js';
import { loadConfig, meetsThreshold } from '../config.js';
import { loadBaseline, filterAgainstBaseline } from '../baseline.js';
import { getPrContext, getChangedFilePaths, getGitRoot, isGitAvailable } from '../git.js';
import { printBanner, printCiResult, printWarnings } from '../formatters/human.js';
import { toSarif } from '../formatters/sarif.js';

export async function runCi(opts = {}) {
  const {
    json     = false,
    sarif    = false,
    quiet    = false,
    verbose  = false,
    config   = null,
    baseline = null,
    failOn   = null,
    severity = null,
    pr       = false,
    ignore   = null,
  } = opts;

  const quiet_mode = quiet || json || (sarif === true);
  const cwd        = process.env.GITHUB_WORKSPACE
    ? resolve(process.env.GITHUB_WORKSPACE)
    : process.cwd();

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  const { config: cfg, warnings } = loadConfig(config, cwd);

  const cliIgnores = ignore
    ? (Array.isArray(ignore) ? ignore : String(ignore).split(',')).map(s => s.trim()).filter(Boolean)
    : [];
  const effectiveIgnore = Array.from(new Set([...(cfg.ignore || []), ...cliIgnores]));

  if (!quiet_mode) {
    printBanner(quiet);
    printWarnings(warnings, quiet);
  }

  // ── BASELINE ────────────────────────────────────────────────────────────────
  let baselineFingerprints = new Set();
  const baselineFile = baseline || (existsSync(resolve(cwd, '.secretshield-baseline.json')) ? resolve(cwd, '.secretshield-baseline.json') : null);
  if (baselineFile) {
    try {
      const bl = loadBaseline(baselineFile);
      baselineFingerprints = bl.fingerprints;
    } catch (err) {
      console.error(`Baseline error: ${err.message}`);
      return 2;
    }
  }

  // ── SCANNER ─────────────────────────────────────────────────────────────────
  let scan;
  try {
    scan = await getScanner();
  } catch (err) {
    console.error(`Scanner engine error: ${err.message}`);
    return 2;
  }

  // ── PR CONTEXT ──────────────────────────────────────────────────────────────
  const prCtx = getPrContext();
  let files;

  if ((pr || prCtx.isPr) && prCtx.baseRef && isGitAvailable()) {
    // PR mode: scan only changed files for faster feedback
    const gitRoot    = getGitRoot(cwd) || cwd;
    const baseRef    = `origin/${prCtx.baseRef}`;
    const headRef    = prCtx.headRef || 'HEAD';
    const changedPaths = getChangedFilePaths(baseRef, headRef, cwd);

    if (!quiet_mode) {
      console.log(`  PR scan: ${changedPaths.length} changed file(s)\n`);
    }

    files = readFiles(changedPaths, {
      maxFileSize: cfg.scan.maxFileSize,
      root:        gitRoot,
    }).filter(f => !isIgnored(f.name, effectiveIgnore));

  } else {
    // Full scan
    files = collectFiles(cwd, {
      ignorePatterns: effectiveIgnore,
      maxFileSize:    cfg.scan.maxFileSize,
      root:           cwd,
    });
  }

  // ── SCAN ────────────────────────────────────────────────────────────────────
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

  // ── FILTER ──────────────────────────────────────────────────────────────────
  const { active, suppressed } = filterAgainstBaseline(result.findings || [], baselineFingerprints);

  const threshold      = severity || failOn || cfg.severityThreshold || 'high';
  const aboveThreshold = active.filter(f => meetsThreshold(f.severity, threshold));

  const stats = {
    total:        aboveThreshold.length,
    critical:     aboveThreshold.filter(f => f.severity === 'CRITICAL').length,
    high:         aboveThreshold.filter(f => f.severity === 'HIGH').length,
    medium:       aboveThreshold.filter(f => f.severity === 'MEDIUM').length,
    low:          aboveThreshold.filter(f => f.severity === 'LOW').length,
    filesScanned: result.statistics?.filesScanned ?? files.length,
  };

  // ── OUTPUT ──────────────────────────────────────────────────────────────────
  if (typeof sarif === 'string') {
    const repoUri  = prCtx.repo ? `https://github.com/${prCtx.repo}` : null;
    const sarifOutput = toSarif(aboveThreshold, { repoUri, commitSha: prCtx.sha });
    try {
      writeFileSync(resolve(cwd, sarif), sarifOutput, 'utf8');
      if (!quiet) console.log(`  ✓ SARIF report saved to: ${sarif}`);
    } catch (err) {
      console.error(`Failed to write SARIF report: ${err.message}`);
    }
  }

  if (json) {
    const output = {
      tool:       'SecretShield',
      version:    '2.0.0',
      timestamp:  new Date().toISOString(),
      ci:         true,
      pr:         prCtx.isPr,
      statistics: stats,
      suppressed,
      passed:     aboveThreshold.length === 0,
      findings:   aboveThreshold.map(f => {
        const { rawValue, raw, secret, ...safe } = f;
        return safe;
      }),
    };
    console.log(JSON.stringify(output, null, 2));

  } else if (sarif === true) {
    const repoUri  = prCtx.repo ? `https://github.com/${prCtx.repo}` : null;
    console.log(toSarif(aboveThreshold, { repoUri, commitSha: prCtx.sha }));

  } else {
    printCiResult({
      findings:  aboveThreshold,
      suppressed,
      stats,
      prContext: prCtx,
      quiet,
      verbose,
    });
  }

  return aboveThreshold.length > 0 ? 1 : 0;
}
