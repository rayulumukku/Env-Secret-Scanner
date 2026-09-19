/**
 * @file lib/policies/engine.js
 * @description Central Security Policy Evaluation Engine.
 * 
 * CORE PRINCIPLES:
 *   - Scope Precedence: Repository policy > Project policy > Organization policy.
 *   - Deterministic Action Precedence:
 *       FAIL_CI / FAIL_PR > FAIL_SCAN > CREATE_TASK > NOTIFY > WARN
 *   - Conflict Detection: Detects overlapping policies with conflicting actions and logs them.
 *   - Transparency: Detailed explanation for every condition evaluated.
 *   - Zero Secret Leakage: Masked values and fingerprints only.
 */

import { PolicyScope, PolicyAction, PolicyResult, ViolationStatus } from './schemas.js';
import { evaluatePolicyConditions } from './evaluator.js';
import { dispatchPolicyActions } from './actions.js';

const ACTION_SEVERITY_ORDER = {
  [PolicyAction.FAIL_CI]: 100,
  [PolicyAction.FAIL_PR]: 90,
  [PolicyAction.FAIL_SCAN]: 80,
  [PolicyAction.CREATE_TASK]: 50,
  [PolicyAction.NOTIFY]: 30,
  [PolicyAction.WARN]: 10
};

/**
 * Resolves effective policies by applying scope precedence:
 * Repository Policy > Project Policy > Organization Policy.
 * 
 * If a Repository-scoped policy matches the same rule/intent as an Org policy,
 * the Repository policy takes precedence.
 * 
 * @param {Array<Object>} policies 
 * @param {Object} context - { repositoryId, projectId, organizationId }
 * @returns {Array<Object>} Effective policies
 */
export function resolveEffectivePolicies(policies = [], context = {}) {
  const { repositoryId, projectId } = context;

  const repoPolicies = [];
  const projectPolicies = [];
  const orgPolicies = [];

  for (const pol of policies) {
    if (!pol.enabled) continue;

    if (pol.scope === PolicyScope.REPOSITORY && pol.scopeId === repositoryId) {
      repoPolicies.push(pol);
    } else if (pol.scope === PolicyScope.PROJECT && pol.scopeId === projectId) {
      projectPolicies.push(pol);
    } else if (pol.scope === PolicyScope.ORGANIZATION) {
      orgPolicies.push(pol);
    }
  }

  // Combine with precedence: repo overrides matching project/org policies with same name/intent
  const effective = [...repoPolicies];
  const repoNames = new Set(repoPolicies.map(p => p.name.toLowerCase()));

  for (const pPol of projectPolicies) {
    if (!repoNames.has(pPol.name.toLowerCase())) {
      effective.push(pPol);
    }
  }

  const activeNames = new Set(effective.map(p => p.name.toLowerCase()));
  for (const oPol of orgPolicies) {
    if (!activeNames.has(oPol.name.toLowerCase())) {
      effective.push(oPol);
    }
  }

  return effective;
}

/**
 * Detects conflicts among effective policies (e.g. one policy says FAIL, another says WARN on identical conditions).
 * 
 * @param {Array<Object>} policies 
 * @returns {Array<Object>} List of conflicts
 */
export function detectPolicyConflicts(policies = []) {
  const conflicts = [];
  const conditionMap = new Map();

  for (const policy of policies) {
    if (!policy.enabled) continue;
    const condSignature = JSON.stringify(policy.conditions || []);

    if (conditionMap.has(condSignature)) {
      const existing = conditionMap.get(condSignature);
      const existingHasFail = existing.actions.some(a => a.startsWith('FAIL'));
      const currentHasFail = policy.actions.some(a => a.startsWith('FAIL'));

      if (existingHasFail !== currentHasFail) {
        conflicts.push({
          policyA: { id: existing.id, name: existing.name, actions: existing.actions },
          policyB: { id: policy.id, name: policy.name, actions: policy.actions },
          reason: `Policy "${existing.name}" and "${policy.name}" have identical conditions but conflicting action severities (FAIL vs WARN).`,
          resolvedAction: existingHasFail ? existing.actions : policy.actions
        });
      }
    } else {
      conditionMap.set(condSignature, policy);
    }
  }

  return conflicts;
}

