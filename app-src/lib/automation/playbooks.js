/**
 * lib/automation/playbooks.js
 *
 * Declarative Security Playbook Engine & Dry-Run Simulator for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Strictly data-driven declarative condition/action model.
 *   - Zero arbitrary code execution / no eval() / no Function constructor.
 *   - Simulation output is clearly marked as simulated.
 *   - Actions default to safe, non-destructive behaviors.
 */

import { randomUUID } from 'crypto';

export const PLAYBOOK_ACTION_TYPES = Object.freeze({
  CREATE_FINDING: 'CREATE_FINDING',
  CREATE_EXPOSURE_CLUSTER: 'CREATE_EXPOSURE_CLUSTER',
  NOTIFY_SECURITY_CHANNEL: 'NOTIFY_SECURITY_CHANNEL',
  NOTIFY_REPO_OWNER: 'NOTIFY_REPO_OWNER',
  CREATE_REMEDIATION_TASK: 'CREATE_REMEDIATION_TASK',
  BLOCK_CI: 'BLOCK_CI',
  FAIL_PR_CHECK: 'FAIL_PR_CHECK',
  CREATE_AUDIT_EVENT: 'CREATE_AUDIT_EVENT',
  REQUEST_MANUAL_REVIEW: 'REQUEST_MANUAL_REVIEW',
});

const SEVERITY_LEVELS = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * Validate a declarative condition against an event and context.
 *
 * @param {object} condition - { field, operator, value }
 * @param {object} event - SecurityEvent
 * @param {object} context - Repository/Environment context
 * @returns {{ matched: boolean, reason: string }}
 */
export function evaluateCondition(condition, event, context = {}) {
  if (!condition || !condition.field) {
    return { matched: false, reason: 'Invalid condition format' };
  }

  const { field, operator = 'equals', value } = condition;

  // Resolve target value safely
  let targetVal = null;
  switch (field) {
    case 'eventType':
      targetVal = event.eventType;
      break;
    case 'severity':
      targetVal = event.severity || 'INFO';
      break;
    case 'source':
      targetVal = event.source;
      break;
    case 'ruleCategory':
    case 'category':
      targetVal = event.category;
      break;
    case 'isProduction':
      targetVal = Boolean(context.isProduction || context.environment === 'production' || context.tags?.includes('production'));
      break;
    case 'repository':
    case 'repositoryName':
      targetVal = context.repositoryName || context.name || event.repositoryId;
      break;
    case 'branch':
      targetVal = context.branch || event.metadata?.branch;
      break;
    case 'hasPolicyViolation':
      targetVal = Boolean(event.metadata?.policyViolations?.length > 0 || event.eventType === 'POLICY_VIOLATION');
      break;
    case 'exposureDuration':
      targetVal = Number(event.metadata?.exposureDuration || 0);
      break;
    default:
      targetVal = event.metadata?.[field] ?? context[field];
  }

  // Pure declarative operators
  let matched = false;
  switch (operator) {
    case 'equals':
    case '==':
      matched = String(targetVal).toLowerCase() === String(value).toLowerCase();
      break;
    case 'not_equals':
    case '!=':
      matched = String(targetVal).toLowerCase() !== String(value).toLowerCase();
      break;
    case 'in':
      if (Array.isArray(value)) {
        matched = value.map(v => String(v).toLowerCase()).includes(String(targetVal).toLowerCase());
      } else {
        matched = false;
      }
      break;
    case 'not_in':
      if (Array.isArray(value)) {
        matched = !value.map(v => String(v).toLowerCase()).includes(String(targetVal).toLowerCase());
      } else {
        matched = true;
      }
      break;
    case 'gte':
    case '>=':
      if (field === 'severity') {
        const eventScore = SEVERITY_LEVELS[String(targetVal).toUpperCase()] ?? 0;
        const requiredScore = SEVERITY_LEVELS[String(value).toUpperCase()] ?? 0;
        matched = eventScore >= requiredScore;
      } else {
        matched = Number(targetVal) >= Number(value);
      }
      break;
    case 'gt':
    case '>':
      matched = Number(targetVal) > Number(value);
      break;
    case 'lte':
    case '<=':
      matched = Number(targetVal) <= Number(value);
      break;
    case 'lt':
    case '<':
      matched = Number(targetVal) < Number(value);
      break;
    case 'contains':
      matched = Array.isArray(targetVal)
        ? targetVal.includes(value)
        : String(targetVal || '').toLowerCase().includes(String(value).toLowerCase());
      break;
    case 'is_true':
      matched = Boolean(targetVal) === true;
      break;
    case 'is_false':
      matched = Boolean(targetVal) === false;
      break;
    default:
      matched = false;
  }

  return {
    matched,
    field,
    operator,
    expected: value,
    actual: targetVal,
    reason: matched
      ? `Condition matched: ${field} ${operator} ${JSON.stringify(value)}`
      : `Condition not met: actual value was ${JSON.stringify(targetVal)}`,
  };
}

