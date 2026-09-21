/**
 * packages/copilot/__tests__/copilot.test.js
 *
 * Unit tests for SecretShield Copilot intelligence layer.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  redactSecrets,
  maskSecretValue,
  sanitizeDataDeep,
  extractSafeCodeWindow,
  buildFindingContext,
  buildPullRequestContext,
  buildCommitContext,
  explainFinding,
  explainCommit,
  explainPullRequest,
  generateSafePullRequestComment,
  detectFalsePositiveIndicators,
  deriveEnvVarName,
  generateQuickFixActions,
  queryCopilot,
  generateRepositorySecurityScorecard,
  updateCopilotPreferences,
  COPILOT_PREFERENCES
} from '../index.js';

describe('@secretshield/copilot — Core Redaction & Sanitization', () => {
  it('should redact known secret patterns from strings', () => {
    const raw = 'const AWS_KEY = "AKIA1234567890ABCDEF"; const GH = "ghp_123456789012345678901234567890123456";';
    const redacted = redactSecrets(raw);

    assert.ok(!redacted.includes('AKIA1234567890ABCDEF'));
    assert.ok(!redacted.includes('ghp_123456789012345678901234567890123456'));
    assert.ok(redacted.includes('[REDACTED_AWS_ACCESS_KEY]'));
    assert.ok(redacted.includes('[REDACTED_GITHUB_TOKEN]'));
  });

  it('should mask secret values to 8-character preview strings without leaking secrets', () => {
    const masked = maskSecretValue('sk_' + 'live_1234567890abcdef1234567890');
    assert.ok(masked.startsWith('sk_l'));
    assert.ok(masked.endsWith('7890'));
    assert.ok(masked.includes('••••'));
    assert.ok(!masked.includes('abcdef'));
  });

  it('should deeply sanitize objects and remove sensitive key values', () => {
    const data = {
      user: 'alice',
      secret: 'super_secret_token_123456789',
      nested: {
        rawSecret: 'AKIA1234567890ABCDEF',
        normalField: 'hello world'
      }
    };
    const sanitized = sanitizeDataDeep(data);
    assert.strictEqual(sanitized.user, 'alice');
    assert.ok(!sanitized.secret.includes('super_secret_token_123456789'));
    assert.ok(!sanitized.nested.rawSecret.includes('AKIA1234567890ABCDEF'));
    assert.strictEqual(sanitized.nested.normalField, 'hello world');
  });
});

describe('@secretshield/copilot — Context Building', () => {
  it('should extract a bounded ±5 line window around target line with secrets redacted', () => {
    const fileLines = Array.from({ length: 20 }, (_, i) => `line ${i + 1}: const key = "AKIA1234567890ABCDEF";`).join('\n');
    const window = extractSafeCodeWindow(fileLines, 10, 3);

    assert.strictEqual(window.length, 7); // 10 - 3 to 10 + 3
    assert.strictEqual(window[3].line, 10);
    assert.strictEqual(window[3].isTarget, true);
    assert.ok(!window[3].content.includes('AKIA1234567890ABCDEF'));
    assert.ok(window[3].content.includes('[REDACTED_AWS_ACCESS_KEY]'));
  });

  it('should build safe finding context with data minimization', () => {
    const finding = {
      id: 'find-123',
      ruleId: 'AWS_ACCESS_KEY',
      ruleName: 'AWS Access Key ID',
      severity: 'CRITICAL',
      confidence: 0.95,
      filePath: 'src/config.js',
      line: 12,
      maskedValue: 'AKIA••••CDEF',
      entropy: 4.12
    };

    const ctx = buildFindingContext(finding);
    assert.strictEqual(ctx.type, 'FINDING');
    assert.strictEqual(ctx.target.ruleId, 'AWS_ACCESS_KEY');
    assert.strictEqual(ctx.target.severity, 'CRITICAL');
    assert.strictEqual(ctx.target.maskedValue, 'AKIA••••CDEF');
  });

  it('should build safe PR and Commit contexts without raw secrets', () => {
    const prCtx = buildPullRequestContext({
      number: 42,
      title: 'Fix auth token ' + 'ghp_' + '123456789012345678901234567890123456',
      filesChanged: ['auth.js', 'config.js'],
      newFindings: [{ ruleId: 'AWS_KEY', severity: 'HIGH' }]
    });

    assert.strictEqual(prCtx.prNumber, 42);
    assert.ok(!prCtx.title.includes('123456789012345678901234567890123456'));
    assert.strictEqual(prCtx.newFindingsCount, 1);

    const commitCtx = buildCommitContext({
      sha: 'a1b2c3d4e5f67890123456789012345678901234',
      message: 'Add secret ' + 'sk_live_' + '1234567890abcdef1234567890'
    });
    assert.strictEqual(commitCtx.shortSha, 'a1b2c3d');
    assert.ok(!commitCtx.message.includes('1234567890abcdef1234567890'));
  });
});

describe('@secretshield/copilot — Finding & PR Explanations', () => {
  it('should generate structured explanation for an AWS finding', () => {
    const finding = {
      ruleId: 'AWS_ACCESS_KEY',
      ruleName: 'AWS Access Key',
      severity: 'CRITICAL',
      confidence: 0.95,
      filePath: 'lib/aws-client.js',
      line: 8,
      maskedValue: 'AKIA••••90AB',
      entropy: 4.15
    };

    const exp = explainFinding(finding);
    assert.ok(exp.summary.includes('AWS Access Key'));
    assert.ok(exp.whyItMatters.includes('AWS'));
    assert.strictEqual(exp.confidence.level, 'HIGH');
    assert.strictEqual(exp.remediationPlan.length, 6);
    assert.strictEqual(exp.providerGuidance.providerName, 'Amazon Web Services (AWS)');
  });

  it('should detect false-positive indicators on test files and placeholder tokens', () => {
    const finding = {
      ruleId: 'GENERIC_API_KEY',
      filePath: 'tests/fixtures/mock_auth.test.js',
      maskedValue: 'your_api_key_here',
      entropy: 2.1
    };

    const indicators = detectFalsePositiveIndicators(finding);
    assert.ok(indicators.some(i => i.type === 'PLACEHOLDER_DETECTED'));
    assert.ok(indicators.some(i => i.type === 'TEST_FILE_CONTEXT'));
    assert.ok(indicators.some(i => i.type === 'LOW_ENTROPY'));
  });

  it('should generate safe PR explanation and comment without raw secrets', () => {
    const prData = {
      number: 101,
      title: 'Update payment integration',
      newFindings: [
        { ruleId: 'STRIPE_SECRET_KEY', ruleName: 'Stripe Secret Key', filePath: 'routes/pay.js', line: 15, severity: 'CRITICAL', maskedValue: 'sk_l••••4f9a' }
      ],
      policyViolations: [
        { name: 'No High Severity Secrets', action: 'BLOCK_MERGE', reason: 'Critical Stripe key found' }
      ]
    };

    const prExp = explainPullRequest(prData);
    assert.strictEqual(prExp.securityStatus, 'BLOCKED');
    assert.strictEqual(prExp.findingsOverview.criticalNewFindings, 1);

    const comment = generateSafePullRequestComment(prExp);
    assert.ok(comment.includes('SecretShield Security Summary'));
    assert.ok(comment.includes('BLOCKED'));
    assert.ok(comment.includes('sk_l••••4f9a'));
    assert.ok(!comment.includes('sk_live_'));
  });
});

describe('@secretshield/copilot — Safe Action Generation', () => {
  it('should generate deterministic env var extraction action', () => {
    const finding = {
      ruleId: 'OPENAI_API_KEY',
      filePath: 'src/ai.js',
      line: 3
    };
    const content = 'const key = "sk-1234567890abcdef1234567890abcdef";';
    const actions = generateQuickFixActions(finding, { fileContent: content });

    const envAction = actions.find(a => a.type === 'EXTRACT_ENV_VAR');
    assert.ok(envAction);
    assert.strictEqual(envAction.envVarName, 'OPENAI_API_KEY');
    assert.strictEqual(envAction.envAccessor, 'process.env.OPENAI_API_KEY');
    assert.ok(envAction.previewDiff.includes('process.env.OPENAI_API_KEY'));
  });

  it('should generate .gitignore action for sensitive config files', () => {
    const finding = {
      ruleId: 'GENERIC_SECRET',
      filePath: '.env.local',
      line: 1
    };
    const actions = generateQuickFixActions(finding);
    const gitignoreAction = actions.find(a => a.type === 'ADD_GITIGNORE');
    assert.ok(gitignoreAction);
    assert.strictEqual(gitignoreAction.targetFile, '.gitignore');
  });
});

describe('@secretshield/copilot — Local Query Processor & Scorecard', () => {
  it('should answer "Why is this finding detected?" offline', async () => {
    const res = await queryCopilot({
      query: 'Why was this finding detected?',
      context: {
        ruleId: 'AWS_ACCESS_KEY',
        ruleName: 'AWS Access Key ID',
        filePath: 'config.js',
        line: 10,
        maskedValue: 'AKIA••••WXYZ',
        severity: 'HIGH'
      },
      mode: 'local'
    });

    assert.strictEqual(res.mode, 'local');
    assert.strictEqual(res.intent, 'EXPLAIN_FINDING');
    assert.ok(res.answer.includes('AWS Access Key ID'));
    assert.ok(res.actions.length > 0);
  });

  it('should generate repository security scorecard with factual metrics only', () => {
    const mockFindings = [
      { ruleId: 'AWS_ACCESS_KEY', status: 'RESOLVED' },
      { ruleId: 'AWS_ACCESS_KEY', status: 'RESOLVED' },
      { ruleId: 'STRIPE_KEY', status: 'ACTIVE' },
      { ruleId: 'GENERIC_KEY', status: 'FALSE_POSITIVE' }
    ];
    const scorecard = generateRepositorySecurityScorecard(mockFindings);

    assert.strictEqual(scorecard.metrics.totalFindingsRecorded, 4);
    assert.strictEqual(scorecard.metrics.resolvedFindingsCount, 2);
    assert.strictEqual(scorecard.metrics.activeFindingsCount, 1);
    assert.strictEqual(scorecard.metrics.resolutionRatePercent, 50);
    assert.ok(scorecard.statement.includes('does not produce individual developer rankings'));
  });

  it('should update and validate safe developer preferences', () => {
    const updated = updateCopilotPreferences({ verbosity: 'concise', defaultLanguage: 'python' });
    assert.strictEqual(updated.verbosity, 'concise');
    assert.strictEqual(updated.defaultLanguage, 'python');
  });
});
