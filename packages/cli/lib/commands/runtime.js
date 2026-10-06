/**
 * packages/cli/lib/commands/runtime.js
 *
 * SecretShield CLI Runtime Exposure & Deployment Commands.
 *
 * Commands:
 *   secretshield runtime
 *   secretshield runtime deployments
 *   secretshield runtime exposure
 *
 * Flags supported: --json, --quiet, --no-color
 *
 * INVARIANT: Never outputs raw credentials or connection secrets.
 */

import { listDeployments, listRuntimeAssets, listEnvironments } from '../../../../app-src/lib/db/runtime.js';
import { memoryDb } from '../../../../app-src/lib/db/client.js';
import { correlateFindingToRuntime } from '../../../../app-src/lib/runtime/correlation.js';

export async function runtimeCommand(subcommand = '', options = {}) {
  const orgId = options.organization || 'default-org';

  // 1. RUNTIME DEPLOYMENTS
  if (subcommand === 'deployments') {
    const { deployments, total } = await listDeployments({
      organizationId: orgId,
      repositoryId: options.repository || null,
      environment: options.environment || null,
      limit: 100,
    });

    if (options.json) {
      console.log(JSON.stringify({ deployments, total }, null, 2));
      return 0;
    }

    if (options.quiet) return 0;

    console.log('\n  SecretShield  v2.0  Deployment Inventory');
    console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

    if (deployments.length === 0) {
      console.log('  No deployments recorded for this organization.\n');
      return 0;
    }

    console.log('  ID          COMMIT      ENVIRONMENT    PROVIDER         STATUS');
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    for (const dep of deployments) {
      const id = String(dep.id || '').slice(0, 10).padEnd(11, ' ');
      const sha = String(dep.commitSha || '').slice(0, 10).padEnd(11, ' ');
      const env = String(dep.environment || 'custom').slice(0, 13).padEnd(14, ' ');
      const prov = String(dep.provider || 'ci').slice(0, 15).padEnd(16, ' ');
      const status = String(dep.status || 'SUCCESS');
      console.log(`  ${id} ${sha} ${env} ${prov} ${status}`);
    }
    console.log(`\n  Total deployments: ${total}\n`);
    return 0;
  }

  // 2. RUNTIME EXPOSURE
  if (subcommand === 'exposure') {
    const findings = Array.from(memoryDb.findings.values()).filter(f => f.organizationId === orgId);
    const { deployments } = await listDeployments({ organizationId: orgId, limit: 100 });
    const environments = await listEnvironments(orgId);

    const correlations = findings.map(f =>
      correlateFindingToRuntime({ finding: f, deployments, environments })
    );

    const sourceOnly = correlations.filter(c => c.matchingDeployments.length === 0).length;
    const deployed = correlations.filter(c => c.matchingDeployments.length > 0).length;
    const prodDeployed = correlations.filter(c => c.isProductionAssociated).length;

    if (options.json) {
      console.log(JSON.stringify({
        correlations,
        metrics: { totalFindings: findings.length, sourceOnly, deployed, prodDeployed }
      }, null, 2));
      return 0;
    }

    if (options.quiet) return 0;

    console.log('\n  SecretShield  v2.0  Runtime & Deployment Exposure Correlation');
    console.log('  ─────────────────────────────────────────────────────────────────────────────\n');
    console.log(`  Total Evaluated:        ${findings.length}`);
    console.log(`  Source Exposure Only:   ${sourceOnly}`);
    console.log(`  Deployed Findings:      ${deployed}`);
    console.log(`  Production Deployed:    ${prodDeployed}\n`);

    if (correlations.length > 0) {
      console.log('  FINDING ID       FILE / CONTEXT                  DEPLOYED?   PRODUCTION?');
      console.log('  ─────────────────────────────────────────────────────────────────────────────');
      for (const item of correlations.slice(0, 20)) {
        const id = String(item.findingId || '').slice(0, 15).padEnd(16, ' ');
        const file = String(item.fileContext?.type || 'Source').slice(0, 30).padEnd(31, ' ');
        const isDep = item.matchingDeployments.length > 0 ? 'YES' : 'NO';
        const isDepPadded = isDep.padEnd(11, ' ');
        const isProd = item.isProductionAssociated ? 'YES' : 'NO';
        console.log(`  ${id} ${file} ${isDepPadded} ${isProd}`);
      }
      console.log('');
    }
    return 0;
  }

  // 3. DEFAULT RUNTIME SUMMARY
  const [assetsData, depsData, envs] = await Promise.all([
    listRuntimeAssets({ organizationId: orgId, limit: 10 }),
    listDeployments({ organizationId: orgId, limit: 10 }),
    listEnvironments(orgId),
  ]);

  if (options.json) {
    console.log(JSON.stringify({
      assetsCount: assetsData.total,
      deploymentsCount: depsData.total,
      environmentsCount: envs.length,
      environments: envs.map(e => e.name),
    }, null, 2));
    return 0;
  }

  if (options.quiet) return 0;

  console.log('\n  SecretShield  v2.0  Runtime Security Posture');
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');
  console.log(`  Registered Assets:      ${assetsData.total}`);
  console.log(`  Deployments Tracked:    ${depsData.total}`);
  console.log(`  Environments:           ${envs.length > 0 ? envs.map(e => e.name).join(', ') : 'Default'}\n`);
  console.log('  Run "secretshield runtime deployments" to view deployment log.');
  console.log('  Run "secretshield runtime exposure" to view environment correlation.\n');
  return 0;
}
