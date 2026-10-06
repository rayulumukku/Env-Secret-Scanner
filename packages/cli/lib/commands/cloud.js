/**
 * packages/cli/lib/commands/cloud.js
 *
 * SecretShield CLI Cloud Security Posture & Inventory Commands.
 *
 * Commands:
 *   secretshield cloud
 *   secretshield cloud resources
 *   secretshield cloud sync
 *
 * Flags supported: --json, --quiet, --no-color
 *
 * INVARIANT: Never outputs raw credentials or connection secrets.
 */

import { listCloudAccounts, listCloudResources } from '../../../../app-src/lib/db/cloud.js';
import { executeCloudSyncJob } from '../../../../app-src/lib/jobs/cloud-sync-job.js';

export async function cloudCommand(subcommand = '', options = {}) {
  const orgId = options.organization || 'default-org';

  // 1. CLOUD RESOURCES
  if (subcommand === 'resources') {
    const { resources, total } = await listCloudResources({
      organizationId: orgId,
      provider: options.provider || null,
      resourceType: options.type || null,
      limit: 100,
    });

    if (options.json) {
      console.log(JSON.stringify({ resources, total }, null, 2));
      return 0;
    }

    if (options.quiet) return 0;

    console.log('\n  SecretShield  v2.0  Cloud Resource Inventory');
    console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

    if (resources.length === 0) {
      console.log('  No cloud resources synchronized for this organization.\n');
      return 0;
    }

    console.log('  PROVIDER   TYPE               RESOURCE ID                   POSTURE STATUS');
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    for (const res of resources) {
      const prov = String(res.provider || 'cloud').slice(0, 9).padEnd(10, ' ');
      const type = String(res.resourceType || 'generic').slice(0, 17).padEnd(18, ' ');
      const id = String(res.resourceId || '').slice(0, 28).padEnd(29, ' ');
      const status = String(res.postureStatus || 'SECURE');
      console.log(`  ${prov} ${type} ${id} ${status}`);
    }
    console.log(`\n  Total resources: ${total}\n`);
    return 0;
  }

  // 2. CLOUD SYNC
  if (subcommand === 'sync') {
    const accounts = await listCloudAccounts(orgId);
    if (accounts.length === 0) {
      if (!options.quiet) {
        console.log('\n  No connected cloud accounts to synchronize. Connect accounts in web dashboard.\n');
      }
      return 0;
    }

    let synced = 0;
    for (const acc of accounts) {
      try {
        await executeCloudSyncJob({
          organizationId: orgId,
          cloudAccountId: acc.id,
          options: { allowCustomLocalMock: true },
        });
        synced++;
      } catch (err) {
        if (!options.quiet) {
          console.error(`  Warning: Failed to sync ${acc.provider}:${acc.accountId}: ${err.message}`);
        }
      }
    }

    if (options.json) {
      console.log(JSON.stringify({ success: true, accountsSynced: synced }, null, 2));
      return 0;
    }

    if (!options.quiet) {
      console.log(`\n  ✔ Successfully synchronized ${synced} cloud account(s).\n`);
    }
    return 0;
  }

  // 3. DEFAULT CLOUD ACCOUNTS LIST
  const accounts = await listCloudAccounts(orgId);

  if (options.json) {
    console.log(JSON.stringify({ accounts, total: accounts.length }, null, 2));
    return 0;
  }

  if (options.quiet) return 0;

  console.log('\n  SecretShield  v2.0  Connected Cloud Accounts');
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

  if (accounts.length === 0) {
    console.log('  No cloud accounts connected. Use "secretshield cloud resources" or web console.\n');
    return 0;
  }

  console.log('  PROVIDER   ACCOUNT ID                NAME                     STATUS');
  console.log('  ─────────────────────────────────────────────────────────────────────────────');
  for (const acc of accounts) {
    const prov = String(acc.provider || 'cloud').slice(0, 9).padEnd(10, ' ');
    const id = String(acc.accountId || '').slice(0, 24).padEnd(25, ' ');
    const name = String(acc.name || '').slice(0, 23).padEnd(24, ' ');
    const status = String(acc.status || 'CONNECTED');
    console.log(`  ${prov} ${id} ${name} ${status}`);
  }
  console.log(`\n  Total accounts: ${accounts.length}\n`);
  return 0;
}