/**
 * Evaluates all applicable policies against a single finding or payload context.
 * 
 * @param {Object} payload - { finding, scan, repository, pr }
 * @param {Array<Object>} allPolicies - Available policies
 * @param {Object} [options]
 * @param {boolean} [options.isSimulation=false]
 * @param {boolean} [options.isDryRun=false]
 * @returns {Promise<Object>} Evaluation result
 */
export async function evaluateTargetPolicies(payload = {}, allPolicies = [], options = {}) {
  const { isSimulation = false, isDryRun = false } = options;

  const repoContext = {
    repositoryId: payload.repository?.id || payload.finding?.repositoryId,
    projectId: payload.repository?.projectId || payload.project?.id,
    organizationId: payload.repository?.organizationId || payload.organizationId
  };

  const effectivePolicies = resolveEffectivePolicies(allPolicies, repoContext);
  const conflicts = detectPolicyConflicts(effectivePolicies);

  const violations = [];
  const warnings = [];
  const evaluatedPolicies = [];

  let highestActionSeverity = 0;
  let hasBlockingFailure = false;

  for (const policy of effectivePolicies) {
    const evaluation = evaluatePolicyConditions(policy, payload);
    evaluatedPolicies.push({
      policyId: policy.id,
      policyName: policy.name,
      policyVersion: policy.version || 1,
      scope: policy.scope,
      matched: evaluation.matched,
      conditionEvaluations: evaluation.conditionEvaluations,
      explanation: evaluation.explanation,
      actions: policy.actions
    });

    if (evaluation.matched) {
      const isFail = policy.actions.some(a => a === PolicyAction.FAIL_CI || a === PolicyAction.FAIL_PR || a === PolicyAction.FAIL_SCAN);
      
      const violationRecord = {
        policyId: policy.id,
        policyName: policy.name,
        policyVersion: policy.version || 1,
        scope: policy.scope,
        scopeId: policy.scopeId,
        organizationId: repoContext.organizationId,
        projectId: repoContext.projectId,
        repositoryId: repoContext.repositoryId,
        repositoryName: payload.repository?.name || payload.finding?.repositoryName || 'unknown',
        findingId: payload.finding?.id,
        fingerprint: payload.finding?.fingerprint,
        ruleId: payload.finding?.ruleId || payload.finding?.type,
        severity: payload.finding?.severity || 'LOW',
        maskedValue: payload.finding?.maskedValue || '••••••••',
        branch: payload.scan?.branch || payload.pr?.branch || payload.finding?.branch || 'main',
        prNumber: payload.pr?.number,
        actions: policy.actions,
        explanation: evaluation.explanation,
        status: ViolationStatus.OPEN,
        createdAt: new Date().toISOString()
      };

      if (isFail) {
        hasBlockingFailure = true;
        violations.push(violationRecord);
      } else {
        warnings.push(violationRecord);
      }

      for (const act of policy.actions) {
        highestActionSeverity = Math.max(highestActionSeverity, ACTION_SEVERITY_ORDER[act] || 0);
      }

      // Dispatch actions if not a simulation
      await dispatchPolicyActions(policy.actions, {
        organizationId: repoContext.organizationId,
        policyName: policy.name,
        findingId: payload.finding?.id,
        repositoryName: violationRecord.repositoryName,
        severity: violationRecord.severity,
        explanation: evaluation.explanation,
        isSimulation: isSimulation || isDryRun
      });
    }
  }

  let result = PolicyResult.PASSED;
  if (hasBlockingFailure) {
    result = isDryRun ? PolicyResult.WARNING : PolicyResult.FAILED;
  } else if (warnings.length > 0) {
    result = PolicyResult.WARNING;
  }

  let summary = 'Policy evaluation passed with 0 violations.';
  if (violations.length > 0) {
    summary = `${violations.length} policy violation(s) detected: ${violations.map(v => v.policyName).join(', ')}`;
  } else if (warnings.length > 0) {
    summary = `${warnings.length} policy warning(s) detected: ${warnings.map(w => w.policyName).join(', ')}`;
  }

  return {
    passed: result === PolicyResult.PASSED || (isDryRun && result === PolicyResult.WARNING),
    result,
    isDryRun,
    isSimulation,
    violations,
    warnings,
    effectivePolicies: effectivePolicies.map(p => ({ id: p.id, name: p.name, scope: p.scope, version: p.version || 1 })),
    evaluatedPolicies,
    conflicts,
    evaluatedAt: new Date().toISOString(),
    summary
  };
}
