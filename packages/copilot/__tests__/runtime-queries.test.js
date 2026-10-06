/**
 * packages/copilot/__tests__/runtime-queries.test.js
 *
 * Test Suite for Copilot Runtime and Cloud Exposure Intelligence Safe Questions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { queryCopilot } from '../index.js';

describe('Copilot Runtime & Cloud Safe Questions (Local Deterministic Mode)', () => {
  it('should answer "Was this finding deployed?" factually with evidence', async () => {
    const res = await queryCopilot({
      query: 'Was this finding deployed?',
      context: {
        deployments: [
          { id: '101', environment: 'staging', commitSha: '9f31a23e' },
        ],
      },
    });

    assert.equal(res.intent, 'FINDING_DEPLOYMENT_QUERY');
    assert.equal(res.isDeployed, true);
    assert.ok(res.answer.includes('present in 1 deployment(s) affecting: staging'));
    assert.ok(res.evidence.length > 0);
  });

  it('should answer "Was this finding deployed?" when not deployed', async () => {
    const res = await queryCopilot({
      query: 'Was this finding deployed?',
      context: { deployments: [] },
    });

    assert.equal(res.isDeployed, false);
    assert.ok(res.answer.includes('Source exposure only'));
  });

  it('should answer "Which environments contained this commit?"', async () => {
    const res = await queryCopilot({
      query: 'Which environments contained this commit?',
      context: {
        affectedEnvironments: [
          { environmentName: 'staging' },
          { environmentName: 'production' },
        ],
      },
    });

    assert.equal(res.intent, 'ENVIRONMENTS_FOR_COMMIT_QUERY');
    assert.equal(res.environmentsCount, 2);
    assert.ok(res.answer.includes('staging, production'));
  });

  it('should answer "Which production deployments contain unresolved findings?"', async () => {
    const res = await queryCopilot({
      query: 'Which production deployments contain unresolved findings?',
      context: {
        deployments: [
          { id: 'dep-101', environment: 'staging', isProduction: false, unresolvedFindingsCount: 2 },
          { id: 'dep-202', environment: 'production', isProduction: true, unresolvedFindingsCount: 1, commitSha: 'prod-abc' },
        ],
      },
    });

    assert.equal(res.intent, 'PRODUCTION_UNRESOLVED_FINDINGS_QUERY');
    assert.equal(res.productionDeploymentsCount, 1);
    assert.ok(res.answer.includes('1 production deployment(s)'));
    assert.ok(res.answer.includes('#dep-202'));
  });

  it('should answer "Which cloud resources are associated with this application?"', async () => {
    const res = await queryCopilot({
      query: 'Which cloud resources are associated with this application?',
      context: {
        cloudResources: [
          { resourceType: 's3_bucket', resourceId: 'user-uploads' },
          { resourceType: 'ecs_service', resourceId: 'web-frontend' },
        ],
      },
    });

    assert.equal(res.intent, 'APPLICATION_CLOUD_RESOURCES_QUERY');
    assert.equal(res.resourcesCount, 2);
    assert.ok(res.answer.includes('s3_bucket:user-uploads'));
  });

  it('should answer "Why is this resource considered exposed?"', async () => {
    const res = await queryCopilot({
      query: 'Why is this resource considered exposed?',
      context: {
        postureFindings: [
          { title: 'Publicly Accessible Storage Bucket: my-bucket' },
        ],
      },
    });

    assert.equal(res.intent, 'RESOURCE_EXPOSURE_REASON_QUERY');
    assert.equal(res.isExposed, true);
    assert.ok(res.answer.includes('Publicly Accessible Storage Bucket'));
  });

  it('should NEVER send cloud credentials or secrets in Copilot queries', async () => {
    const res = await queryCopilot({
      query: 'Was this finding deployed?',
      context: {
        secretKey: 'raw_super_secret_token_123456789',
        deployments: [{ id: '1', environment: 'dev' }],
      },
    });

    const serialized = JSON.stringify(res);
    assert.ok(!serialized.includes('raw_super_secret_token_123456789'));
  });
});
