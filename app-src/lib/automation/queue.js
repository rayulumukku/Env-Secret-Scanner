/**
 * lib/automation/queue.js
 *
 * Resilient Automation Action Queue & Job State Manager for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Fail-closed: if policy evaluation or action execution fails, never assume approval.
 *   - Implements exponential backoff for transient failures (max 3 retries).
 *   - Scoped strictly to organization tenant.
 */

import { randomUUID } from 'crypto';

export const JOB_STATUS = Object.freeze({
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
});

/**
 * Calculate exponential backoff delay in milliseconds.
 *
 * @param {number} retryCount
 * @param {number} [baseDelayMs=1000]
 * @param {number} [maxDelayMs=30000]
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoff(retryCount, baseDelayMs = 1000, maxDelayMs = 30000) {
  const delay = baseDelayMs * Math.pow(2, retryCount);
  return Math.min(delay, maxDelayMs);
}

/**
 * Create a new Automation Action record.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.actionType
 * @param {string} [params.policyId]
 * @param {string} [params.playbookId]
 * @param {string} [params.triggeringEventId]
 * @param {string} [params.targetResource]
 * @param {boolean} [params.requiresApproval=false]
 * @returns {object} AutomationAction
 */
export function createAutomationAction({
  organizationId,
  actionType,
  policyId = null,
  playbookId = null,
  triggeringEventId = null,
  targetResource = null,
  requiresApproval = false,
}) {
  if (!organizationId || !actionType) {
    throw new Error('organizationId and actionType are required');
  }

  return {
    id: `act_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    policyId,
    playbookId,
    triggeringEventId,
    actionType,
    targetResource,
    status: requiresApproval ? 'PENDING_APPROVAL' : JOB_STATUS.QUEUED,
    retryCount: 0,
    maxRetries: 3,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    executedAt: null,
  };
}

/**
 * Execute an automation action handler safely with fail-closed protection.
 *
 * @param {object} action - AutomationAction
 * @param {Function} handler - Async handler function
 * @returns {Promise<object>} Updated action result
 */
export async function executeAutomationAction(action, handler) {
  if (action.status === 'PENDING_APPROVAL') {
    return action; // Cannot execute without approval
  }

  action.status = JOB_STATUS.RUNNING;
  action.executedAt = new Date().toISOString();

  try {
    const result = await handler(action);
    action.status = JOB_STATUS.COMPLETED;
    action.result = result || { message: 'Action executed successfully' };
    action.error = null;
  } catch (err) {
    action.retryCount += 1;
    if (action.retryCount >= action.maxRetries) {
      action.status = JOB_STATUS.FAILED;
      action.error = err.message || 'Execution failed';
    } else {
      action.status = JOB_STATUS.QUEUED; // Re-queue for retry
      action.error = `Temporary failure (retry ${action.retryCount}/${action.maxRetries}): ${err.message}`;
    }
  }

  return action;
}
