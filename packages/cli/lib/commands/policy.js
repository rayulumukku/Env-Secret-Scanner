/**
 * @file packages/cli/lib/commands/policy.js
 * @description CLI command for policy evaluation (`secretshield policy check`).
 * 
 * Exit codes:
 *   0 = pass (no policy violations, or passed in --dry-run)
 *   1 = policy violation detected
 *   2 = execution / configuration error
 */

import { resolve } from 'path';
import { loadConfig } from '../config.js';
import { scanDirectoryBridge } from '../scanner-bridge.js';
import { filterAgainstBaseline } from '../baseline.js';

export async function runPolicyCheck(scanPath = '.', options = {}) {
  const {
    config: configPath,
    baseline: baselinePath,
    dryRun = false,
    json = false,
    verbose = false
  } = options;

  try {
    const targetDir = resolve(process.cwd(), scanPath);
    const { config, warnings } = loadConfig(configPath, targetDir);

    if (warnings.length > 0 && verbose) {
      for (const w of warnings) {
        console.warn(`[warning] ${w}`);
      }
    }

    // Run scanner engine
    const scanResult = await scanDirectoryBridge(targetDir, {
      ...config,
      failOn: 'low'
    });

    let findings = scanResult.findings || [];

    // Filter against baseline if present
    if (baselinePath) {
      const baselineResult = filterAgainstBaseline(findings, baselinePath);
      findings = baselineResult.activeFindings;
    }

    const policyRules = config.policies || {
      severityThreshold: 'high',
      blockCritical: true,
      blockHigh: false
    };

    const violations = [];

    for (const f of findings) {
      const sev = String(f.severity || 'LOW').toUpperCase();

      if (policyRules.blockCritical && sev === 'CRITICAL') {
        violations.push({
          policy: 'Block Critical Secrets',
          findingId: f.id,
          ruleId: f.ruleId,
          severity: sev,
          file: f.file,
          line: f.line,
          maskedValue: f.maskedValue || '••••••••',
          action: 'FAIL_CI',
          reason: 'Critical severity finding detected in repository'
        });
      } else if (policyRules.blockHigh && sev === 'HIGH') {
        violations.push({
          policy: 'Block High Secrets',
          findingId: f.id,
          ruleId: f.ruleId,
          severity: sev,
          file: f.file,
          line: f.line,
          maskedValue: f.maskedValue || '••••••••',
          action: 'FAIL_CI',
          reason: 'High severity finding detected in repository'
        });
      }
    }

    const passed = violations.length === 0;

    if (json) {
      console.log(JSON.stringify({
        evaluatedAt: new Date().toISOString(),
        targetPath: targetDir,
        passed: passed || dryRun,
        isDryRun: dryRun,
        totalFindings: findings.length,
        violationsCount: violations.length,
        violations
      }, null, 2));
      return (passed || dryRun) ? 0 : 1;
    }

    // Human-readable CLI output
    console.log('\n  SecretShield  v2.0  Policy Evaluation');
    console.log('  ─────────────────────────────────────');
    if (dryRun) {
      console.log('  Mode: DRY RUN (violations will not fail CI)\n');
    }

    if (passed) {
      console.log('  ✓ No policy violations detected\n');
      console.log(`  Scanned: ${scanResult.filesScanned || 0} file(s)`);
      console.log('  Status:  PASSED\n');
      return 0;
    }

    console.log(`  ✕ Policy violations detected (${violations.length})\n`);
    for (const v of violations) {
      console.log(`  • Policy:   ${v.policy}`);
      console.log(`    Rule:     ${v.ruleId} [${v.severity}]`);
      console.log(`    Location: ${v.file}:${v.line}`);
      console.log(`    Secret:   ${v.maskedValue}`);
      console.log(`    Reason:   ${v.reason}`);
      console.log('');
    }

    if (dryRun) {
      console.log('  [DRY RUN] Policy violations found but ignored for CI exit code.\n');
      return 0;
    }

    return 1;
  } catch (err) {
    console.error(`\nSecretShield Policy Error: ${err.message}\n`);
    return 2;
  }
}
