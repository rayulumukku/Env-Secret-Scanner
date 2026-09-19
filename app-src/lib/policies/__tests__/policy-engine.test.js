import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluatePolicyConditions,
  evaluateConditionPredicate,
  extractFieldValue
} from '../evaluator.js';
import {
  resolveEffectivePolicies,
  detectPolicyConflicts,
  evaluateTargetPolicies
} from '../engine.js';
import {
  PolicyScope,
  PolicyAction,
  PolicyResult,
  ConditionField,
  ConditionOperator,
  validatePolicySchema
} from '../schemas.js';

test('policy schemas - validates correct and invalid policy schemas', () => {
  const validPolicy = {
    name: 'Block Critical Secrets',
    scope: PolicyScope.ORGANIZATION,
    conditions: [
      { field: ConditionField.SEVERITY, operator: ConditionOperator.EQUALS, value: 'CRITICAL' }
    ],
    actions: [PolicyAction.FAIL_CI]
  };

  const res1 = validatePolicySchema(validPolicy);
  assert.equal(res1.valid, true);

  const invalidPolicy = {
    name: '',
    scope: 'INVALID_SCOPE',
    conditions: [],
    actions: []
  };

  const res2 = validatePolicySchema(invalidPolicy);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.length >= 3);
});

test('evaluator - evaluateConditionPredicate handles severity ranks, numbers, and file patterns', () => {
  // Severity checks
  assert.equal(evaluateConditionPredicate({ field: 'severity', operator: 'EQUALS', value: 'CRITICAL' }, 'CRITICAL'), true);
  assert.equal(evaluateConditionPredicate({ field: 'severity', operator: 'GREATER_THAN_OR_EQUAL', value: 'HIGH' }, 'CRITICAL'), true);
  assert.equal(evaluateConditionPredicate({ field: 'severity', operator: 'GREATER_THAN_OR_EQUAL', value: 'HIGH' }, 'LOW'), false);
  assert.equal(evaluateConditionPredicate({ field: 'severity', operator: 'IN', value: ['HIGH', 'CRITICAL'] }, 'CRITICAL'), true);

  // Confidence checks
  assert.equal(evaluateConditionPredicate({ field: 'confidence', operator: 'GREATER_THAN_OR_EQUAL', value: 80 }, 90), true);
  assert.equal(evaluateConditionPredicate({ field: 'confidence', operator: 'GREATER_THAN_OR_EQUAL', value: 80 }, 70), false);

  // File pattern checks
  assert.equal(evaluateConditionPredicate({ field: 'filePattern', operator: 'MATCHES_PATTERN', value: '*.env' }, 'src/config/aws.env'), true);
  assert.equal(evaluateConditionPredicate({ field: 'filePattern', operator: 'MATCHES_PATTERN', value: '*.env' }, 'src/server.js'), false);
});

test('evaluator - evaluatePolicyConditions evaluates compound AND logic', () => {
  const policy = {
    name: 'Block Open Criticals on Main',
    conditions: [
      { field: ConditionField.SEVERITY, operator: ConditionOperator.EQUALS, value: 'CRITICAL' },
      { field: ConditionField.FINDING_STATUS, operator: ConditionOperator.EQUALS, value: 'OPEN' },
      { field: ConditionField.BRANCH, operator: ConditionOperator.EQUALS, value: 'main' }
    ]
  };

  const matchingContext = {
    finding: { severity: 'CRITICAL', status: 'OPEN', branch: 'main' }
  };
  const eval1 = evaluatePolicyConditions(policy, matchingContext);
  assert.equal(eval1.matched, true);

  const nonMatchingContext = {
    finding: { severity: 'CRITICAL', status: 'OPEN', branch: 'feature-branch' }
  };
  const eval2 = evaluatePolicyConditions(policy, nonMatchingContext);
  assert.equal(eval2.matched, false);
});

