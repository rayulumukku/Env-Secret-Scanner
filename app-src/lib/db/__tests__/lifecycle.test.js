/**
 * lib/db/__tests__/lifecycle.test.js
 *
 * Finding Lifecycle transitions & Audit Log integrity tests.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { memoryDb } from '../client.js';
import { createUser } from '../users.js';
import { createOrganization } from '../organizations.js';
import { createProject } from '../projects.js';
import { createRepository } from '../repositories.js';
import { createScanRecord } from '../scans.js';
import { saveScanFindings, updateFindingStatus, bulkUpdateFindings } from '../findings.js';
import { logAuditEvent, listAuditLogs } from '../audit.js';

describe('Finding Lifecycle & Audit Trail', () => {
  let user, org, project, repo, scan, finding;

  beforeEach(async () => {
    memoryDb.reset();

    user = await createUser({
      email: 'security@company.com',
      passwordHash: 'dummy',
      name: 'Security Lead',
    });

    org = await createOrganization({
      name: 'Security Org',
      userId: user.id,
    });

    project = await createProject({
      organizationId: org.id,
      name: 'Payment Service',
    });

    repo = await createRepository({
      projectId: project.id,
      name: 'payment-repo',
    });

    scan = await createScanRecord({
      projectId: project.id,
      repositoryId: repo.id,
      scanId: 'scan_lifecycle_1',
    });

    const findings = await saveScanFindings([
      {
        fingerprint: 'fp_test_stripe_live_key',
        type: 'STRIPE_SECRET_KEY',
        severity: 'CRITICAL',
        file: 'services/stripe.js',
        line: 14,
        maskedValue: 'sk_live_••••••••1234',
        confidence: 95,
      },
      {
        fingerprint: 'fp_test_aws_key',
        type: 'AWS_ACCESS_KEY_ID',
        severity: 'CRITICAL',
        file: 'config.js',
        line: 3,
        maskedValue: 'AKIA••••••••ABCD',
        confidence: 98,
      },
    ], { scanId: scan.scanId, projectId: project.id, repositoryId: repo.id });

    finding = findings[0];
  });

  test('initial status is OPEN', () => {
    assert.strictEqual(finding.status, 'OPEN');
    assert.strictEqual(finding.resolvedAt, null);
  });

  test('transitions finding to FALSE_POSITIVE and sets resolvedAt', async () => {
    const updated = await updateFindingStatus(finding.id, {
      status: 'FALSE_POSITIVE',
      note: 'Synthetic fixture in test directory',
      userId: user.id,
    });

    assert.strictEqual(updated.status, 'FALSE_POSITIVE');
    assert.ok(updated.resolvedAt instanceof Date);
    assert.strictEqual(updated.resolvedById, user.id);
  });

  test('transitions finding to REMEDIATED after credential rotation', async () => {
    const updated = await updateFindingStatus(finding.id, {
      status: 'REMEDIATED',
      note: 'Rotated key in Stripe dashboard and verified new credentials',
      userId: user.id,
    });

    assert.strictEqual(updated.status, 'REMEDIATED');
    assert.ok(updated.resolvedAt instanceof Date);
    assert.strictEqual(updated.resolvedById, user.id);
  });

  test('bulk updates multiple findings simultaneously', async () => {
    const allFindings = [...memoryDb.findings.values()];
    const ids = allFindings.map(f => f.id);

    const updated = await bulkUpdateFindings(ids, {
      status: 'CONFIRMED',
      note: 'Triage team confirmed active credentials',
      userId: user.id,
    });

    assert.strictEqual(updated.length, 2);
    for (const f of updated) {
      assert.strictEqual(f.status, 'CONFIRMED');
    }
  });

  test('audit log sanitizes secrets and records security actions', async () => {
    await logAuditEvent({
      organizationId: org.id,
      userId: user.id,
      userEmail: user.email,
      action: 'CREDENTIAL_ROTATED',
      targetType: 'Finding',
      targetId: finding.id,
      metadata: {
        rawSecret: 'sk_live_SHOULD_BE_STRIPPED', // Attempted leak
        note: 'Rotated in console',
      },
    });

    const logs = await listAuditLogs(org.id);
    assert.ok(logs.length > 0);
    const lastLog = logs[0];

    assert.strictEqual(lastLog.action, 'CREDENTIAL_ROTATED');
    assert.ok(!lastLog.metadataJson.includes('sk_live_SHOULD_BE_STRIPPED'), 'Audit log must sanitize raw secrets');
    assert.ok(lastLog.metadataJson.includes('Rotated in console'));
  });
});
