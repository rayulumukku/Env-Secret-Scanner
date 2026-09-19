/**
 * lib/providers/__tests__/e2e-workflow.test.js
 *
 * End-to-End Developer PR Security Workflow Test.
 *
 * Simulates:
 *   PR Created → Webhook Verified → Diff Scanned → Finding Detected →
 *   Check Fails → Slack Alert Built → Secret Removed → Rescanned → Check Passes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { verifyGitHubWebhookSignature } from '../github/webhooks.js';
import { normalizeGitHubEvent } from '../common/repository-events.js';
import { scanCommitDiff } from '../../repository/commit-scanner.js';
import { createProject } from '../../db/projects.js';
import { createRepository } from '../../db/repositories.js';
import { createScan, updateScan } from '../../db/scans.js';
import { saveFindings, getFindings } from '../../db/findings.js';
import { savePullRequestScan, getPullRequestRecord } from '../../db/pull-requests.js';
import { formatCheckSummary } from '../github/checks.js';
import { buildFindingSlackBlock } from '../../notifications/slack.js';

test('End-to-End Developer PR Workflow', async (t) => {
  const secretWebhookKey = 'whsec_e2e_testing_key_8899';
  const rawAwsKey = 'AKIAIOSFODNN7EXAMPLE';

  // 1. Setup Test Project & Repository
  const project = await createProject({
    organizationId: 'org_e2e_test',
    name: 'Payment Service',
    slug: `payments-${Date.now()}`,
    severityThreshold: 'HIGH',
  });

  const repo = await createRepository({
    projectId: project.id,
    provider: 'GITHUB',
    externalId: '12345678',
    name: 'payment-service',
    fullName: 'acme/payment-service',
    defaultBranch: 'main',
  });

  await t.test('Step 1: Developer creates PR containing secret in patch', async () => {
    const rawWebhookPayload = {
      action: 'opened',
      pull_request: {
        id: 991122,
        number: 101,
        title: 'Add AWS S3 file upload integration',
        head: { ref: 'feat/s3-uploads', sha: 'commit_sha_1111' },
        base: { ref: 'main', sha: 'commit_sha_0000' },
        user: { login: 'alex_dev' },
      },
      repository: {
        id: 12345678,
        name: 'payment-service',
        full_name: 'acme/payment-service',
        owner: { login: 'acme' },
      },
      installation: { id: 778899 },
    };

    const rawBody = JSON.stringify(rawWebhookPayload);
    const hmac = crypto.createHmac('sha256', secretWebhookKey);
    hmac.update(Buffer.from(rawBody, 'utf8'));
    const signature = `sha256=${hmac.digest('hex')}`;

    // 2. Verify webhook signature
    const isValidSignature = verifyGitHubWebhookSignature(rawBody, signature, secretWebhookKey);
    assert.equal(isValidSignature, true, 'Webhook signature must be valid');

    // 3. Normalize event
    const event = normalizeGitHubEvent('pull_request', rawWebhookPayload);
    assert.equal(event.pullRequestNumber, 101);
    assert.equal(event.commit, 'commit_sha_1111');

    // 4. Simulate diff scan containing hardcoded AWS key
    const maliciousPatch = [
      '--- a/src/config.js',
      '+++ b/src/config.js',
      '@@ -10,2 +10,4 @@',
      '+const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";',
      '+const S3_BUCKET = "acme-receipts";',
    ].join('\n');

    const findings = scanCommitDiff({
      sha: event.commit,
      files: [{ filename: 'src/config.js', patch: maliciousPatch }],
    });
    assert.ok(findings.length > 0, 'Scanner must detect secret in patch');
    assert.equal(findings[0].severity, 'CRITICAL');

    // 5. Persist Scan & Findings
    const scanRecord = await createScan({
      projectId: project.id,
      repositoryId: repo.id,
      mode: 'CURRENT',
      branch: event.branch,
      commitHash: event.commit,
    });

    await updateScan(scanRecord.scanId, {
      status: 'COMPLETED',
      totalFindings: findings.length,
      criticalCount: 1,
    });

    await saveFindings(scanRecord.scanId, project.id, repo.id, findings);

    // Verify findings are persisted securely (masked only, never raw)
    const storedFindings = await getFindings({ projectId: project.id });
    assert.ok(storedFindings.length > 0);
    assert.ok(storedFindings[0].maskedValue.includes('••••'));

    // 6. Evaluate PR Check Run & PR Record
    const checkSummary = formatCheckSummary({ filesScanned: 1 }, findings, project.severityThreshold);
    assert.ok(checkSummary.includes('CRITICAL'));
    assert.equal(checkSummary.includes(rawAwsKey), false, 'Raw secret must not appear in check summary');

    const prRecord = await savePullRequestScan({
      projectId: project.id,
      repositoryId: repo.id,
      pullNumber: 101,
      title: event.pullRequestTitle,
      author: event.author,
      branch: event.branch,
      commitHash: event.commit,
      checkConclusion: 'failure', // Failed because CRITICAL >= HIGH
      findings,
      filesScanned: 1,
      scanId: scanRecord.scanId,
    });

    assert.equal(prRecord.checkConclusion, 'failure');
    assert.equal(prRecord.criticalCount, 1);

    // 7. Verify Slack Alert formatting with zero-exposure
    const slackBlock = buildFindingSlackBlock({
      severity: 'CRITICAL',
      type: findings[0].type,
      repository: 'acme/payment-service',
      file: 'src/config.js',
      line: findings[0].line,
      confidence: findings[0].confidence,
      author: 'alex_dev',
    });
    const slackStr = JSON.stringify(slackBlock);
    assert.equal(slackStr.includes(rawAwsKey), false, 'Raw secret must not appear in Slack block');
  });

  await t.test('Step 2: Developer removes secret and pushes fix', async () => {
    // Clean patch with environment variable usage
    const cleanPatch = [
      '--- a/src/config.js',
      '+++ b/src/config.js',
      '@@ -10,2 +10,4 @@',
      '+const AWS_KEY = process.env.AWS_ACCESS_KEY_ID;',
      '+const S3_BUCKET = process.env.S3_BUCKET_NAME || "acme-receipts";',
    ].join('\n');

    const cleanFindings = scanCommitDiff({
      sha: 'commit_sha_2222',
      files: [{ filename: 'src/config.js', patch: cleanPatch }],
    });
    assert.equal(cleanFindings.length, 0, 'Clean patch must have 0 findings');

    // Update PR Scan record to success
    const updatedPR = await savePullRequestScan({
      projectId: project.id,
      repositoryId: repo.id,
      pullNumber: 101,
      title: 'Add AWS S3 file upload integration',
      author: 'alex_dev',
      branch: 'feat/s3-uploads',
      commitHash: 'commit_sha_2222',
      checkConclusion: 'success',
      findings: [],
      filesScanned: 1,
      scanId: 'scan_clean_e2e',
    });

    assert.equal(updatedPR.checkConclusion, 'success');
    assert.equal(updatedPR.findingCount, 0);

    const checkSummary = formatCheckSummary({ filesScanned: 1 }, [], project.severityThreshold);
    assert.ok(checkSummary.includes('Passed'));
    assert.ok(checkSummary.includes('No secrets or credentials detected'));
  });
});
