/**
 * lib/commands/watch.js
 *
 * Local Continuous Watch & Dev Mode for SecretShield CLI.
 *
 * Usage:
 *   secretshield watch [path]
 *   secretshield watch --staged
 *   secretshield watch --ci
 *   secretshield dev
 *
 * SAFETY INVARIANTS:
 *   - NEVER prints raw secrets to stdout/stderr.
 *   - Debounces file change events to avoid CPU spinning.
 *   - Supports graceful shutdown on SIGINT/SIGTERM.
 */

import { watch } from 'fs';
import { resolve, relative } from 'path';
import { scanText, ALL_RULES } from '@secretshield/scanner';
import { readFileSync, statSync, existsSync } from 'fs';

/**
 * Run continuous watch mode.
 *
 * @param {string} targetPath
 * @param {object} opts
 * @returns {Promise<number>} Exit code
 */
export async function watchCommand(targetPath = '.', opts = {}) {
  const rootDir = resolve(process.cwd(), targetPath);
  const isCi = Boolean(opts.ci);
  const isStaged = Boolean(opts.staged);
  const isJson = Boolean(opts.json);
  const debounceMs = parseInt(opts.debounce || '300', 10);

  if (!isJson) {
    console.log('\n  SecretShield  v2.0  Continuous Watch Mode');
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    console.log(`  Watching: ${rootDir}`);
    console.log(`  Mode: ${isStaged ? 'Git Staged Files' : 'Filesystem Live Watch'}`);
    console.log('  Press Ctrl+C to stop.\n');
  }

  let debounceTimer = null;
  const changedFiles = new Set();
  let hasBlockingFindings = false;

  const runTriggeredScan = async () => {
    const filesToScan = Array.from(changedFiles);
    changedFiles.clear();

    if (filesToScan.length === 0) return;

    let totalFindings = 0;
    const findingsList = [];

    for (const filePath of filesToScan) {
      if (!existsSync(filePath)) continue;
      try {
        const stat = statSync(filePath);
        if (stat.isDirectory()) continue;
        if (filePath.includes('node_modules') || filePath.includes('.git')) continue;

        const content = readFileSync(filePath, 'utf8');
        const rel = relative(process.cwd(), filePath);
        const findings = scanText(content, rel);

        if (findings.length > 0) {
          totalFindings += findings.length;
          findingsList.push(...findings);
        }
      } catch {
        // ignore unreadable/binary files
      }
    }

    if (isJson) {
      if (findingsList.length > 0) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          findingsCount: totalFindings,
          findings: findingsList.map(f => ({
            ruleId: f.ruleId,
            ruleName: f.ruleName,
            file: f.file,
            line: f.line,
            severity: f.severity,
            fingerprint: f.fingerprint,
            maskedValue: f.maskedValue,
          })),
        }, null, 2));
      }
    } else {
      const now = new Date().toLocaleTimeString();
      if (totalFindings > 0) {
        hasBlockingFindings = true;
        console.log(`  [${now}] ✖ ${totalFindings} secret finding(s) detected in ${filesToScan.length} modified file(s):`);
        for (const f of findingsList) {
          console.log(`    - [${f.severity}] ${f.ruleName} in ${f.file}:${f.line} (${f.maskedValue})`);
        }
      } else {
        console.log(`  [${now}] ✔ Clean: scanned ${filesToScan.length} modified file(s) — 0 findings.`);
      }
    }

    if (isCi && hasBlockingFindings) {
      process.exit(1);
    }
  };

  return new Promise((resolvePromise) => {
    let watcher = null;
    try {
      watcher = watch(rootDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        if (filename.includes('node_modules') || filename.includes('.git') || filename.includes('.next')) return;

        changedFiles.add(resolve(rootDir, filename));
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runTriggeredScan, debounceMs);
      });
    } catch (err) {
      if (!isJson) console.error(`  ✖ Watch error: ${err.message}`);
      return resolvePromise(2);
    }

    const cleanup = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (watcher) watcher.close();
      if (!isJson) console.log('\n  SecretShield watch mode stopped.\n');
      resolvePromise(hasBlockingFindings && isCi ? 1 : 0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  });
}

/**
 * Developer local continuous console mode.
 *
 * @param {string} targetPath
 * @param {object} opts
 * @returns {Promise<number>} Exit code
 */
export async function devCommand(targetPath = '.', opts = {}) {
  const rootDir = resolve(process.cwd(), targetPath);
  const isJson = Boolean(opts.json);

  if (isJson) {
    console.log(JSON.stringify({
      mode: 'dev',
      scannerVersion: '2.0.0',
      activeRulesCount: ALL_RULES.length,
      watchedDirectory: rootDir,
      status: 'READY',
    }, null, 2));
    return 0;
  }

  console.log('\n  SecretShield  v2.0  Local Developer Mode');
  console.log('  ─────────────────────────────────────────────────────────────────────────────');
  console.log(`  Local Scanner Engine:   v2.0.0 (Active Rules: ${ALL_RULES.length})`);
  console.log(`  Watched Directory:      ${rootDir}`);
  console.log('  Policy Evaluation:      Local Offline Engine (No SaaS connection required)');
  console.log('  Detection Rules:        Core + Community Rule Packs');
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

  return watchCommand(targetPath, opts);
}
