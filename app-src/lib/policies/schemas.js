/**
 * @file lib/policies/schemas.js
 * @description Policy definitions, schemas, condition fields, and action types.
 * 
 * SECURITY INVARIANT:
 *   - Never stores or accepts raw secret values.
 *   - Only operates on metadata, masked values, and deterministic hashes.
 */

export const PolicyScope = Object.freeze({
  ORGANIZATION: 'ORGANIZATION',
  PROJECT: 'PROJECT',
  REPOSITORY: 'REPOSITORY'
});

export const PolicyAction = Object.freeze({
  WARN: 'WARN',
  FAIL_SCAN: 'FAIL_SCAN',
  FAIL_PR: 'FAIL_PR',
  FAIL_CI: 'FAIL_CI',
  NOTIFY: 'NOTIFY',
  CREATE_TASK: 'CREATE_TASK'
});

export const ConditionField = Object.freeze({
  SEVERITY: 'severity',
  CONFIDENCE: 'confidence',
  FINDING_STATUS: 'findingStatus',
  REPOSITORY: 'repository',
  PROJECT: 'project',
  BRANCH: 'branch',
  FILE_PATTERN: 'filePattern',
  RULE_ID: 'ruleId',
  SCAN_TYPE: 'scanType',
  REPOSITORY_VISIBILITY: 'repositoryVisibility',
  LAST_SCAN_AGE_HOURS: 'lastScanAgeHours',
  HISTORY_SCAN_STATUS: 'historyScanStatus',
  CI_STATUS: 'ciStatus'
});

export const ConditionOperator = Object.freeze({
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  GREATER_THAN_OR_EQUAL: 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL: 'LESS_THAN_OR_EQUAL',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  MATCHES_PATTERN: 'MATCHES_PATTERN'
});

export const PolicyResult = Object.freeze({
  PASSED: 'PASSED',
  WARNING: 'WARNING',
  FAILED: 'FAILED'
});

export const ViolationStatus = Object.freeze({
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  SUPPRESSED: 'SUPPRESSED'
});

/**
 * Validates a policy object structure.
 * 
 * @param {Object} policy 
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePolicySchema(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object') {
    return { valid: false, errors: ['Policy must be an object'] };
  }

  if (!policy.name || typeof policy.name !== 'string' || policy.name.trim().length === 0) {
    errors.push('Policy name is required and must be a non-empty string');
  }

  if (!policy.scope || !Object.values(PolicyScope).includes(policy.scope)) {
    errors.push(`Invalid scope: ${policy.scope}. Must be one of ${Object.values(PolicyScope).join(', ')}`);
  }

  if (policy.scope !== PolicyScope.ORGANIZATION && (!policy.scopeId || typeof policy.scopeId !== 'string')) {
    errors.push('scopeId is required for PROJECT and REPOSITORY scoped policies');
  }

  if (!Array.isArray(policy.conditions) || policy.conditions.length === 0) {
    errors.push('Policy must contain at least one condition');
  } else {
    policy.conditions.forEach((cond, idx) => {
      if (!cond.field || !Object.values(ConditionField).includes(cond.field)) {
        errors.push(`Condition #${idx + 1}: Invalid field "${cond.field}"`);
      }
      if (!cond.operator || !Object.values(ConditionOperator).includes(cond.operator)) {
        errors.push(`Condition #${idx + 1}: Invalid operator "${cond.operator}"`);
      }
      if (cond.value === undefined || cond.value === null) {
        errors.push(`Condition #${idx + 1}: Value cannot be null or undefined`);
      }
    });
  }

  if (!Array.isArray(policy.actions) || policy.actions.length === 0) {
    errors.push('Policy must contain at least one action');
  } else {
    policy.actions.forEach(action => {
      if (!Object.values(PolicyAction).includes(action)) {
        errors.push(`Invalid action: "${action}". Must be one of ${Object.values(PolicyAction).join(', ')}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