test('engine - resolveEffectivePolicies applies Repository > Project > Organization precedence', () => {
  const policies = [
    { id: 'pol_org', name: 'Critical Secrets Policy', scope: PolicyScope.ORGANIZATION, enabled: true, actions: [PolicyAction.WARN] },
    { id: 'pol_proj', name: 'Critical Secrets Policy', scope: PolicyScope.PROJECT, scopeId: 'proj_1', enabled: true, actions: [PolicyAction.FAIL_SCAN] },
    { id: 'pol_repo', name: 'Critical Secrets Policy', scope: PolicyScope.REPOSITORY, scopeId: 'repo_backend', enabled: true, actions: [PolicyAction.FAIL_CI] }
  ];

  // Repo scope context
  const effectiveForRepo = resolveEffectivePolicies(policies, { repositoryId: 'repo_backend', projectId: 'proj_1' });
  assert.equal(effectiveForRepo.length, 1);
  assert.equal(effectiveForRepo[0].id, 'pol_repo');
  assert.equal(effectiveForRepo[0].actions[0], PolicyAction.FAIL_CI);

  // Project scope context (different repo)
  const effectiveForOtherRepo = resolveEffectivePolicies(policies, { repositoryId: 'repo_other', projectId: 'proj_1' });
  assert.equal(effectiveForOtherRepo.length, 1);
  assert.equal(effectiveForOtherRepo[0].id, 'pol_proj');
});

test('engine - detectPolicyConflicts detects overlapping conditions with conflicting severities', () => {
  const policies = [
    {
      id: 'pol_1',
      name: 'Policy 1',
      enabled: true,
      conditions: [{ field: 'severity', operator: 'EQUALS', value: 'CRITICAL' }],
      actions: [PolicyAction.FAIL_CI]
    },
    {
      id: 'pol_2',
      name: 'Policy 2',
      enabled: true,
      conditions: [{ field: 'severity', operator: 'EQUALS', value: 'CRITICAL' }],
      actions: [PolicyAction.WARN]
    }
  ];

  const conflicts = detectPolicyConflicts(policies);
  assert.equal(conflicts.length, 1);
  assert.ok(conflicts[0].reason.includes('conflicting action severities'));
});

test('engine - evaluateTargetPolicies executes end-to-end evaluation and dispatches actions', async () => {
  const policies = [
    {
      id: 'pol_block_crit',
      name: 'Block Critical Secrets in PRs',
      scope: PolicyScope.ORGANIZATION,
      enabled: true,
      conditions: [
        { field: ConditionField.SEVERITY, operator: ConditionOperator.EQUALS, value: 'CRITICAL' },
        { field: ConditionField.SCAN_TYPE, operator: ConditionOperator.EQUALS, value: 'PR' }
      ],
      actions: [PolicyAction.FAIL_PR, PolicyAction.FAIL_CI]
    }
  ];

  const payload = {
    finding: {
      id: 'f_test_1',
      severity: 'CRITICAL',
      ruleId: 'AWS_KEY',
      maskedValue: 'AKIA••••••••EXAMPLE',
      status: 'OPEN'
    },
    scan: { type: 'PR', branch: 'feature-x' },
    pr: { number: 12 },
    organizationId: 'org_test'
  };

  const result = await evaluateTargetPolicies(payload, policies, { isSimulation: false });
  assert.equal(result.passed, false);
  assert.equal(result.result, PolicyResult.FAILED);
  assert.equal(result.violations.length, 1);
  assert.equal(result.violations[0].policyName, 'Block Critical Secrets in PRs');
  assert.equal(result.violations[0].maskedValue, 'AKIA••••••••EXAMPLE');
  assert.equal(result.violations[0].rawSecret, undefined); // Invariant
});

test('engine - dry-run mode returns warning without failing pipeline', async () => {
  const policies = [
    {
      id: 'pol_block_crit',
      name: 'Block Critical Secrets',
      scope: PolicyScope.ORGANIZATION,
      enabled: true,
      conditions: [{ field: ConditionField.SEVERITY, operator: ConditionOperator.EQUALS, value: 'CRITICAL' }],
      actions: [PolicyAction.FAIL_CI]
    }
  ];

  const payload = {
    finding: { severity: 'CRITICAL' },
    organizationId: 'org_test'
  };

  const result = await evaluateTargetPolicies(payload, policies, { isDryRun: true });
  assert.equal(result.isDryRun, true);
  assert.equal(result.passed, true); // Does not fail in dry-run
  assert.equal(result.result, PolicyResult.WARNING);
});
