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
  .option('--sarif [file]', 'Output findings as SARIF 2.1.0 (or save to file)')
  .option('--quiet',     'Suppress informational output')
  .option('--verbose',   'Show extra detail (rule matches, confidence scores)')
  .option('--config <file>', 'Path to configuration file (default: .secretshield.json)')
  .option('--baseline <file>', 'Baseline file to exclude known findings')
  .option('--ignore <patterns>', 'Comma-separated glob patterns to ignore (e.g. "test/**,fixtures/**")')
  .option('--fail-on <severity>', 'Severity threshold that triggers exit code 1 (default: low)')
  .option('--severity <severity>', 'Severity threshold alias for --fail-on')
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
program
  .command('rules [action] [target]')
  .description('Manage and inspect Rule Packs (list, search, validate, test, install, update, remove, info)')
  .option('--json', 'Output results as JSON')
  .option('--config <file>', 'Path to configuration file')
  .option('--lock <version>', 'Lock rule pack to a specific version')
  .action(async (action, target, opts) => {
    const { rulesCommand } = await import('../lib/commands/rules.js');
    const exitCode = await rulesCommand(action || 'list', target || '', opts);
    process.exit(exitCode);
  });

// ── CI COMMAND ────────────────────────────────────────────────────────────────
program
  .command('ci')
  .description('CI mode — scan repository, exit 1 on findings above threshold')
  .option('--json',       'Output findings as JSON')
  .option('--sarif [file]', 'Output findings as SARIF 2.1.0 (or save to file)')
  .option('--quiet',      'Suppress informational output (only emit JSON/SARIF)')
  .option('--verbose',    'Show extra detail')
  .option('--config <file>', 'Path to configuration file')
  .option('--baseline <file>', 'Baseline file to exclude known findings')
  .option('--ignore <patterns>', 'Comma-separated glob patterns to ignore')
  .option('--fail-on <severity>', 'Severity threshold (default: high)')
  .option('--severity <severity>', 'Severity threshold alias for --fail-on')
  .option('--pr',         'PR-aware mode: scan only changed files when possible')
  .action(async (opts) => {
    const { runCi } = await import('../lib/commands/ci.js');
    const exitCode = await runCi(opts);
    process.exit(exitCode);
  });

// ── POLICY COMMAND ────────────────────────────────────────────────────────────
const policy = program
  .command('policy')
  .description('Enforce and audit organization security policies');

policy
  .command('check [path]')
  .description('Evaluate security policies against repository findings')
  .option('--dry-run',        'Evaluate policies without failing CI exit code')
  .option('--config <file>',   'Path to configuration file')
  .option('--baseline <file>', 'Baseline file to exclude known findings')
  .option('--ignore <patterns>', 'Comma-separated glob patterns to ignore')
  .option('--json',           'Output policy evaluation result as JSON')
  .option('--verbose',        'Show detailed condition match trace')
  .action(async (scanPath, opts) => {
    const { runPolicyCheck } = await import('../lib/commands/policy.js');
    const exitCode = await runPolicyCheck(scanPath || '.', opts);
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
  .option('--ignore <patterns>', 'Comma-separated glob patterns to ignore')
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
  .option('--ignore <patterns>', 'Comma-separated glob patterns to ignore')
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

// ── EXPOSURE COMMAND ──────────────────────────────────────────────────────────
program
  .command('exposure [action] [target]')
  .description('Inspect secret exposure clusters and duration metrics')
  .option('--json', 'Output results as JSON')
  .option('--repository <repo>', 'Filter by repository')
  .option('--status <status>', 'Filter by lifecycle status')
  .action(async (action, target, opts) => {
    const { exposureCommand } = await import('../lib/commands/exposure.js');
    const exitCode = await exposureCommand(action, target, opts);
    process.exit(exitCode);
  });

// ── HISTORY COMMAND ───────────────────────────────────────────────────────────
program
  .command('history')
  .description('Trace chronological exposure events and Git propagations for a fingerprint')
  .option('--fingerprint <hash>', 'Target secret fingerprint')
  .option('--json', 'Output results as JSON')
  .action(async (opts) => {
    const { historyCommand } = await import('../lib/commands/exposure.js');
    const exitCode = await historyCommand(opts);
    process.exit(exitCode);
  });

// ── GRAPH COMMAND ─────────────────────────────────────────────────────────────
program
  .command('graph')
  .description('View evidence-backed dependency and attack-path topology graph')
  .option('--repository <repo>', 'Filter by repository')
  .option('--fingerprint <hash>', 'Focus on specific fingerprint')
  .option('--depth <depth>', 'Maximum traversal depth', '4')
  .option('--json', 'Output graph topology as JSON')
  .action(async (opts) => {
    const { graphCommand } = await import('../lib/commands/exposure.js');
    const exitCode = await graphCommand(opts);
    process.exit(exitCode);
  });

// ── INVESTIGATE COMMAND ───────────────────────────────────────────────────────
program
  .command('investigate <fingerprint>')
  .description('Run comprehensive security investigation for a secret fingerprint')
  .option('--json', 'Output results as JSON')
  .action(async (fingerprint, opts) => {
    const { exposureCommand } = await import('../lib/commands/exposure.js');
    const exitCode = await exposureCommand('investigate', fingerprint, opts);
    process.exit(exitCode);
  });

// ── WATCH COMMAND ─────────────────────────────────────────────────────────────
program
  .command('watch [path]')
  .description('Continuously monitor directory for secret introductions')
  .option('--staged', 'Watch only Git staged files')
  .option('--ci', 'CI watch mode — exits with non-zero code on blocking findings')
  .option('--debounce <ms>', 'Debounce interval in milliseconds', '300')
  .option('--json', 'Output findings as JSON stream')
  .action(async (targetPath, opts) => {
    const { watchCommand } = await import('../lib/commands/watch.js');
    const exitCode = await watchCommand(targetPath || '.', opts);
    process.exit(exitCode);
  });

// ── DEV COMMAND ───────────────────────────────────────────────────────────────
program
  .command('dev [path]')
  .description('Start local developer continuous protection console')
  .option('--json', 'Output developer environment status as JSON')
  .action(async (targetPath, opts) => {
    const { devCommand } = await import('../lib/commands/watch.js');
    const exitCode = await devCommand(targetPath || '.', opts);
    process.exit(exitCode);
  });

program.parseAsync(process.argv).catch(err => {
  console.error('SecretShield error:', err.message);
  process.exit(2);
});

