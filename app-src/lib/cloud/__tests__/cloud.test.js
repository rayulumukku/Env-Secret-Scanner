/**
 * app-src/lib/cloud/__tests__/cloud.test.js
 *
 * Comprehensive Test Suite for Cloud Provider Abstraction, SSRF Guards, Posture Rules & Sync Jobs.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { validateCloudEndpoint } from '../ssrf.js';
import { AwsCloudProvider } from '../aws.js';
import { GcpCloudProvider } from '../gcp.js';
import { AzureCloudProvider } from '../azure.js';
import { GenericCloudProvider, createCloudProvider } from '../generic.js';
import { evaluateCloudPostureRules } from '../posture.js';
import {
  createCloudPostureFinding,
  createCloudResource,
  POSTURE_SEVERITY,
} from '../model.js';
import {
  listCloudAccounts,
  getCloudAccount,
  connectCloudAccount,
  disconnectCloudAccount,
  listCloudResources,
  upsertCloudResources,
  listCloudPostureFindings,
} from '../../db/cloud.js';
import { executeCloudSyncJob } from '../../jobs/cloud-sync-job.js';
import { memoryDb } from '../../db/client.js';

describe('SSRF Protection Guard & Approved Provider Endpoints', () => {
  it('should accept valid HTTPS endpoints for approved cloud providers', () => {
    const aws = validateCloudEndpoint('https://sts.us-east-1.amazonaws.com');
    assert.ok(aws.includes('amazonaws.com'));

    const gcp = validateCloudEndpoint('https://cloudresourcemanager.googleapis.com');
    assert.ok(gcp.includes('googleapis.com'));

    const azure = validateCloudEndpoint('https://management.azure.com');
    assert.ok(azure.includes('azure.com'));
  });

  it('should REJECT loopback, localhost, and IPv6 addresses', () => {
    assert.throws(() => {
      validateCloudEndpoint('http://localhost:8080/secrets');
    }, /SSRF Guard/);

    assert.throws(() => {
      validateCloudEndpoint('https://127.0.0.1:443');
    }, /SSRF Guard/);

    assert.throws(() => {
      validateCloudEndpoint('https://[::1]:443');
    }, /SSRF Guard/);
  });

  it('should REJECT link-local cloud metadata endpoints (169.254.169.254)', () => {
    assert.throws(() => {
      validateCloudEndpoint('http://169.254.169.254/latest/meta-data/');
    }, /SSRF Guard/);

    assert.throws(() => {
      validateCloudEndpoint('https://metadata.google.internal/computeMetadata/v1/');
    }, /SSRF Guard/);
  });

  it('should REJECT internal private RFC-1918 subnets', () => {
    assert.throws(() => {
      validateCloudEndpoint('https://10.0.1.50/admin');
    }, /SSRF Guard/);

    assert.throws(() => {
      validateCloudEndpoint('https://192.168.1.1/router');
    }, /SSRF Guard/);

    assert.throws(() => {
      validateCloudEndpoint('https://172.20.0.5/api');
    }, /SSRF Guard/);
  });

  it('should REJECT insecure protocols (http, ftp, file)', () => {
    assert.throws(() => {
      validateCloudEndpoint('http://s3.amazonaws.com');
    }, /SSRF Guard: Insecure protocol/);

    assert.throws(() => {
      validateCloudEndpoint('file:///etc/passwd');
    }, /SSRF Guard/);
  });
});

describe('Cloud Provider Abstraction & Least-Privilege Scopes', () => {
  it('should define explicit read-only permissions for AWS provider', () => {
    const aws = new AwsCloudProvider();
    const scopes = aws.getRequiredPermissions();

    assert.ok(scopes.length >= 6);
    assert.ok(scopes.some(s => s.scope === 'sts:GetCallerIdentity'));
    assert.ok(scopes.some(s => s.scope === 's3:GetBucketPublicAccessBlock'));
    // Ensure all scopes are read-only
    for (const s of scopes) {
      assert.ok(!s.scope.includes('Put'), 'No write/put scopes permitted');
      assert.ok(!s.scope.includes('Delete'), 'No delete scopes permitted');
      assert.ok(!s.scope.includes('Create'), 'No create scopes permitted');
    }
  });

  it('should define explicit read-only permissions for GCP provider', () => {
    const gcp = new GcpCloudProvider();
    const scopes = gcp.getRequiredPermissions();

    assert.ok(scopes.some(s => s.scope === 'storage.buckets.get'));
    assert.ok(scopes.some(s => s.scope === 'compute.firewalls.list'));
  });

  it('should define explicit read-only permissions for Azure provider', () => {
    const azure = new AzureCloudProvider();
    const scopes = azure.getRequiredPermissions();

    assert.ok(scopes.some(s => s.scope === 'Microsoft.Storage/storageAccounts/read'));
    assert.ok(scopes.some(s => s.scope === 'Microsoft.Network/networkSecurityGroups/read'));
  });

  it('should instantiate appropriate provider via factory', () => {
    const pAws = createCloudProvider('aws');
    assert.equal(pAws.providerName, 'aws');

    const pGeneric = createCloudProvider('unknown');
    assert.equal(pGeneric.providerName, 'generic');
  });
});

describe('Read-Only Cloud Posture Evaluation Rules', () => {
  it('should detect publicly accessible storage buckets', () => {
    const resources = [
      {
        resourceId: 'company-backup-bucket',
        resourceType: 's3_bucket',
        metadata: {
          publicAccessBlock: false,
          acl: 'public-read',
        },
      },
      {
        resourceId: 'secure-vault-bucket',
        resourceType: 's3_bucket',
        metadata: {
          publicAccessBlock: true,
          acl: 'private',
          tags: { environment: 'production' },
        },
      },
    ];

    const findings = evaluateCloudPostureRules({
      organizationId: 'org-test',
      cloudAccountId: 'aws-acc-1',
      provider: 'aws',
      resources,
    });

    const publicBucketFinding = findings.find(f => f.resourceId === 'company-backup-bucket');
    assert.ok(publicBucketFinding);
    assert.equal(publicBucketFinding.category, 'CLOUD_POSTURE');
    assert.equal(publicBucketFinding.severity, POSTURE_SEVERITY.CRITICAL);
    assert.ok(publicBucketFinding.remediation.recommendedChange.includes('Public Access Block'));
    assert.equal(publicBucketFinding.remediation.automatedModificationAttempted, false);
  });

  it('should detect overly broad IAM wildcard policies', () => {
    const resources = [
      {
        resourceId: 'AppExecutionRole',
        resourceType: 'iam_role',
        metadata: {
          statements: [
            { Effect: 'Allow', Action: '*', Resource: '*' },
          ],
          tags: { environment: 'staging' },
        },
      },
    ];

    const findings = evaluateCloudPostureRules({
      organizationId: 'org-test',
      cloudAccountId: 'aws-acc-1',
      provider: 'aws',
      resources,
    });

    const iamFinding = findings.find(f => f.resourceId === 'AppExecutionRole');
    assert.ok(iamFinding);
    assert.equal(iamFinding.severity, POSTURE_SEVERITY.HIGH);
    assert.ok(iamFinding.title.includes('Overly Broad IAM'));
  });

  it('should detect exposed service ports (e.g. 0.0.0.0/0 on port 22 or 5432)', () => {
    const resources = [
      {
        resourceId: 'sg-public-db',
        resourceType: 'security_group',
        metadata: {
          ingressRules: [
            { cidr: '0.0.0.0/0', port: 5432, protocol: 'TCP' },
          ],
          tags: { environment: 'production' },
        },
      },
    ];

    const findings = evaluateCloudPostureRules({
      organizationId: 'org-test',
      cloudAccountId: 'aws-acc-1',
      provider: 'aws',
      resources,
    });

    const portFinding = findings.find(f => f.resourceId === 'sg-public-db');
    assert.ok(portFinding);
    assert.equal(portFinding.severity, POSTURE_SEVERITY.CRITICAL);
    assert.ok(portFinding.title.includes('Exposed Sensitive Network Port 5432'));
  });

  it('should flag missing environment tags', () => {
    const resources = [
      {
        resourceId: 'unlabeled-instance',
        resourceType: 'vm_instance',
        metadata: { tags: { project: 'secretshield' } }, // Missing environment tag
      },
    ];

    const findings = evaluateCloudPostureRules({
      organizationId: 'org-test',
      cloudAccountId: 'gcp-acc-1',
      provider: 'gcp',
      resources,
    });

    const tagFinding = findings.find(f => f.resourceId === 'unlabeled-instance');
    assert.ok(tagFinding);
    assert.equal(tagFinding.severity, POSTURE_SEVERITY.LOW);
    assert.ok(tagFinding.title.includes('Missing Environment Tagging'));
  });
});

describe('Cloud Database Persistence & Zero Credential Leaks', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('should securely connect cloud account and encrypt credentials at rest', async () => {
    const connected = await connectCloudAccount({
      organizationId: 'org-tenant-1',
      provider: 'aws',
      accountId: '987654321098',
      name: 'Primary AWS Account',
      credentials: 'mock_iam_session_secret_token_123',
      permissions: ['sts:GetCallerIdentity'],
    });

    assert.equal(connected.provider, 'aws');
    assert.equal(connected.accountId, '987654321098');
    assert.equal(connected.status, 'CONNECTED');
    // Ensure plaintext credential token is NOT returned
    assert.equal(connected.credentials, undefined);
    assert.equal(connected.encryptedCredentials, undefined);

    // Verify stored account does NOT leak credentials in listing
    const accounts = await listCloudAccounts('org-tenant-1');
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0].encryptedCredentials, undefined);
    assert.equal(accounts[0].credentials, undefined);

    // Verify tenant isolation
    const tenant2Accounts = await listCloudAccounts('org-tenant-2');
    assert.equal(tenant2Accounts.length, 0);
  });

  it('should disconnect cloud account and cascade associated resources', async () => {
    const acc = await connectCloudAccount({
      organizationId: 'org-tenant-1',
      provider: 'gcp',
      accountId: 'gcp-proj-1',
    });

    await upsertCloudResources([
      {
        organizationId: 'org-tenant-1',
        cloudAccountId: acc.id,
        provider: 'gcp',
        resourceType: 'storage_bucket',
        resourceId: 'bkt-1',
      },
    ]);

    const resBefore = await listCloudResources({ organizationId: 'org-tenant-1' });
    assert.equal(resBefore.total, 1);

    const disconnected = await disconnectCloudAccount('org-tenant-1', acc.id);
    assert.equal(disconnected, true);

    const resAfter = await listCloudResources({ organizationId: 'org-tenant-1' });
    assert.equal(resAfter.total, 0);
  });
});

describe('Cloud Synchronization Job Engine', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('should execute cloud synchronization job and log audit events', async () => {
    const acc = await connectCloudAccount({
      organizationId: 'org-job-test',
      provider: 'generic',
      accountId: 'custom-cluster-1',
    });

    const result = await executeCloudSyncJob({
      organizationId: 'org-job-test',
      cloudAccountId: acc.id,
      options: { allowCustomLocalMock: true },
    });

    assert.equal(result.success, true);
    assert.equal(result.provider, 'generic');
    assert.ok(result.durationMs >= 0);

    // Verify audit logs were written
    const syncLogs = memoryDb.auditLogs.filter(l => l.organizationId === 'org-job-test' && l.action.startsWith('CLOUD_SYNC'));
    assert.ok(syncLogs.length >= 2, 'Should log started and completed events');
  });
});
