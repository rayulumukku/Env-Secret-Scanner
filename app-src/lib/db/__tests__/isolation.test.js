/**
 * lib/db/__tests__/isolation.test.js
 *
 * Strict Multi-Tenant Organization Isolation Tests.
 *
 * INVARIANT UNDER TEST:
 *   User A belonging to Organization A must NEVER be able to query, access,
 *   or mutate any projects, repositories, scans, or findings belonging to Organization B.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb } from '../client.js';
import { createUser } from '../users.js';
import { createOrganization, findOrganizationById } from '../organizations.js';
import { createProject, findProjectById, listProjects } from '../projects.js';
import { createRepository } from '../repositories.js';
import { createScanRecord } from '../scans.js';
import { saveScanFindings, queryFindings } from '../findings.js';
import { getAuthContext } from '../../auth/context.js';
import { createSession } from '../../auth/session.js';

describe('Multi-Tenant Organization & Project Isolation', () => {
  let userA, userB;
  let orgA, orgB;
  let projA, projB;
  let tokenA, tokenB;

  beforeEach(async () => {
    memoryDb.reset();

    // 1. Create User A and Org A
    userA = await createUser({
      email: 'alice@company-a.com',
      passwordHash: 'hashA',
      name: 'Alice Corp A',
    });
    orgA = await createOrganization({
      name: 'Company A Workspace',
      userId: userA.id,
    });
    projA = await createProject({
      organizationId: orgA.id,
      name: 'Secret Project A',
    });

    const sessA = await createSession(userA.id);
    tokenA = sessA.token;

    // 2. Create User B and Org B
    userB = await createUser({
      email: 'bob@company-b.com',
      passwordHash: 'hashB',
      name: 'Bob Corp B',
    });
    orgB = await createOrganization({
      name: 'Company B Workspace',
      userId: userB.id,
    });
    projB = await createProject({
      organizationId: orgB.id,
      name: 'Secret Project B',
    });

    const sessB = await createSession(userB.id);
    tokenB = sessB.token;

    // 3. Add findings to both organizations
    const repoA = await createRepository({ projectId: projA.id, name: 'repo-a' });
    const scanA = await createScanRecord({ projectId: projA.id, repositoryId: repoA.id, scanId: 'scan_a1' });
    await saveScanFindings([
      {
        fingerprint: 'fp_org_a_secret_1',
        type: 'AWS_ACCESS_KEY_ID',
        severity: 'CRITICAL',
        file: 'config.js',
        line: 10,
        maskedValue: 'AKIA••••••••AAA1',
      },
    ], { scanId: scanA.scanId, projectId: projA.id, repositoryId: repoA.id });

    const repoB = await createRepository({ projectId: projB.id, name: 'repo-b' });
    const scanB = await createScanRecord({ projectId: projB.id, repositoryId: repoB.id, scanId: 'scan_b1' });
    await saveScanFindings([
      {
        fingerprint: 'fp_org_b_secret_2',
        type: 'STRIPE_SECRET_KEY',
        severity: 'CRITICAL',
        file: 'stripe.js',
        line: 5,
        maskedValue: 'sk_live_••••••••BBB2',
      },
    ], { scanId: scanB.scanId, projectId: projB.id, repositoryId: repoB.id });
  });

  test('User A cannot list projects from Organization B', async () => {
    const orgAProjects = await listProjects(orgA.id);
    assert.strictEqual(orgAProjects.length, 1);
    assert.strictEqual(orgAProjects[0].id, projA.id);
    assert.ok(!orgAProjects.some(p => p.id === projB.id), 'Org A list must not contain Project B');
  });

  test('User A cannot fetch Project B details directly with Org A scope', async () => {
    const project = await findProjectById(projB.id, orgA.id);
    assert.strictEqual(project, null, 'Cross-tenant project lookup must return null');
  });

  test('Findings query for Org A returns ONLY Org A findings and never Org B', async () => {
    const resA = await queryFindings({ organizationId: orgA.id });
    assert.strictEqual(resA.total, 1);
    assert.strictEqual(resA.findings[0].fingerprint, 'fp_org_a_secret_1');

    const resB = await queryFindings({ organizationId: orgB.id });
    assert.strictEqual(resB.total, 1);
    assert.strictEqual(resB.findings[0].fingerprint, 'fp_org_b_secret_2');
  });

  test('User A cannot forge targetOrgId to access Organization B', async () => {
    const reqMock = {
      headers: new Headers({
        authorization: `Bearer ${tokenA}`,
        'x-organization-id': orgB.id,
      }),
    };

    const auth = await getAuthContext(reqMock, { targetOrgId: orgB.id });
    assert.strictEqual(auth.organization, null, 'Must deny access to unauthorized organization');
    assert.ok(auth.error.includes('Access denied'), 'Must produce access denied message');
  });
});
