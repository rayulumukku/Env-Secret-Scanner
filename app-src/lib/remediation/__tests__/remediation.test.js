/**
 * lib/remediation/__tests__/remediation.test.js
 *
 * Automated tests for Remediation Guide Engine, Checklist tracking,
 * Secret Blocking in Comments, SLAs, Rescan verification, and Correlation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRemediationGuide, calculateSlaStatus, validateNoteOrComment } from '../engine.js';
import { getProviderForFinding } from '../providers.js';
import {
  getFindingDetails,
  updateFindingRemediation,
  updateFindingAssignment,
  addFindingComment,
  executeFindingRescan,
  getRelatedFindings,
  bulkRemediate,
} from '../../db/remediation.js';
import { createProject } from '../../db/projects.js';
import { createRepository } from '../../db/repositories.js';
import { createScan } from '../../db/scans.js';
import { saveFindings } from '../../db/findings.js';

test('Remediation Guide Engine & Security Response', async (t) => {
  await t.test('getProviderForFinding correctly maps rule categories to providers', () => {
    assert.equal(getProviderForFinding({ ruleId: 'aws-access-key-id' }).name, 'Amazon Web Services (AWS)');
    assert.equal(getProviderForFinding({ ruleId: 'github-pat-classic' }).name, 'GitHub');
    assert.equal(getProviderForFinding({ ruleId: 'stripe-secret-key' }).name, 'Stripe');
    assert.equal(getProviderForFinding({ ruleId: 'openai-api-key' }).name, 'OpenAI');
    assert.equal(getProviderForFinding({ ruleId: 'postgres-conn-url' }).name, 'Database (PostgreSQL / MySQL / MongoDB / Redis)');
  });

  await t.test('generateRemediationGuide produces checklist and provider links', () => {
    const guide = generateRemediationGuide({ ruleId: 'aws-access-key' });
    assert.ok(guide.documentationUrl.includes('aws.amazon.com'));
    assert.ok(guide.steps.length > 0);
    assert.ok(guide.checklist.length >= 5);
    assert.equal(guide.checklist[0].id, 'revoke_provider');
  });

  await t.test('calculateSlaStatus calculates on-track and overdue statuses', () => {
    const recentFinding = { severity: 'CRITICAL', createdAt: new Date().toISOString() };
    const recentSla = calculateSlaStatus(recentFinding, { CRITICAL: 4 });
    assert.equal(recentSla.status, 'ON_TRACK');

    const oldFinding = {
      severity: 'CRITICAL',
      createdAt: new Date(Date.now() - (10 * 60 * 60 * 1000)).toISOString(), // 10 hours ago
    };
    const oldSla = calculateSlaStatus(oldFinding, { CRITICAL: 4 });
    assert.equal(oldSla.status, 'OVERDUE');
  });

  await t.test('validateNoteOrComment blocks raw secret strings from being saved', () => {
    const cleanNote = 'Rotated AWS key in IAM console and updated SSM parameter.';
    const validResult = validateNoteOrComment(cleanNote);
    assert.equal(validResult.valid, true);

    const maliciousNote = 'Here is the new key to use: AKIAIOSFODNN7EXAMPLE';
    const invalidResult = validateNoteOrComment(maliciousNote);
    assert.equal(invalidResult.valid, false);
    assert.ok(invalidResult.error.includes('Security Policy Violation'));
  });

  await t.test('Finding Remediation Lifecycle & Rescan Verification', async () => {
    const project = await createProject({
      organizationId: 'org_remediation_test',
      name: 'Remediation Test Project',
      slug: `rem-${Date.now()}`,
    });

    const repo = await createRepository({
      projectId: project.id,
      provider: 'GITHUB',
      name: 'auth-service',
      fullName: 'acme/auth-service',
    });

    const scan = await createScan({
      projectId: project.id,
      repositoryId: repo.id,
      branch: 'main',
    });

    const findings = await saveFindings(scan.scanId, project.id, repo.id, [
      {
        ruleId: 'aws-access-key-id',
        type: 'AWS Access Key',
        severity: 'CRITICAL',
        file: 'src/aws.js',
        line: 12,
        maskedValue: 'AKIA••••••••••••MPLE',
        fingerprint: 'fp_aws_rem_test_123',
      },
      {
        ruleId: 'aws-access-key-id',
        type: 'AWS Access Key',
        severity: 'CRITICAL',
        file: 'src/backup.js',
        line: 45,
        maskedValue: 'AKIA••••••••••••MPLE',
        fingerprint: 'fp_aws_rem_test_123', // duplicate fingerprint across files
      },
    ]);

    const targetFinding = findings[0];

    // 1. Fetch details
    const details = await getFindingDetails(targetFinding.id);
    assert.equal(details.id, targetFinding.id);
    assert.ok(details.guide.steps.length > 0);

    // 2. Add comment (valid)
    const comment = await addFindingComment(targetFinding.id, {
      userEmail: 'dev@acme.com',
      userName: 'Alice Dev',
      text: 'Starting key rotation in AWS console.',
    });
    assert.equal(comment.text, 'Starting key rotation in AWS console.');

    // 3. Attempting to add comment with raw credential must throw error
    await assert.rejects(
      async () => {
        await addFindingComment(targetFinding.id, {
          userEmail: 'dev@acme.com',
          text: 'The replacement key is AKIAIOSFODNN7EXAMPLE',
        });
      },
      /Security Policy Violation/
    );

    // 4. Update checklist & status
    const updated = await updateFindingRemediation(targetFinding.id, {
      status: 'IN_PROGRESS',
      notes: 'Deactivated compromised key.',
    });
    assert.equal(updated.status, 'IN_PROGRESS');

    // 5. Update assignment
    const assigned = await updateFindingAssignment(targetFinding.id, {
      assigneeEmail: 'lead@acme.com',
      priority: 'CRITICAL',
    });
    assert.equal(assigned.assignment.assigneeEmail, 'lead@acme.com');

    // 6. Test Rescan
    const rescanResult = await executeFindingRescan(targetFinding.id, { userEmail: 'alice@acme.com' });
    assert.ok(rescanResult.message.includes('Rescan complete'));

    // 7. Test Related Occurrences (matches finding[1] with same fingerprint)
    const related = await getRelatedFindings(targetFinding);
    assert.equal(related.length, 1);
    assert.equal(related[0].file, 'src/backup.js');

    // 8. Test Bulk Remediation
    const bulkResults = await bulkRemediate([targetFinding.id], {
      action: 'STATUS',
      status: 'RESOLVED',
      note: 'Verified in production.',
    });
    assert.equal(bulkResults.length, 1);
    assert.equal(bulkResults[0].status, 'RESOLVED');
  });
});
