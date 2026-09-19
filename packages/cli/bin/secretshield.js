#!/usr/bin/env node
/**
 * bin/secretshield.js — CLI entry point
 *
 * SecretShield — detect secrets before they reach Git.
 *
 * Usage:
 *   secretshield scan [path]        Scan files
 *   secretshield scan --staged      Scan Git staged files
 *   secretshield scan --history     Scan Git commit history
 *   secretshield scan --diff        Scan unified diff text from stdin or file
 *   secretshield scan --json        JSON output
 *   secretshield scan --sarif       SARIF 2.1.0 output
 *   secretshield init               Generate .secretshield.json configuration
 *   secretshield rules [filter]     List rules (all, enabled, disabled)
 *   secretshield benchmark          Run throughput performance benchmark
 *   secretshield baseline create    Create .secretshield-baseline.json
 *   secretshield baseline update    Update baseline file
 *   secretshield install-hook       Install Git pre-commit hook
 *
 * Security:
 *   - Raw secrets NEVER printed to stdout/stderr
 *   - No external network calls
 *   - No AI API calls
 *   - Repository contents treated as untrusted
 */

import { program } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Read version from package.json
let version = '2.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  version = pkg.version;
} catch { /* use default */ }

// ── SCAN COMMAND ──────────────────────────────────────────────────────────────
program
  .name('secretshield')
  .description('SecretShield — detect secrets before they reach Git')
  .version(version);

program
  .command('scan [path]')
  .description('Scan files for exposed secrets')
  .option('--staged',    'Scan only Git staged files (for pre-commit use)')
  .option('--history',   'Also scan Git commit history')
  .option('--diff [file]', 'Scan unified diff text from file or stdin')
  .option('--json',      'Output findings as JSON')
  .option('--sarif',     'Output findings as SARIF 2.1.0')
  .option('--quiet',     'Suppress informational output')
  .option('--verbose',   'Show extra detail (rule matches, confidence scores)')
  .option('--config <file>', 'Path to configuration file (default: .secretshield.json)')
  .option('--baseline <file>', 'Baseline file to exclude known findings')
  .option('--fail-on <severity>', 'Severity threshold that triggers exit code 1 (default: low)', 'low')
  .action(async (scanPath, opts) => {
    const { runScan } = await import('../lib/commands/scan.js');
    const exitCode = await runScan(scanPath || '.', opts);
    process.exit(exitCode);
  });

// ── INIT COMMAND ──────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize .secretshield.json configuration with setup instructions')
  .option('--force', 'Overwrite existing configuration file')
  .option('--severity <level>', 'Initial severity threshold (low, medium, high, critical)', 'low')
  .action(async (opts) => {
    const { initCommand } = await import('../lib/commands/init.js');
    const exitCode = await initCommand(opts);
    process.exit(exitCode);
  });

// ── RULES COMMAND ─────────────────────────────────────────────────────────────
const rules = program
  .command('rules [filter]')
  .description('List and inspect available detection rules (filter: all, enabled, disabled)')
  .option('--json', 'Output rules list as JSON')
  .option('--config <file>', 'Path to configuration file')
  .action(async (filter, opts) => {
    const { rulesCommand } = await import('../lib/commands/rules.js');
    const exitCode = await rulesCommand(filter || 'all', opts);
    process.exit(exitCode);
  });

// ── CI COMMAND ────────────────────────────────────────────────────────────────
program
  .command('ci')
  .description('CI mode — scan repository, exit 1 on findings above threshold')
  .option('--json',       'Output findings as JSON')
  .option('--sarif',      'Output findings as SARIF 2.1.0')
  .option('--quiet',      'Suppress informational output (only emit JSON/SARIF)')
  .option('--verbose',    'Show extra detail')
  .option('--config <file>', 'Path to configuration file')
  .option('--baseline <file>', 'Baseline file to exclude known findings')
  .option('--fail-on <severity>', 'Severity threshold (default: high)', 'high')
  .option('--pr',         'PR-aware mode: scan only changed files when possible')
  .action(async (opts) => {
    const { runCi } = await import('../lib/commands/ci.js');
    const exitCode = await runCi(opts);
    process.exit(exitCode);
  });

// ── BASELINE COMMAND ──────────────────────────────────────────────────────────
const baseline = program
  .command('baseline')
  .description('Manage SecretShield baseline (known accepted findings)');

baseline
  .command('create [path]')
  .description('Scan and create .secretshield-baseline.json from current findings')
  .option('--config <file>', 'Path to configuration file')
  .option('--output <file>', 'Baseline output file (default: .secretshield-baseline.json)')
  .action(async (scanPath, opts) => {
    const { createBaseline } = await import('../lib/commands/baseline.js');
    const exitCode = await createBaseline(scanPath || '.', opts);
    process.exit(exitCode);
  });

baseline
  .command('list [file]')
  .description('List fingerprints in baseline file')
  .action(async (file, opts) => {
    const { listBaseline } = await import('../lib/commands/baseline.js');
    const exitCode = await listBaseline(file, opts);
    process.exit(exitCode);
  });

baseline
  .command('remove <fingerprint> [file]')
  .description('Remove a fingerprint from the baseline file')
  .action(async (fingerprint, file, opts) => {
    const { removeFromBaseline } = await import('../lib/commands/baseline.js');
    const exitCode = await removeFromBaseline(fingerprint, file, opts);
    process.exit(exitCode);
  });

baseline
  .command('update [path]')
  .description('Update baseline: add new findings, keep existing ones')
  .option('--config <file>', 'Path to configuration file')
  .option('--baseline <file>', 'Baseline file to update (default: .secretshield-baseline.json)')
  .action(async (scanPath, opts) => {
    const { updateBaseline } = await import('../lib/commands/baseline.js');
    const exitCode = await updateBaseline(scanPath || '.', opts);
    process.exit(exitCode);
  });

// ── BENCHMARK COMMAND ─────────────────────────────────────────────────────────
program
  .command('benchmark')
  .description('Run synthetic throughput & rule latency benchmark')
  .option('--files <count>', 'Number of synthetic files (default: 1000)', '1000')
  .action(async (opts) => {
    const { runBenchmarkCommand } = await import('../lib/commands/benchmark.js');
    const exitCode = await runBenchmarkCommand(opts);
    process.exit(exitCode);
  });

// ── INSTALL-HOOK COMMAND ──────────────────────────────────────────────────────
program
  .command('install-hook')
  .description('Install SecretShield as a Git pre-commit hook')
  .option('--force', 'Overwrite existing hook')
  .action(async (opts) => {
    const { installHook } = await import('../lib/commands/install-hook.js');
    const exitCode = await installHook(opts);
    process.exit(exitCode);
  });

program.parseAsync(process.argv).catch(err => {
  console.error('SecretShield error:', err.message);
  process.exit(2);
});
