import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  scanText,
  scanFiles,
  scanGitDiff,
  ALL_RULES,
  getRuleById,
  shannonEntropy,
  maskSecret,
  createFingerprint,
} from '../src/index.js';

describe('@secretshield/scanner Package Boundary Tests', () => {
  test('ALL_RULES contains standard rule catalogs', () => {
    assert.ok(Array.isArray(ALL_RULES));
    assert.ok(ALL_RULES.length >= 10);

    const awsRule = getRuleById('AWS_ACCESS_KEY_ID');
    assert.ok(awsRule);
    assert.equal(awsRule.severity, 'CRITICAL');
  });

  test('scanText() detects synthetic AWS key and masks credential', async () => {
    // Synthetic test key
    const code = 'const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";';
    const result = await scanText(code, { filename: 'config.js' });

    assert.ok(result.status.toLowerCase() === 'completed');
    assert.ok(result.findings.length >= 1);

    const finding = result.findings[0];
    assert.equal(finding.ruleId, 'AWS_ACCESS_KEY_ID');
    assert.equal(finding.severity, 'CRITICAL');
    assert.ok(finding.confidence >= 70);

    // Verify raw key is NEVER present in finding fields
    assert.equal(finding.rawValue, undefined);
    assert.ok(finding.maskedValue.includes('•') || finding.maskedValue.includes('AKIA'));
    assert.ok(!finding.maskedValue.includes('AKIAIOSFODNN7EXAMPLE'));
  });

  test('scanText() passes on clean code without false positives', async () => {
    const cleanCode = `
      function calculateSum(a, b) {
        const username = "developer_alice";
        return a + b;
      }
    `;
    const result = await scanText(cleanCode, { filename: 'math.js' });
    assert.equal(result.findings.length, 0);
    assert.equal(result.statistics.totalFindings, 0);
  });

  test('scanFiles() processes multiple in-memory files', async () => {
    const files = [
      { name: 'app.js', content: 'console.log("hello world");' },
      { name: 'secret.env', content: 'OPENAI_API_KEY="sk-proj-DEMO0000000000000000000000000000000000000000000000"' },
    ];

    const result = await scanFiles(files);
    assert.equal(result.filesScanned, 2);
    assert.ok(result.findings.length >= 1);
    assert.ok(result.findings.some(f => f.file === 'secret.env'));
  });

  test('scanGitDiff() detects secrets in added diff lines', async () => {
    const diff = `
diff --git a/server/api.js b/server/api.js
index 1234567..89abcdef 100644
--- a/server/api.js
+++ b/server/api.js
@@ -1,4 +1,5 @@
 const express = require('express');
+const STRIPE_SECRET = "sk_test_DEMO000000000000000000000000";
 const app = express();
`;

    const result = await scanGitDiff(diff);
    assert.ok(result.findings.length >= 1);
    assert.equal(result.findings[0].file, 'server/api.js');
  });

  test('shannonEntropy() computes accurate randomness score', () => {
    const lowEntropy = shannonEntropy('aaaaaaaaaaaaaaaa');
    assert.equal(lowEntropy, 0);

    const highEntropy = shannonEntropy('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    assert.ok(highEntropy > 4.2);
  });

  test('createFingerprint() generates deterministic hash', () => {
    const fp1 = createFingerprint({ type: 'AWS', file: 'config.js', line: 1, maskedValue: 'AKIA...1234' });
    const fp2 = createFingerprint({ type: 'AWS', file: 'config.js', line: 1, maskedValue: 'AKIA...1234' });
    const fp3 = createFingerprint({ type: 'AWS', file: 'other.js', line: 5, maskedValue: 'AKIA...5678' });

    assert.equal(fp1, fp2);
    assert.notEqual(fp1, fp3);
  });
});
