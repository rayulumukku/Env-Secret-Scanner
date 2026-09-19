/**
 * @file lifecycle-flow.test.js
 * @description Comprehensive end-to-end simulation of PR lifecycle, git diff scans, and secret introduction/removal tracking.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanGitDiff } from '../diff/diff-scanner.js';
import { compareBranches } from '../comparison.js';
import {
  evaluatePullRequestSecurity,
  formatGitHubCheckRunOutput
} from '../pr-intelligence.js';
import { trackSecretIntroduction } from '../intelligence/introduction-tracker.js';
import { trackSecretRemoval } from '../intelligence/removal-tracker.js';
import { buildExposureTimeline } from '../intelligence/exposure-timeline.js';
import { correlateOrganizationFindings } from '../intelligence/multi-repo.js';

describe('Advanced Repository Intelligence End-to-End Flow', () => {
  it('E2E Flow 1: Developer introduces secret in PR diff -> fails check -> fixes -> passes check', () => {
    // Step 1 & 2: Developer introduces synthetic credential in feature branch diff
    const initialDiff = `
diff --git a/src/services/billing.js b/src/services/billing.js
new file mode 100644
--- /dev/null
+++ b/src/services/billing.js
@@ -0,0 +1,5 @@
+import axios from 'axios';
+const STRIPE_KEY = "sk_test_51AbcDefGhIjKlMnOpQrStUvWxYz0123456789";
+export function createCharge() {}
+`;

    // Step 3: SecretShield scans diff
    const diffResult = scanGitDiff(initialDiff);
    assert.ok(diffResult.findings.length >= 1);
    const introducedFinding = diffResult.findings[0];
    assert.ok(introducedFinding.ruleId.includes('STRIPE') || introducedFinding.ruleId.includes('KEY'));
    assert.strictEqual(introducedFinding.line, 2);

    // Step 4: PR Check evaluates to FAILED
    const pr = { number: 105, sourceBranch: 'feature/payment', targetBranch: 'main' };
    const baseBranchFindings = []; // Main is clean
    const prEvaluation1 = evaluatePullRequestSecurity(pr, diffResult.findings, baseBranchFindings);

    assert.strictEqual(prEvaluation1.isPassed, false);
    assert.strictEqual(prEvaluation1.status, 'FAILED');
    assert.ok(prEvaluation1.counts.introduced >= 1);

    const checkOutput1 = formatGitHubCheckRunOutput(prEvaluation1);
    assert.strictEqual(checkOutput1.conclusion, 'failure');
    assert.match(checkOutput1.text, /Action Required/);

    // Step 5: Developer removes the secret in follow-up commit
    const remediationDiff = `
diff --git a/src/services/billing.js b/src/services/billing.js
--- a/src/services/billing.js
+++ b/src/services/billing.js
@@ -1,3 +1,3 @@
 import axios from 'axios';
-const STRIPE_KEY = "sk_test_51AbcDefGhIjKlMnOpQrStUvWxYz0123456789";
+const STRIPE_KEY = process.env.STRIPE_API_KEY;
 export function createCharge() {}
`;

    // Step 6: PR rescanned
    const remediatedDiffResult = scanGitDiff(remediationDiff);
    assert.strictEqual(remediatedDiffResult.findings.length, 0);

    const prEvaluation2 = evaluatePullRequestSecurity(pr, remediatedDiffResult.findings, baseBranchFindings);
    assert.strictEqual(prEvaluation2.isPassed, true);
    assert.strictEqual(prEvaluation2.status, 'PASSED');
    assert.strictEqual(prEvaluation2.counts.introduced, 0);

    const checkOutput2 = formatGitHubCheckRunOutput(prEvaluation2);
    assert.strictEqual(checkOutput2.conclusion, 'success');
    assert.match(checkOutput2.text, /Security Checks Passed/);
  });

  it('E2E Flow 2: Pre-existing base secret does NOT fail unrelated PR', () => {
    // Legacy finding in main branch
    const baseFindings = [
      {
        fingerprint: 'fp_legacy_database_key',
        ruleId: 'DATABASE_POSTGRES_URI',
        severity: 'HIGH',
        file: 'config/db.js',
        line: 10,
        maskedValue: 'postgresql://postgres:••••••••@localhost:5432/app'
      }
    ];

    // PR modifies unrelated frontend file
    const prDiff = `
diff --git a/src/components/Header.js b/src/components/Header.js
--- a/src/components/Header.js
+++ b/src/components/Header.js
@@ -1,2 +1,3 @@
+export function Header() { return <h1>SecretShield</h1>; }
`;

    const prDiffResult = scanGitDiff(prDiff);
    assert.strictEqual(prDiffResult.findings.length, 0);

    // Full branch scan on PR includes the legacy finding from base
    const prBranchFindings = [...baseFindings];

    const pr = { number: 106, sourceBranch: 'feature/ui-update', targetBranch: 'main' };
    const evaluation = evaluatePullRequestSecurity(pr, prBranchFindings, baseFindings);

    // Gate must PASS because introduced count is 0
    assert.strictEqual(evaluation.isPassed, true);
    assert.strictEqual(evaluation.status, 'PASSED');
    assert.strictEqual(evaluation.counts.introduced, 0);
    assert.strictEqual(evaluation.counts.existing, 1);
    assert.strictEqual(evaluation.existingFindings[0].originCategory, 'EXISTING');
  });

  it('E2E Flow 3: Complete Exposure Timeline and Removal Tracking', () => {
    const finding = {
      fingerprint: 'fp_aws_iam_key',
      ruleId: 'AWS_ACCESS_KEY_ID',
      commitHash: 'c123456789abcdef',
      author: 'alice@secretshield.dev',
      commitDate: '2026-09-10',
      file: 'config/aws.js',
      line: 5,
      maskedValue: 'AKIA••••1234'
    };

    // 1. Introduction tracking
    const intro = trackSecretIntroduction(finding);
    assert.strictEqual(intro.firstSeenShortCommit, 'c123456');
    assert.match(intro.introductionStatement, /Introduced in commit c123456 on 2026-09-10/);

    // 2. Removal tracking after commit
    const currentHeadFindings = []; // Removed in current branch
    const removal = trackSecretRemoval(finding, currentHeadFindings, 'f9876543210fedcb');
    assert.strictEqual(removal.isRemovedFromCurrentSource, true);
    assert.match(removal.statusSummary, /Detected: c123456 \| Removed: f987654 \| Current source: Not detected/);

    // 3. Exposure timeline
    const timeline = buildExposureTimeline('fp_aws_iam_key', [finding], false);
    assert.strictEqual(timeline.currentStatus, 'REMOVED_FROM_CURRENT_SOURCE');
    assert.strictEqual(timeline.timeline.length, 2);
    assert.strictEqual(timeline.timeline[0].eventType, 'FIRST_DETECTED');
    assert.strictEqual(timeline.timeline[1].eventType, 'REMOVED_FROM_SOURCE');
  });

  it('E2E Flow 4: Multi-repository Correlation within Organization', () => {
    const orgFindings = [
      { organizationId: 'org_corp', repositoryName: 'service-a', fingerprint: 'fp_shared_redis', file: '.env', line: 2 },
      { organizationId: 'org_corp', repositoryName: 'service-b', fingerprint: 'fp_shared_redis', file: 'config/redis.js', line: 15 },
      { organizationId: 'org_other', repositoryName: 'isolated-repo', fingerprint: 'fp_shared_redis', file: 'app.env', line: 1 }
    ];

    const correlationMap = correlateOrganizationFindings(orgFindings, 'org_corp');
    const sharedResult = correlationMap.get('fp_shared_redis');

    assert.ok(sharedResult);
    assert.strictEqual(sharedResult.repositoryCount, 2);
    assert.deepStrictEqual(sharedResult.repositoryNames, ['service-a', 'service-b']);
    assert.match(sharedResult.summary, /Detected across 2 repositories/);
  });
});
