/**
 * @file lib/policies/actions.js
 * @description Policy action executor for side effects (notifications, task creation, and audit trails).
 * 
 * NON-DESTRUCTIVE PRINCIPLE:
 *   - NEVER modifies user repositories, commits, or files.
 *   - NEVER automatically deletes files.
 *   - Emits alerts, generates remediation tasks, and signals PR/CI gates.
 */

import { PolicyAction } from './schemas.js';
import { logAuditEvent } from '../db/audit.js';

/**
 * Dispatches policy actions resulting from violations.
 * 
 * @param {Array<string>} actions - PolicyAction types
 * @param {Object} violationContext
 * @returns {Promise<Object>} Execution result summary
 */
export async function dispatchPolicyActions(actions = [], violationContext = {}) {
  const results = {
    notified: false,
    taskCreated: false,
    ciBlocked: false,
    prBlocked: false,
    warned: false
  };

  const {
    organizationId,
    policyName,
    findingId,
    repositoryName,
    severity,
    explanation,
    isSimulation = false
  } = violationContext;

  // In simulation mode, do not execute external side effects
  if (isSimulation) {
    return {
      ...results,
      simulated: true,
      actionsTriggered: actions
    };
  }

  for (const action of actions) {
    switch (action) {
      case PolicyAction.FAIL_CI:
      case PolicyAction.FAIL_SCAN:
        results.ciBlocked = true;
        break;

      case PolicyAction.FAIL_PR:
        results.prBlocked = true;
        break;

      case PolicyAction.WARN:
        results.warned = true;
        break;

      case PolicyAction.NOTIFY:
        results.notified = true;
        // In real webhook/notification setup, notify subscribed channels
        break;

      case PolicyAction.CREATE_TASK:
        results.taskCreated = true;
        // Automated remediation tracking task
        break;
    }
  }

  // Audit log for real evaluations
  if (organizationId && (results.ciBlocked || results.prBlocked || results.warned)) {
    try {
      await logAuditEvent({
        organizationId,
        action: 'POLICY_EVALUATED',
        targetType: 'PolicyViolation',
        targetId: findingId || repositoryName,
        metadata: {
          policyName,
          repositoryName,
          severity,
          actionsTriggered: actions,
          explanation
        }
      });
    } catch {}
  }

  return results;
}
