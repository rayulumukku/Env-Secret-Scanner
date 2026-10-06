/**
 * app-src/lib/runtime/__tests__/runtime.test.js
 *
 * Comprehensive Test Suite for Runtime Asset Model, Environments, Correlation & Deployment Gates.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createRuntimeAsset,
  createDeployment,
  validateAndSanitizeMetadata,
  ASSET_TYPES,
  ENVIRONMENT_TYPES,
  DEPLOYMENT_STATUS,
} from '../model.js';
import {
  normalizeEnvironment,
  createEnvironmentAssociation,
} from '../environments.js';
import {
  classifyExposure,
  verifySecretRemoval,
  EXPOSURE_STATES,
  REMOVAL_VERIFICATION_STATES,
} from '../classification.js';
import {
  analyzeFileContext,
  correlateFindingToRuntime,
  trackHistoricalDeploymentExposure,
  FILE_CONTEXT_TYPE,
} from '../correlation.js';
import {
  evaluateDeploymentGate,
  GATE_DECISIONS,
} from '../gates.js';
import {
  listRuntimeAssets,
  upsertRuntimeAsset,
  listDeployments,
  recordDeployment,
  listEnvironments,
  upsertEnvironment,
  recordDeploymentGateDecision,
} from '../../db/runtime.js';
import { memoryDb } from '../../db/client.js';

describe('Runtime Asset Model & Security Invariants', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('should successfully create a normalized runtime asset with clean metadata', () => {
    const asset = createRuntimeAsset({
      organizationId: 'org-test-1',
      assetType: ASSET_TYPES.SERVICE,
      name: 'Auth Service',
      identifier: 'arn:aws:ecs:us-east-1:123456789012:service/auth-prod',
      environment: ENVIRONMENT_TYPES.PRODUCTION,
      metadata: { cluster: 'prod-cluster', desiredCount: 4 },
    });

    assert.equal(asset.name, 'Auth Service');
    assert.equal(asset.assetType, ASSET_TYPES.SERVICE);
    assert.equal(asset.environment, ENVIRONMENT_TYPES.PRODUCTION);
    assert.equal(asset.metadata.desiredCount, 4);
    assert.ok(asset.id.startsWith('asset_'));
  });

  it('should REJECT any attempt to store raw credentials in asset metadata', () => {
    assert.throws(() => {
      validateAndSanitizeMetadata({
        apiKey: 'secret_key_123456789',
        region: 'us-east-1',
      });
    }, /SECURITY VIOLATION: Forbidden credential property 'apiKey'/);

    assert.throws(() => {
      validateAndSanitizeMetadata({
        password: 'super_secret_password',
      });
    }, /SECURITY VIOLATION: Forbidden credential property 'password'/);

    assert.throws(() => {
      validateAndSanitizeMetadata({
        config: {
          session_token: 'raw_jwt_token',
        },
      });
    }, /SECURITY VIOLATION: Forbidden credential property 'session_token'/);
  });

  it('should reject private key PEM data in metadata values', () => {
    assert.throws(() => {
      validateAndSanitizeMetadata({
        certificateData: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...',
      });
    }, /SECURITY VIOLATION: Private key PEM detected/);
  });
});

describe('Environment Model & No-Assumptions Production Safety', () => {
  it('should NOT assume an environment is production merely because name contains "prod"', () => {
    const previewEnv = normalizeEnvironment({
      name: 'product-preview',
      organizationId: 'org-1',
    });

    assert.equal(previewEnv.name, 'product-preview');
    assert.equal(previewEnv.isProduction, false, 'Should NOT flag product-preview as production');
    assert.equal(previewEnv.environmentType, ENVIRONMENT_TYPES.CUSTOM);
  });

  it('should accurately categorize explicit production environment', () => {
    const prodEnv = normalizeEnvironment({
      name: 'production',
      organizationId: 'org-1',
    });

    assert.equal(prodEnv.isProduction, true);
    assert.equal(prodEnv.environmentType, ENVIRONMENT_TYPES.PRODUCTION);
  });

  it('should build verifiable association chain: Repo -> Project -> Env -> Deployment', () => {
    const chain = createEnvironmentAssociation({
      repository: { id: 'repo-webapp', name: 'web-app' },
      project: { id: 'proj-core', name: 'Core Platform' },
      environment: { name: 'staging', type: ENVIRONMENT_TYPES.STAGING, isProduction: false },
      deployment: { id: 'dep-101', commitSha: '9f31a23e', status: 'SUCCESS' },
    });

    assert.equal(chain.repository.id, 'repo-webapp');
    assert.equal(chain.environment.name, 'staging');
    assert.equal(chain.deployment.commitSha, '9f31a23e');
    assert.equal(chain.provenance.source, 'ORGANIZATION_REGISTRY_MAPPING');
  });
});

describe('File Context & Environment Differentiation', () => {
  it('should categorize .env.example as documentation template (never production)', () => {
    const ctx = analyzeFileContext('.env.example');
    assert.equal(ctx.type, FILE_CONTEXT_TYPE.EXAMPLE_TEMPLATE);
    assert.equal(ctx.isExampleOrTemplate, true);
  });

  it('should categorize test fixtures as test context', () => {
    const ctx = analyzeFileContext('tests/fixtures/synthetic-aws-key.js');
    assert.equal(ctx.type, FILE_CONTEXT_TYPE.TEST_FIXTURE);
    assert.equal(ctx.environmentCandidate, ENVIRONMENT_TYPES.TEST);
  });

  it('should categorize deployment manifests', () => {
    const ctx = analyzeFileContext('k8s/deploy/production.yaml');
    assert.equal(ctx.type, FILE_CONTEXT_TYPE.DEPLOYMENT_MANIFEST);
    assert.equal(ctx.isExampleOrTemplate, false);
  });
});

describe('Exposure Classification & Removal Verification', () => {
  it('should classify finding across source and deployment states', () => {
    const finding = { id: 'f-1', fingerprint: 'fp-123', file: 'server.js', line: 12 };
    const classification = classifyExposure({
      finding,
      isInCurrentSource: true,
      isInGitHistory: true,
      deployments: [{ id: 'dep-1', environment: 'staging' }],
      authoritativeActiveProof: false,
    });

    assert.ok(classification.states.includes(EXPOSURE_STATES.SOURCE_EXPOSURE));
    assert.ok(classification.states.includes(EXPOSURE_STATES.HISTORICAL_EXPOSURE));
    assert.ok(classification.states.includes(EXPOSURE_STATES.DEPLOYMENT_ASSOCIATION));
    assert.equal(classification.activeStatus, EXPOSURE_STATES.ACTIVE_STATUS_UNKNOWN);
    assert.equal(classification.isConfirmedActive, false);
  });

  it('should verify secret removal and flag historical/deployment persistence', () => {
    const finding = { id: 'f-2', fingerprint: 'fp-456' };

    // Developer removed secret from source, but Git history and old deployment still have it
    const result = verifySecretRemoval({
      finding,
      isCleanInCurrentSource: true,
      isCleanInGitHistory: false,
      activeDeployments: [{ id: 'dep-prod-1', environment: 'production' }],
    });

    assert.equal(result.isFullyRemediated, false);
    assert.ok(result.statuses.includes(REMOVAL_VERIFICATION_STATES.SOURCE_CLEAN));
    assert.ok(result.statuses.includes(REMOVAL_VERIFICATION_STATES.HISTORY_STILL_EXPOSED));
    assert.ok(result.statuses.includes(REMOVAL_VERIFICATION_STATES.DEPLOYMENT_STILL_PRESENT));
    assert.ok(result.statuses.includes(REMOVAL_VERIFICATION_STATES.VERIFICATION_PENDING));
  });
});

describe('Deployment Correlation & Historical Tracking', () => {
  it('should correlate finding to deployments and affected environments', () => {
    const finding = {
      id: 'f-1',
      fingerprint: 'fp-1',
      file: 'config/db.js',
      commitHash: 'commit-abc-123',
    };
    const deployments = [
      { id: 'dep-1', commitSha: 'commit-abc-123', environment: 'staging', status: 'SUCCESS' },
      { id: 'dep-2', commitSha: 'commit-xyz-999', environment: 'production', status: 'SUCCESS' },
    ];
    const environments = [
      { name: 'staging', environmentType: 'STAGING', isProduction: false },
      { name: 'production', environmentType: 'PRODUCTION', isProduction: true },
    ];

    const corr = correlateFindingToRuntime({ finding, deployments, environments });

    assert.equal(corr.matchingDeployments.length, 1);
    assert.equal(corr.matchingDeployments[0].id, 'dep-1');
    assert.equal(corr.affectedEnvironments[0].environmentName, 'staging');
    assert.equal(corr.isProductionAssociated, false);
    assert.ok(corr.correlationStatement.includes('deployed to non-production'));
  });

  it('should track historical deployment exposure', () => {
    const history = trackHistoricalDeploymentExposure({
      fingerprint: 'fp-abc',
      commitHistory: [{ commitSha: 'sha-1' }, { commitSha: 'sha-2' }],
      allDeployments: [
        { id: 'dep-10', commitSha: 'sha-1', environment: 'staging', createdAt: '2026-01-01' },
        { id: 'dep-20', commitSha: 'sha-2', environment: 'production', createdAt: '2026-02-01' },
        { id: 'dep-30', commitSha: 'sha-clean', environment: 'production', createdAt: '2026-03-01' },
      ],
    });

    assert.equal(history.hasHistoricalDeploymentExposure, true);
    assert.equal(history.historicalDeploymentsCount, 2);
    assert.equal(history.firstKnownDeployment.id, 'dep-10');
    assert.equal(history.lastKnownDeployment.id, 'dep-20');
  });
});

describe('Deployment Gates & Pre-Deployment Decisions', () => {
  it('should ALLOW deployment when no blocking findings exist', () => {
    const result = evaluateDeploymentGate({
      commitSha: 'commit-clean-123',
      environment: 'staging',
      isProduction: false,
      findings: [],
    });

    assert.equal(result.decision, GATE_DECISIONS.ALLOW);
    assert.equal(result.findingsCount, 0);
  });

  it('should BLOCK deployment when critical secrets target production', () => {
    const result = evaluateDeploymentGate({
      commitSha: 'commit-vulnerable-456',
      environment: 'production',
      isProduction: true,
      findings: [
        { id: 'f-1', severity: 'CRITICAL', maskedValue: 'AKIA••••••••' },
      ],
    });

    assert.equal(result.decision, GATE_DECISIONS.BLOCK);
    assert.ok(result.violations.length > 0);
    assert.ok(result.violations[0].reason.includes('CRITICAL secret(s)'));
  });

  it('should return ERROR on malformed inputs', () => {
    const result = evaluateDeploymentGate({
      commitSha: null,
      environment: 'production',
    });

    assert.equal(result.decision, GATE_DECISIONS.ERROR);
  });
});

describe('Database Persistence Layer & Tenant Isolation', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('should strictly isolate runtime assets between organizations', async () => {
    await upsertRuntimeAsset({
      organizationId: 'org-tenant-a',
      assetType: ASSET_TYPES.APPLICATION,
      name: 'Tenant A App',
      identifier: 'app-a',
    });

    await upsertRuntimeAsset({
      organizationId: 'org-tenant-b',
      assetType: ASSET_TYPES.APPLICATION,
      name: 'Tenant B App',
      identifier: 'app-b',
    });

    const tenantAAssets = await listRuntimeAssets({ organizationId: 'org-tenant-a' });
    const tenantBAssets = await listRuntimeAssets({ organizationId: 'org-tenant-b' });

    assert.equal(tenantAAssets.total, 1);
    assert.equal(tenantAAssets.assets[0].name, 'Tenant A App');
    assert.equal(tenantBAssets.total, 1);
    assert.equal(tenantBAssets.assets[0].name, 'Tenant B App');
  });

  it('should record deployments and gate decisions with audit tracking', async () => {
    const dep = await recordDeployment({
      organizationId: 'org-test',
      repositoryId: 'repo-test',
      environment: 'production',
      commitSha: 'abc12345678',
    });

    assert.equal(dep.environment, 'production');
    assert.equal(dep.commitSha, 'abc12345678');

    const gate = await recordDeploymentGateDecision({
      organizationId: 'org-test',
      deploymentId: dep.id,
      commitSha: 'abc12345678',
      environment: 'production',
      decision: GATE_DECISIONS.ALLOW,
      reason: 'Passed policy check',
    });

    assert.equal(gate.decision, GATE_DECISIONS.ALLOW);
    assert.equal(memoryDb.auditLogs.length, 2);
  });
});
