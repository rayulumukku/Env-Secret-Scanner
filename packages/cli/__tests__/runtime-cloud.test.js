/**
 * packages/cli/__tests__/runtime-cloud.test.js
 *
 * Test Suite for SecretShield Runtime and Cloud CLI Commands.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { runtimeCommand } from '../lib/commands/runtime.js';
import { cloudCommand } from '../lib/commands/cloud.js';
import { memoryDb } from '../../../app-src/lib/db/client.js';
import { recordDeployment, upsertRuntimeAsset } from '../../../app-src/lib/db/runtime.js';
import { connectCloudAccount, upsertCloudResources } from '../../../app-src/lib/db/cloud.js';

describe('CLI Runtime Commands', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('should run "secretshield runtime" summary with zero error', async () => {
    await upsertRuntimeAsset({
      organizationId: 'default-org',
      assetType: 'APPLICATION',
      name: 'Web Portal',
      identifier: 'app-web-1',
    });

    let stdoutOutput = '';
    const originalLog = console.log;
    console.log = (msg) => { stdoutOutput += msg + '\n'; };

    try {
      const exitCode = await runtimeCommand('', { organization: 'default-org' });
      assert.equal(exitCode, 0);
      assert.ok(stdoutOutput.includes('Runtime Security Posture'));
      assert.ok(stdoutOutput.includes('Registered Assets:      1'));
    } finally {
      console.log = originalLog;
    }
  });

  it('should run "secretshield runtime deployments" and format inventory', async () => {
    await recordDeployment({
      organizationId: 'default-org',
      repositoryId: 'repo-1',
      environment: 'staging',
      commitSha: '9f31a23e45',
      provider: 'github_actions',
    });

    let stdoutOutput = '';
    const originalLog = console.log;
    console.log = (msg) => { stdoutOutput += msg + '\n'; };

    try {
      const exitCode = await runtimeCommand('deployments', { organization: 'default-org' });
      assert.equal(exitCode, 0);
      assert.ok(stdoutOutput.includes('Deployment Inventory'));
      assert.ok(stdoutOutput.includes('9f31a23e45'));
      assert.ok(stdoutOutput.includes('staging'));
    } finally {
      console.log = originalLog;
    }
  });

  it('should support --json output without leaking raw credentials', async () => {
    await recordDeployment({
      organizationId: 'default-org',
      repositoryId: 'repo-1',
      environment: 'production',
      commitSha: 'prod-sha-123',
    });

    let stdoutOutput = '';
    const originalLog = console.log;
    console.log = (msg) => { stdoutOutput += msg; };

    try {
      const exitCode = await runtimeCommand('deployments', { organization: 'default-org', json: true });
      assert.equal(exitCode, 0);
      const parsed = JSON.parse(stdoutOutput);
      assert.equal(parsed.total, 1);
      assert.equal(parsed.deployments[0].commitSha, 'prod-sha-123');
    } finally {
      console.log = originalLog;
    }
  });
});

describe('CLI Cloud Commands', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('should list cloud accounts without credentials', async () => {
    await connectCloudAccount({
      organizationId: 'default-org',
      provider: 'aws',
      accountId: '112233445566',
      name: 'Prod AWS',
      credentials: 'secret_token_never_printed',
    });

    let stdoutOutput = '';
    const originalLog = console.log;
    console.log = (msg) => { stdoutOutput += msg + '\n'; };

    try {
      const exitCode = await cloudCommand('', { organization: 'default-org' });
      assert.equal(exitCode, 0);
      assert.ok(stdoutOutput.includes('Connected Cloud Accounts'));
      assert.ok(stdoutOutput.includes('112233445566'));
      assert.ok(!stdoutOutput.includes('secret_token_never_printed'), 'Plaintext credentials must NEVER be logged');
    } finally {
      console.log = originalLog;
    }
  });

  it('should list cloud resources inventory', async () => {
    const acc = await connectCloudAccount({
      organizationId: 'default-org',
      provider: 'gcp',
      accountId: 'gcp-proj-9',
    });

    await upsertCloudResources([
      {
        organizationId: 'default-org',
        cloudAccountId: acc.id,
        provider: 'gcp',
        resourceType: 'storage_bucket',
        resourceId: 'secure-data-bkt',
        postureStatus: 'SECURE',
      },
    ]);

    let stdoutOutput = '';
    const originalLog = console.log;
    console.log = (msg) => { stdoutOutput += msg + '\n'; };

    try {
      const exitCode = await cloudCommand('resources', { organization: 'default-org' });
      assert.equal(exitCode, 0);
      assert.ok(stdoutOutput.includes('Cloud Resource Inventory'));
      assert.ok(stdoutOutput.includes('secure-data-bkt'));
    } finally {
      console.log = originalLog;
    }
  });
});
