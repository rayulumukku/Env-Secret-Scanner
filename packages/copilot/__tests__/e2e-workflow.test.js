/**
 * packages/copilot/__tests__/e2e-workflow.test.js
 *
 * Full End-to-End Developer Lifecycle Test.
 *
 * Flow:
 *   1. Developer code containing synthetic secret
 *   2. Scanner detection & finding generation
 *   3. PR check & policy evaluation (blocked status)
 *   4. Copilot structured explanation & quick fix proposal
 *   5. Safe patch generation & validation
 *   6. File patching
 *   7. Verification re-scan confirms 0 secrets
 *   8. Remediation confirmation & resolution
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { scanSync } from '../../scanner/index.js';
import {
  explainFinding,
  explainPullRequest,
  generateQuickFixActions,
  executePatch,
  generateSafePullRequestComment
} from '../index.js';

describe('SecretShield — End-to-End Developer Security Lifecycle', () => {
  it('should complete the entire detection-to-remediation workflow seamlessly', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-e2e-'));
    const sourceFile = path.join(tmpDir, 'payment-gateway.js');

    // Stage 1: Developer writes code containing a synthetic Stripe secret key
    const initialSource = [
      '// Payment Gateway Integration',
      'const STRIPE_SECRET = "' + 'sk_live_' + '1234567890abcdef1234567890";',
      'export function processPayment(amount) {',
      '  return { success: true, amount };',
      '}'
    ].join('\n');

    fs.writeFileSync(sourceFile, initialSource, 'utf8');

    // Stage 2: SecretShield scans file and detects secret finding
    const scanResult = scanSync({
      files: [{ name: 'payment-gateway.js', content: initialSource }]
    });
    assert.ok(scanResult.findings.length >= 1, 'Expected findings in initial source');
    const finding = scanResult.findings.find(f => f.ruleId === 'STRIPE_SECRET_KEY') || scanResult.findings[0];
    assert.ok(finding.ruleId.includes('STRIPE') || finding.ruleId.includes('SECRET'));
    assert.ok(finding.maskedValue.includes('••••'));

    // Stage 3: PR check evaluates findings and blocks merge
    const prEvaluation = explainPullRequest({
      number: 101,
      title: 'Add stripe payment gateway',
      newFindings: scanResult.findings,
      policyViolations: [{ name: 'Zero Critical Secrets', action: 'BLOCK_MERGE', reason: 'Critical secret detected' }]
    });

    assert.strictEqual(prEvaluation.securityStatus, 'BLOCKED');
    const prComment = generateSafePullRequestComment(prEvaluation);
    assert.ok(prComment.includes('🛑'));
    assert.ok(prComment.includes('sk_l••••7890') || prComment.includes('••••'));
    assert.ok(!prComment.includes('1234567890abcdef'));

    // Stage 4: Copilot generates explanation and safe quick fixes
    const explanation = explainFinding(finding, { fileContent: initialSource });
    assert.strictEqual(explanation.providerGuidance.providerName, 'Stripe');
    assert.strictEqual(explanation.remediationPlan.length, 6);

    const actions = generateQuickFixActions(finding, { fileContent: initialSource });
    const extractAction = actions.find(a => a.type === 'EXTRACT_ENV_VAR');
    assert.ok(extractAction);
    assert.ok(extractAction.envVarName.includes('STRIPE_SECRET'));

    // Stage 5: Dry-run patch execution and validation
    const dryRunResult = executePatch({
      action: { ...extractAction, targetFile: sourceFile },
      workspaceRoot: tmpDir,
      dryRun: true,
      originalFinding: finding
    });
    assert.strictEqual(dryRunResult.success, true);
    assert.strictEqual(dryRunResult.applied, false);

    // Stage 6: Apply patch to file
    const applyResult = executePatch({
      action: { ...extractAction, targetFile: sourceFile },
      workspaceRoot: tmpDir,
      dryRun: false,
      originalFinding: finding
    });
    assert.strictEqual(applyResult.success, true);
    assert.strictEqual(applyResult.applied, true);

    // Stage 7: Verification scan confirms finding is completely resolved
    const patchedContent = fs.readFileSync(sourceFile, 'utf8');
    assert.ok(patchedContent.includes(`process.env.${extractAction.envVarName}`));
    assert.ok(!patchedContent.includes('1234567890abcdef1234567890'));

    const verifyScan = scanSync({
      files: [{ name: 'payment-gateway.js', content: patchedContent }]
    });
    assert.strictEqual(verifyScan.findings.length, 0);

    // Stage 8: PR status becomes clean
    const resolvedPr = explainPullRequest({
      number: 101,
      title: 'Add stripe payment gateway',
      newFindings: [],
      resolvedFindings: [finding]
    });
    assert.strictEqual(resolvedPr.securityStatus, 'PASSING');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
