/**
 * lib/commands/baseline.js
 *
 * `secretshield baseline` sub-commands.
 *
 * create:  scan + create baseline file (fingerprints only)
 * list:    show baseline contents
 * remove:  remove a fingerprint from baseline
 * update:  add new findings to baseline, keep existing
 */

import { resolve } from 'path';
import { collectFiles, getScanner } from '../scanner-bridge.js';
import { loadConfig } from '../config.js';
import {
  loadBaseline, saveBaseline,
  createBaselineFromFindings, removeFingerprint,
} from '../baseline.js';
import { printBanner, printWarnings } from '../formatters/human.js';

const DEFAULT_BASELINE_FILE = '.secretshield-baseline.json';

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createBaseline(scanPath, opts = {}) {
  const cwd    = resolve(scanPath || process.cwd());
  const outFile = opts.output
    ? resolve(opts.output)
    : resolve(cwd, DEFAULT_BASELINE_FILE);

  const { config: cfg, warnings } = loadConfig(opts.config, cwd);
  const cliIgnores = opts.ignore
    ? (Array.isArray(opts.ignore) ? opts.ignore : String(opts.ignore).split(',')).map(s => s.trim()).filter(Boolean)
    : [];
  const effectiveIgnore = Array.from(new Set([...(cfg.ignore || []), ...cliIgnores]));

  printBanner();
  printWarnings(warnings);

  console.log(`  Creating baseline from: ${scanPath || '.'}\n`);

  let scan;
  try {
    scan = await getScanner();
  } catch (err) {
    console.error(`Scanner error: ${err.message}`);
    return 2;
  }

  const files = collectFiles(cwd, {
    ignorePatterns: effectiveIgnore,
    maxFileSize:    cfg.scan.maxFileSize,
    root:           cwd,
  });

  let result;
  try {
    result = scan({ files });
  } catch (err) {
    console.error(`Scan error: ${err.message}`);
    return 2;
  }

  const entries  = createBaselineFromFindings(result.findings || []);
  saveBaseline(outFile, entries);

  console.log(`  ✓ Baseline saved: ${outFile}`);
  console.log(`  ${entries.length} fingerprint(s) stored.`);
  console.log(`\n  Use with CI:\n  secretshield ci --baseline ${outFile}\n`);
  return 0;
}

// ── LIST ──────────────────────────────────────────────────────────────────────

export async function listBaseline(file, _opts = {}) {
  const filePath = file
    ? resolve(file)
    : resolve(process.cwd(), DEFAULT_BASELINE_FILE);

  let bl;
  try {
    bl = loadBaseline(filePath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 2;
  }

  if (!bl.source) {
    console.log('  No baseline file found.');
    console.log(`  Run: secretshield baseline create\n`);
    return 0;
  }

  console.log('');
  console.log(`  Baseline: ${bl.source}`);
  console.log(`  Entries:  ${bl.entries.length}\n`);

  if (bl.entries.length === 0) {
    console.log('  (empty)\n');
    return 0;
  }

  for (const e of bl.entries) {
    console.log(`  ${e.fingerprint.slice(0, 16)}…  ${e.severity?.padEnd(8) || '        '}  ${e.type || 'UNKNOWN'}`);
    console.log(`                      ${e.file || 'unknown'}`);
    if (e.note) console.log(`                      Note: ${e.note}`);
    console.log('');
  }
  return 0;
}

// ── REMOVE ────────────────────────────────────────────────────────────────────

export async function removeFromBaseline(fingerprint, file, _opts = {}) {
  const filePath = file
    ? resolve(file)
    : resolve(process.cwd(), DEFAULT_BASELINE_FILE);

  try {
    const removed = removeFingerprint(filePath, fingerprint);
    if (removed) {
      console.log(`  ✓ Removed ${fingerprint} from ${filePath}`);
      return 0;
    } else {
      console.log(`  Fingerprint not found in baseline: ${fingerprint}`);
      return 1;
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 2;
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateBaseline(scanPath, opts = {}) {
  const cwd         = resolve(scanPath || process.cwd());
  const baselineFile = opts.baseline
    ? resolve(opts.baseline)
    : resolve(cwd, DEFAULT_BASELINE_FILE);

  const { config: cfg, warnings } = loadConfig(opts.config, cwd);
  const cliIgnores = opts.ignore
    ? (Array.isArray(opts.ignore) ? opts.ignore : String(opts.ignore).split(',')).map(s => s.trim()).filter(Boolean)
    : [];
  const effectiveIgnore = Array.from(new Set([...(cfg.ignore || []), ...cliIgnores]));

  printWarnings(warnings);

  // Load existing
  let existing;
  try {
    existing = loadBaseline(baselineFile);
  } catch {
    existing = { entries: [], fingerprints: new Set() };
  }

  let scan;
  try {
    scan = await getScanner();
  } catch (err) {
    console.error(`Scanner error: ${err.message}`);
    return 2;
  }

  const files = collectFiles(cwd, {
    ignorePatterns: effectiveIgnore,
    maxFileSize:    cfg.scan.maxFileSize,
    root:           cwd,
  });

  let result;
  try {
    result = scan({ files });
  } catch (err) {
    console.error(`Scan error: ${err.message}`);
    return 2;
  }

  // Only add new fingerprints
  const newFindings = (result.findings || []).filter(
    f => f.fingerprint && !existing.fingerprints.has(f.fingerprint)
  );

  const newEntries = createBaselineFromFindings(newFindings, 'Added by secretshield baseline update');
  const merged     = [...existing.entries, ...newEntries];

  saveBaseline(baselineFile, merged);

  console.log(`\n  Baseline updated: ${baselineFile}`);
  console.log(`  Added ${newEntries.length} new fingerprint(s).`);
  console.log(`  Total: ${merged.length} fingerprint(s).\n`);
  return 0;
}