/**
 * Evaluate a complete Playbook against a Security Event.
 *
 * @param {object} playbook - { id, name, conditions, actions, approvalRequired }
 * @param {object} event - SecurityEvent
 * @param {object} [context={}] - Environment / repository metadata
 * @returns {object} Execution evaluation result
 */
export function evaluatePlaybook(playbook, event, context = {}) {
  const conditions = Array.isArray(playbook.conditions)
    ? playbook.conditions
    : (typeof playbook.conditionsJson === 'string' ? JSON.parse(playbook.conditionsJson || '[]') : []);

  const actions = Array.isArray(playbook.actions)
    ? playbook.actions
    : (typeof playbook.actionsJson === 'string' ? JSON.parse(playbook.actionsJson || '[]') : []);

  const conditionResults = conditions.map(cond => evaluateCondition(cond, event, context));
  const allMatched = conditionResults.length === 0 || conditionResults.every(r => r.matched);

  if (!allMatched) {
    return {
      playbookId: playbook.id,
      playbookName: playbook.name,
      matched: false,
      conditionResults,
      actionsToExecute: [],
      status: 'NO_MATCH',
    };
  }

  return {
    playbookId: playbook.id,
    playbookName: playbook.name,
    matched: true,
    conditionResults,
    actionsToExecute: actions,
    approvalRequired: Boolean(playbook.approvalRequired),
    status: playbook.approvalRequired ? 'PENDING_APPROVAL' : 'MATCHED',
  };
}

/**
 * Dry-run simulator for playbooks.
 * Tests how playbooks evaluate against a synthetic or real event without taking any side effects.
 *
 * @param {object} event - SecurityEvent or synthetic event payload
 * @param {object[]} playbooks - Array of playbook definitions
 * @param {object} [context={}] - Context options
 * @returns {object} Simulation summary with explicit isSimulated: true
 */
export function simulatePlaybookRun(event, playbooks = [], context = {}) {
  const results = playbooks.map(pb => {
    const evalResult = evaluatePlaybook(pb, event, context);
    return {
      playbookId: pb.id,
      name: pb.name,
      matched: evalResult.matched,
      conditionEvaluations: evalResult.conditionResults,
      proposedActions: evalResult.actionsToExecute,
      approvalRequired: evalResult.approvalRequired,
      status: evalResult.status,
    };
  });

  const totalMatched = results.filter(r => r.matched).length;
  const proposedActionsCount = results.reduce((acc, r) => acc + (r.proposedActions?.length || 0), 0);

  return {
    isSimulated: true,
    simulatedAt: new Date().toISOString(),
    event: {
      eventType: event.eventType,
      source: event.source,
      severity: event.severity,
      repositoryId: event.repositoryId,
    },
    totalPlaybooksEvaluated: playbooks.length,
    totalPlaybooksMatched: totalMatched,
    totalProposedActions: proposedActionsCount,
    evaluations: results,
    notice: 'Simulated dry-run only. No real security actions, CI blocks, or notifications were executed.',
  };
}
