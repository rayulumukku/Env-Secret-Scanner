/**
 * @file comparison.test.js
 * @description Unit tests for Branch Comparison, PR Finding Filter, and GitHub Check Output
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareBranches } from '../comparison.js';
import {
  evaluatePullRequestSecurity,
  formatGitHubCheckRunOutput,
  evaluateBranchProtectionStatus
} from '../pr-intelligence.js';

describe('Branch Comparison & PR Intelligence', () => {
  it('compareBranches correctly categorizes NEW, RESOLVED, and EXISTING findings', () => {
    const baseFindings = [
      { fingerprint: 'fp_existing_1', ruleId: 'AWS_ACCESS_KEY_ID', file: 'src/old.js' },
      { fingerprint: 'fp_resolved_2', ruleId: 'GITHUB_TOKEN', file: 'src/auth.js' }
    ];

    const compareFindings = [
      { fingerprint: 'fp_existing_1', ruleId: 'AWS_ACCESS_KEY_ID', file: 'src/old.js' },
      { fingerprint: 'fp_new_3', ruleId: 'STRIPE_KEY', file: 'src/payment.js' }
    ];

    const result = compareBranches(baseFindings, compareFindings, {
      baseBranch: 'main',
      compareBranch: 'feature/payment'
    });

    assert.strictEqual(result.newFindings.length, 1);
    assert.strictEqual(result.newFindings[0].fingerprint, 'fp_new_3');
    assert.strictEqual(result.newFindings[0].originCategory, 'INTRODUCED_BY_PR');

    assert.strictEqual(result.resolvedFindings.length, 1);
    assert.strictEqual(result.resolvedFindings[0].fingerprint, 'fp_resolved_2');
    assert.strictEqual(result.resolvedFindings[0].originCategory, 'RESOLVED_BY_PR');

    assert.strictEqual(result.persistentFindings.length, 1);
    assert.strictEqual(result.persistentFindings[0].fingerprint, 'fp_existing_1');
    assert.strictEqual(result.persistentFindings[0].originCategory, 'EXISTING');

    assert.strictEqual(result.securityVerdict, 'BLOCKING_SECRETS_INTRODUCED');
  });

  it('evaluatePullRequestSecurity does NOT block PR for pre-existing findings', () => {
    const baseFindings = [
      { fingerprint: 'fp_legacy_key', ruleId: 'GENERIC_API_KEY', severity: 'HIGH' }
    ];
    const prFindings = [
      { fingerprint: 'fp_legacy_key', ruleId: 'GENERIC_API_KEY', severity: 'HIGH' } // Unchanged existing
    ];

    const pr = { number: 42, sourceBranch: 'feature/docs', targetBranch: 'main' };
    const evaluation = evaluatePullRequestSecurity(pr, prFindings, baseFindings);

    assert.strictEqual(evaluation.isPassed, true);
    assert.strictEqual(evaluation.status, 'PASSED');
    assert.strictEqual(evaluation.counts.introduced, 0);
    assert.strictEqual(evaluation.counts.existing, 1);
    assert.match(evaluation.summaryMessage, /pre-existing finding\(s\) remain in base branch/);
  });

  it('evaluatePullRequestSecurity fails when new secret is introduced', () => {
    const baseFindings = [];
    const prFindings = [
      { id: 'find_1', fingerprint: 'fp_new_key', ruleId: 'AWS_ACCESS_KEY_ID', severity: 'CRITICAL', file: 'src/app.js' }
    ];

    const pr = { number: 43, sourceBranch: 'feature/aws', targetBranch: 'main' };
    const evaluation = evaluatePullRequestSecurity(pr, prFindings, baseFindings);

    assert.strictEqual(evaluation.isPassed, false);
    assert.strictEqual(evaluation.status, 'FAILED');
    assert.strictEqual(evaluation.counts.introduced, 1);
  });

  it('formatGitHubCheckRunOutput generates safe markdown with finding links', () => {
    const evaluation = {
      isPassed: false,
      summaryMessage: '1 secret finding introduced.',
      counts: { introduced: 1, existing: 2, resolved: 0 },
      introducedFindings: [
        {
          id: 'find_100',
          severity: 'CRITICAL',
          ruleId: 'AWS_ACCESS_KEY_ID',
          ruleName: 'AWS Access Key ID',
          file: 'src/config.js',
          line: 15,
          maskedValue: 'AKIA••••1234'
        }
      ]
    };

    const checkOutput = formatGitHubCheckRunOutput(evaluation, 'https://app.secretshield.dev');

    assert.strictEqual(checkOutput.conclusion, 'failure');
    assert.match(checkOutput.title, /1 New Secret\(s\) Detected/);
    assert.match(checkOutput.text, /https:\/\/app\.secretshield\.dev\/findings\/find_100/);
    assert.match(checkOutput.text, /Pre-existing Base Findings/);
    // Ensure raw secret not present
    assert.doesNotMatch(checkOutput.text, /AKIAIOSFODNN/);
  });

  it('evaluateBranchProtectionStatus correctly classifies protection', () => {
    const protectedConfig = {
      required_status_checks: {
        contexts: ['continuous-integration/travis-ci', 'SecretShield Security Audit']
      }
    };
    assert.strictEqual(evaluateBranchProtectionStatus(protectedConfig).status, 'CONFIGURED');

    const unprotectedConfig = {
      required_status_checks: {
        contexts: ['ci/test']
      }
    };
    assert.strictEqual(evaluateBranchProtectionStatus(unprotectedConfig).status, 'NOT_CONFIGURED');
    assert.strictEqual(evaluateBranchProtectionStatus(null).status, 'UNABLE_TO_DETERMINE');
  });
});
