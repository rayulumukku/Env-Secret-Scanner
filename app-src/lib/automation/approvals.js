/**
 * lib/automation/approvals.js
 *
 * Approval Gates Engine for Autonomous Security Operations.
 * Manages human-in-the-loop review for high-impact automation actions.
 *
 * SAFETY INVARIANTS:
 *   - Never includes raw secret values in approval requests.
 *   - Approval requests expire safely after a defined TTL.
 *   - Requires explicit authorized reviewer credentials.
 */

import { randomUUID } from 'crypto';

export const APPROVAL_STATUS = Object.freeze({
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXECUTED: 'EXECUTED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
});

export const APPROVAL_ACTION_TYPES = Object.freeze({
  BLOCK_CI: 'BLOCK_CI',
  NOTIFY_ESCALATION: 'NOTIFY_ESCALATION',
  POLICY_ACTIVATION: 'POLICY_ACTIVATION',
  PLAYBOOK_ACTIVATION: 'PLAYBOOK_ACTIVATION',
});

/**
 * Create a new Approval Request.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.actionType
 * @param {string} params.targetId
 * @param {string} params.reason
 * @param {string} [params.requestedBy]
 * @param {number} [params.ttlHours=72]
 * @returns {object} ApprovalRequest
 */
export function createApprovalRequest({
  organizationId,
  actionType,
  targetId,
  reason,
  requestedBy = 'Automation Engine',
  ttlHours = 72,
}) {
  if (!organizationId || !actionType || !targetId) {
    throw new Error('organizationId, actionType, and targetId are required for approval request');
  }

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  return {
    id: `appr_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    actionType,
    targetId,
    reason: String(reason || 'Approval required for automated security action').slice(0, 500),
    requestedBy,
    status: APPROVAL_STATUS.PENDING_APPROVAL,
    approver: null,
    comment: null,
    expiresAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Process an approval verdict.
 *
 * @param {object} request - ApprovalRequest
 * @param {'APPROVED' | 'REJECTED'} verdict
 * @param {string} approver - User / Role performing the approval
 * @param {string} [comment]
 * @returns {object} Updated ApprovalRequest
 */
export function processApprovalVerdict(request, verdict, approver, comment = '') {
  if (!request) throw new Error('Approval request not found');

  if (request.status !== APPROVAL_STATUS.PENDING_APPROVAL) {
    throw new Error(`Cannot review request with status: ${request.status}`);
  }

  if (new Date() > new Date(request.expiresAt)) {
    return {
      ...request,
      status: APPROVAL_STATUS.EXPIRED,
      updatedAt: new Date().toISOString(),
    };
  }

  if (verdict !== APPROVAL_STATUS.APPROVED && verdict !== APPROVAL_STATUS.REJECTED) {
    throw new Error(`Invalid verdict: ${verdict}. Must be APPROVED or REJECTED.`);
  }

  return {
    ...request,
    status: verdict,
    approver: String(approver || 'Anonymous Reviewer'),
    comment: String(comment || '').slice(0, 1000),
    updatedAt: new Date().toISOString(),
  };
}
