/**
 * lib/scanner/intelligence/__tests__/intelligence.test.js
 *
 * Automated tests for Detection Intelligence Layer:
 * - Language-aware scanning
 * - .env intelligence & gitignore checks
 * - High-entropy multi-factor analysis
 * - Context engine & syntax parsing
 * - False positive & template filtering
 * - Confidence scoring & explainability
 * - Similarity & occurrence grouping
 * - Developer quick fixes
 * - ReDoS safety validation
 * - Scanner benchmarking
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLanguage,
  evaluateEntropy,
  calculateShannonEntropy,
  extractLanguageContext,
  analyzeContextSignals,
  analyzeFalsePositive,
  calculateConfidence,
  groupSimilarFindings,
  generateQuickFix,
} from '../index.js';
import { validateRegexSafety, safeRegexExec } from '../../regex-safety.js';
import { runBenchmark, generateSyntheticFixtures } from '../../benchmark.js';
import { scanString, scan } from '../../engine.js';
import { addSuppression, checkFindingSuppressed } from '../../../db/suppressions.js';

test('Detection Intelligence: Language & File Role Detection', async (t) => {
  await t.test('detects JavaScript, Python, YAML, JSON, Shell, Dockerfile, SQL', () => {
    assert.equal(detectLanguage('src/app.js').language, 'javascript');
    assert.equal(detectLanguage('src/db.py').language, 'python');
    assert.equal(detectLanguage('docker-compose.yml').language, 'yaml');
    assert.equal(detectLanguage('config.json').language, 'json');
    assert.equal(detectLanguage('deploy.sh').language, 'shell');
    assert.equal(detectLanguage('Dockerfile').language, 'dockerfile');
    assert.equal(detectLanguage('schema.sql').language, 'sql');
    assert.equal(detectLanguage('main.tf').language, 'terraform');
  });

  await t.test('correctly evaluates .env risk profiles', () => {
    const prodEnv = detectLanguage('.env.production');
    assert.equal(prodEnv.isEnvFile, true);
    assert.equal(prodEnv.envRisk, 'HIGH');

    const localEnv = detectLanguage('.env.local');
    assert.equal(localEnv.envRisk, 'HIGH');

    const sampleEnv = detectLanguage('.env.example');
    assert.equal(sampleEnv.isEnvFile, true);
    assert.equal(sampleEnv.envRisk, 'TEMPLATE');
  });

  await t.test('identifies configuration and test files', () => {
    assert.equal(detectLanguage('config/settings.json').isConfigFile, true);
    assert.equal(detectLanguage('src/auth.test.js').isTestFile, true);
    assert.equal(detectLanguage('README.md').isDocumentation, true);
  });
});

test('Detection Intelligence: Multi-Factor Entropy Engine', async (t) => {
  await t.test('calculates Shannon entropy accurately', () => {
    assert.equal(calculateShannonEntropy(''), 0);
    assert.equal(calculateShannonEntropy('aaaaaa'), 0); // single repeated char = 0 bits
    const mixed = calculateShannonEntropy('wJalrXUtnFEMIK7MDENGbPxRfiCY');
    assert.ok(mixed >= 4.0, `Expected entropy >= 4.0, got ${mixed}`);
  });

  await t.test('evaluates entropy signals without classifying entropy alone as critical', () => {
    const highEntropyToken = 'c8f49a21b7e0d35841209e7c3a5b6d1f';
    const result = evaluateEntropy(highEntropyToken, { minLength: 8 });
    assert.equal(result.isHighEntropy, true);
    assert.ok(result.signals.length > 0);
    assert.equal(result.charset, 'hex');

    // Low entropy string
    const lowEntropy = evaluateEntropy('password123', { minLength: 8 });
    assert.equal(lowEntropy.isVeryHighEntropy, false);
  });
});

test('Detection Intelligence: Language-Aware Syntax & Context', async (t) => {
  await t.test('parses JS assignment syntax', () => {
    const ctx = extractLanguageContext('const API_KEY = "••••••••";', 'javascript');
    assert.equal(ctx.variableName, 'api_key');
    assert.equal(ctx.isSecretVariable, true);
    assert.equal(ctx.assignmentStrength, 'STRONG');
  });

  await t.test('parses Python assignment syntax', () => {
    const ctx = extractLanguageContext('DATABASE_PASSWORD = "••••••••"', 'python');
    assert.equal(ctx.variableName, 'database_password');
    assert.equal(ctx.isSecretVariable, true);
  });

  await t.test('parses YAML / Dockerfile syntax', () => {
    const yamlCtx = extractLanguageContext('  slack_token: "••••••••"', 'yaml');
    assert.equal(yamlCtx.variableName, 'slack_token');
    assert.equal(yamlCtx.isSecretVariable, true);

    const dockerCtx = extractLanguageContext('ENV SECRET_KEY="••••••••"', 'dockerfile');
    assert.equal(dockerCtx.variableName, 'secret_key');
    assert.equal(dockerCtx.isSecretVariable, true);
  });
});

test('Detection Intelligence: False Positive & Template Filtering', async (t) => {
  await t.test('identifies template placeholders and dummy values', () => {
    assert.equal(analyzeFalsePositive('${API_KEY}').isFalsePositive, true);
    assert.equal(analyzeFalsePositive('{{SECRET}}').isFalsePositive, true);
    assert.equal(analyzeFalsePositive('<YOUR_TOKEN_HERE>').isFalsePositive, true);
    assert.equal(analyzeFalsePositive('your_api_key').isFalsePositive, true);
    assert.equal(analyzeFalsePositive('changeme').isFalsePositive, true);
    assert.equal(analyzeFalsePositive('0000000000').isFalsePositive, true);
  });

  await t.test('reduces confidence for .env.example files', () => {
    const fp = analyzeFalsePositive('some_random_key_123', { envRisk: 'TEMPLATE' });
    const hasTemplateSignal = fp.signals.some(s => s.label.includes('Sample/template'));
    assert.ok(hasTemplateSignal);
  });
});

test('Detection Intelligence: Confidence Scoring & Explainability', async (t) => {
  await t.test('builds explainable signals and whyDetected rationale', () => {
    const result = calculateConfidence({
      isProviderRule: true,
      rule: { name: 'AWS Access Key ID', severity: 'CRITICAL' },
      fileRole: { envRisk: 'HIGH', isEnvFile: true },
      contextSignals: [{ label: 'Sensitive variable name (aws_key)', score: 20, positive: true }],
      entropySignals: [{ label: 'High entropy (4.8 bits, alphanumeric)', score: 15, positive: true }],
      falsePositiveSignals: [],
    });

    assert.ok(result.confidence >= 80);
    assert.equal(result.severity, 'CRITICAL');
    assert.ok(result.whyDetected.length >= 2);
    assert.ok(result.whyDetected.some(w => w.includes('AWS Access Key ID')));
  });
});

test('Detection Intelligence: Duplicate Grouping & Similarity', async (t) => {
  await t.test('aggregates same secret across multiple files into single grouped finding', () => {
    const findings = [
      { id: 'f1', fingerprint: 'fp_aws_1', ruleId: 'AWS_KEY', file: 'src/config.js', line: 12, maskedValue: 'AKIA••••1234' },
      { id: 'f2', fingerprint: 'fp_aws_1', ruleId: 'AWS_KEY', file: '.env', line: 4, maskedValue: 'AKIA••••1234' },
      { id: 'f3', fingerprint: 'fp_aws_1', ruleId: 'AWS_KEY', file: 'docker-compose.yml', line: 22, maskedValue: 'AKIA••••1234' },
      { id: 'f4', fingerprint: 'fp_stripe_2', ruleId: 'STRIPE_KEY', file: 'src/pay.js', line: 8, maskedValue: 'sk_live••••5678' },
    ];

    const grouped = groupSimilarFindings(findings);
    assert.equal(grouped.length, 2);

    const awsGroup = grouped.find(g => g.fingerprint === 'fp_aws_1');
    assert.equal(awsGroup.occurrenceCount, 3);
    assert.equal(awsGroup.occurrences.length, 3);
  });
});

test('Detection Intelligence: Quick Fix Generator', async (t) => {
  await t.test('generates safe migration snippets for JS, Python, and Docker without raw secrets', () => {
    const jsFix = generateQuickFix({ variableName: 'api_key', maskedValue: '••••••••' }, 'javascript');
    assert.ok(jsFix.afterSnippet.includes('process.env.API_KEY'));
    assert.ok(!jsFix.afterSnippet.includes('raw_secret'));

    const pyFix = generateQuickFix({ variableName: 'database_url', maskedValue: '••••••••' }, 'python');
    assert.ok(pyFix.afterSnippet.includes('os.environ["DATABASE_URL"]'));

    const dockerFix = generateQuickFix({ variableName: 'stripe_token', maskedValue: '••••••••' }, 'dockerfile');
    assert.ok(dockerFix.afterSnippet.includes('${STRIPE_TOKEN}'));
  });
});

test('ReDoS Safety Engine', async (t) => {
  await t.test('accepts valid, safe regular expressions', () => {
    const valid = validateRegexSafety('ACME_[A-Z0-9]{20}');
    assert.equal(valid.valid, true);
  });

  await t.test('rejects catastrophic backtracking nested quantifiers', () => {
    const dangerous = validateRegexSafety('(a+)+$');
    assert.equal(dangerous.valid, false);
    assert.ok(dangerous.error.includes('catastrophic backtracking') || dangerous.error.includes('nested quantifiers'));
  });

  await t.test('rejects oversized regex patterns > 500 chars', () => {
    const longPattern = 'a'.repeat(501);
    const result = validateRegexSafety(longPattern);
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('maximum allowed length'));
  });
});

test('Scanner Benchmarking Engine', async (t) => {
  await t.test('generates synthetic fixtures and measures throughput metrics', async () => {
    const res = await runBenchmark({ fileCount: 50, linesPerFile: 10 });
    assert.equal(res.filesCount, 50);
    assert.ok(res.durationMs > 0);
    assert.ok(res.filesPerSec > 0);
    assert.ok(res.topRuleTimings.length > 0);
  });
});

test('False Positive Learning & Suppressions', async (t) => {
  await t.test('adds suppression rule and filters findings accordingly', async () => {
    const sup = await addSuppression({
      organizationId: 'org_test',
      type: 'FINGERPRINT',
      target: 'fp_suppressed_123',
      reason: 'Verified non-secret test fixture',
    });
    assert.equal(sup.target, 'fp_suppressed_123');

    const matchingFinding = { fingerprint: 'fp_suppressed_123', file: 'src/test.js' };
    const nonMatchingFinding = { fingerprint: 'fp_active_456', file: 'src/auth.js' };

    assert.equal(checkFindingSuppressed(matchingFinding, [sup]), true);
    assert.equal(checkFindingSuppressed(nonMatchingFinding, [sup]), false);
  });
});
