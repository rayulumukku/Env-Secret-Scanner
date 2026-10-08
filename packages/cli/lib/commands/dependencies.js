/**
 * packages/cli/lib/commands/dependencies.js
 *
 * SecretShield CLI Dependencies Command Suite.
 *
 * Commands:
 *   secretshield dependencies
 *   secretshield dependencies scan [path]
 *   secretshield dependencies tree [path]
 *   secretshield dependencies audit [path]
 *   secretshield dependencies update --dry-run [path]
 *
 * Flags supported: --json, --sarif, --quiet, --no-color
 *
 * SECURITY INVARIANTS:
 * - NEVER prints raw secrets or credentials.
 * - Does NOT execute package installations or lifecycle scripts.
 */

import { resolve } from 'path';
import { readFileSync } from 'fs';
import {
  scanProjectDependencies,
  formatAsciiDependencyTree,
  generateDependencySarif,
  proposeDependencyUpdate,
  validateWorkspaceBoundary,
} from '../../../dependency-engine/index.js';

export async function dependenciesCommand(subcommand = '', targetPath = '.', options = {}) {
  const normPath = resolve(targetPath || '.');

  // 1. DEPENDENCIES TREE
  if (subcommand === 'tree') {
    const scanResult = scanProjectDependencies(normPath, { checkReachability: false });

    if (options.json) {
      console.log(JSON.stringify(scanResult.graph.tree, null, 2));
      return 0;
    }

    if (options.quiet) return 0;

    console.log('\n  SecretShield  v2.0  Dependency Tree');
    console.log('  ─────────────────────────────────────────────────────────────────────────────\n');
    console.log(formatAsciiDependencyTree(scanResult.graph.tree));
    console.log(`\n  Total: ${scanResult.statistics.totalDependencies} dependencies (${scanResult.statistics.directCount} direct, ${scanResult.statistics.transitiveCount} transitive)\n`);
    return 0;
  }

  // 2. DEPENDENCIES UPDATE --DRY-RUN
  if (subcommand === 'update') {
    const pkgName = options.package || options.pkg;
    const toVersion = options.to || options.version;

    if (!pkgName || !toVersion) {
      console.error('Error: --package and --to version are required for update proposal.');
      return 1;
    }

    const manifestFile = options.manifest || 'package.json';
    try {
      const safePath = validateWorkspaceBoundary(normPath, manifestFile);
      const content = readFileSync(safePath, 'utf8');

      const patch = proposeDependencyUpdate({
        manifestPath: manifestFile,
        originalContent: content,
        packageName: pkgName,
        currentVersion: '',
        proposedVersion: toVersion,
      });

      if (!patch.success) {
        console.error(`Error: ${patch.details?.error || 'Failed to generate patch'}`);
        return 1;
      }

      if (options.json) {
        console.log(JSON.stringify(patch, null, 2));
        return 0;
      }

      console.log('\n  SecretShield  v2.0  Proposed Safe Dependency Update (DRY-RUN)');
      console.log('  ─────────────────────────────────────────────────────────────────────────────\n');
      console.log(patch.diff);
      console.log('\n  Safe dry-run completed. File was NOT modified without explicit confirmation.\n');
      return 0;
    } catch (err) {
      console.error(`Error: ${err.message}`);
      return 1;
    }
  }

  // 3. SCAN / AUDIT / DEFAULT OVERVIEW
  const isAudit = subcommand === 'audit';
  const scanResult = scanProjectDependencies(normPath, { checkReachability: true });

  // SARIF Output
  if (options.sarif) {
    const sarif = generateDependencySarif(scanResult.vulnerabilities, {
      projectPath: normPath,
    });
    console.log(JSON.stringify(sarif, null, 2));
    return scanResult.statistics.criticalHighCount > 0 ? 1 : 0;
  }

  // JSON Output
  if (options.json) {
    console.log(JSON.stringify(scanResult, null, 2));
    return scanResult.statistics.criticalHighCount > 0 ? 1 : 0;
  }

  if (options.quiet) {
    return scanResult.statistics.criticalHighCount > 0 ? 1 : 0;
  }

  console.log('\n  SecretShield  v2.0  Software Supply-Chain & Dependency Intelligence');
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

  console.log(`  Target Path:         ${normPath}`);
  console.log(`  Manifests Detected:  ${scanResult.manifests.join(', ') || 'None'}`);
  console.log(`  Lockfiles Detected:  ${scanResult.lockfiles.join(', ') || 'None'}`);
  console.log(`  Total Dependencies:  ${scanResult.statistics.totalDependencies}`);
  console.log(`  Direct Dependencies: ${scanResult.statistics.directCount}`);
  console.log(`  Transitive:          ${scanResult.statistics.transitiveCount}`);
  console.log(`  Vulnerabilities:     ${scanResult.statistics.vulnerabilitiesCount}`);
  console.log(`  Critical / High:     ${scanResult.statistics.criticalHighCount}`);
  console.log(`  Suspicious Signals:  ${scanResult.statistics.suspiciousSignalsCount}`);
  console.log(`  License Reviews:     ${scanResult.statistics.licenseReviewItemsCount}\n`);

  if (scanResult.vulnerabilities.length > 0) {
    console.log('  ACTIVE VULNERABILITIES:');
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    for (const v of scanResult.vulnerabilities) {
      const sev = String(v.severity || 'MED').padEnd(8, ' ');
      const pkg = `${v.package}@${v.installedVersion}`.padEnd(25, ' ');
      const fix = v.fixedVersion ? `Fixed: ${v.fixedVersion}` : 'No fix';
      console.log(`  [${sev}] ${pkg} ${v.advisoryId} (${fix})`);
      console.log(`           ${v.summary}`);
      if (v.dependencyPath && v.dependencyPath.length > 1) {
        console.log(`           Path: ${v.dependencyPath.join(' → ')}`);
      }
      console.log('');
    }
  } else {
    console.log('  ✓ No known security advisories match installed dependencies.\n');
  }

  if (scanResult.heuristicSignals.length > 0) {
    console.log('  SUSPICIOUS HEURISTIC SIGNALS:');
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    for (const s of scanResult.heuristicSignals) {
      console.log(`  [SIGNAL] ${s.package}: ${s.summary}`);
    }
    console.log('');
  }

  // Audit mode returns exit code 1 if critical/high vulnerabilities exist
  if (isAudit && scanResult.statistics.criticalHighCount > 0) {
    return 1;
  }

  return 0;
}
