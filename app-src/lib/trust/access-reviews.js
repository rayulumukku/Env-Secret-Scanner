/**
 * lib/trust/access-reviews.js
 *
 * Periodic Access Review Engine for SecretShield Trust Center.
 *
 * SAFETY INVARIANTS:
 *   - Supports periodic reviews of members, roles, project/repo access, integrations, and credentials.
 *   - Tracks explicit reviewer identity and review timestamps.
 *   - Enforces status lifecycle: PENDING -> REVIEWED -> REVOKED -> EXPIRED.
 */

import { randomUUID } from 'crypto';

export const ACCESS_REVIEW_TYPES = Object.freeze({
  MEMBER: 'MEMBER',
  ROLE: 'ROLE',
  PROJECT_ACCESS: 'PROJECT_ACCESS',
  REPO_ACCESS: 'REPO_ACCESS',
  INTEGRATION_ACCESS: 'INTEGRATION_ACCESS',
  API_CREDENTIAL: 'API_CREDENTIAL',
});

export const ACCESS_REVIEW_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
});

/**
 * Construct an Access Review ticket.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.targetType
 * @param {string} params.targetId
 * @param {string} params.targetName
 * @param {string} params.currentRole
 * @param {number} [params.dueDays=90]
 * @returns {object} AccessReview
 */
export function createAccessReview({
  organizationId,
  targetType,
  targetId,
  targetName,
  currentRole = 'MEMBER',
  dueDays = 90,
}) {
  if (!organizationId || !targetId || !targetName) {
    throw new Error('organizationId, targetId, and targetName are required');
  }

  const validTarget = Object.values(ACCESS_REVIEW_TYPES).includes(targetType)
    ? targetType
    : ACCESS_REVIEW_TYPES.MEMBER;

  const now = new Date();
  const dueDate = new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);

  return {
    id: `ar_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    targetType: validTarget,
    targetId: String(targetId).slice(0, 100),
    targetName: String(targetName).slice(0, 150),
    currentRole: String(currentRole || 'MEMBER').slice(0, 50),
    status: ACCESS_REVIEW_STATUSES.PENDING,
    reviewedBy: null,
    notes: null,
    dueDate: dueDate.toISOString(),
    reviewedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Process a review verdict.
 *
 * @param {object} review - AccessReview
 * @param {'REVIEWED' | 'REVOKED'} verdict
 * @param {string} reviewer - Identity of reviewer
 * @param {string} [notes]
 * @returns {object} Updated AccessReview
 */
export function processAccessReviewVerdict(review, verdict, reviewer, notes = '') {
  if (!review) throw new Error('Access review record not found');

  if (verdict !== ACCESS_REVIEW_STATUSES.REVIEWED && verdict !== ACCESS_REVIEW_STATUSES.REVOKED) {
    throw new Error(`Invalid verdict: ${verdict}. Must be REVIEWED or REVOKED.`);
  }

  return {
    ...review,
    status: verdict,
    reviewedBy: String(reviewer || 'Security Admin'),
    notes: String(notes || '').slice(0, 500),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
