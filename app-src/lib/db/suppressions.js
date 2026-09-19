/**
 * lib/db/suppressions.js
 *
 * False Positive Learning and Smart Ignore Persistence Layer.
 * Manages deterministic rule, fingerprint, file, and path suppressions without external AI.
 *
 * SECURITY:
 *   - Stores only fingerprints, rule IDs, and relative paths.
 *   - Raw secrets are never stored.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

// In-memory store for suppressions
const suppressionsStore = new Map();

/**
 * Add a new false positive or smart ignore suppression.
 *
 * @param {object} param0
 * @param {string} param0.organizationId
 * @param {string} [param0.projectId]
 * @param {'FINGERPRINT' | 'FILE' | 'PATH_PATTERN' | 'RULE' | 'OCCURRENCE'} param0.type
 * @param {string} param0.target - fingerprint, file path, glob, or ruleId
 * @param {string} [param0.reason='Marked as false positive / ignored']
 * @param {string} [param0.userEmail='User']
 * @returns {Promise<object>}
 */
export async function addSuppression({
  organizationId,
  projectId = null,
  type = 'FINGERPRINT',
  target,
  reason = 'Marked as false positive',
  userEmail = 'User',
}) {
  if (!target) throw new Error('Suppression target is required');

  const id = `sup_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const record = {
    id,
    organizationId,
    projectId,
    type,
    target,
    reason,
    userEmail,
    createdAt: new Date().toISOString(),
  };

  suppressionsStore.set(id, record);
  return record;
}

/**
 * List all active suppressions for an organization / project.
 *
 * @param {string} organizationId
 * @param {string} [projectId]
 * @returns {Promise<object[]>}
 */
export async function listSuppressions(organizationId, projectId = null) {
  let list = Array.from(suppressionsStore.values());
  if (organizationId) {
    list = list.filter(s => s.organizationId === organizationId);
  }
  if (projectId) {
    list = list.filter(s => !s.projectId || s.projectId === projectId);
  }
  return list;
}

/**
 * Delete a suppression (undo false-positive / ignore rule).
 *
 * @param {string} suppressionId
 * @returns {Promise<boolean>}
 */
export async function deleteSuppression(suppressionId) {
  return suppressionsStore.delete(suppressionId);
}

/**
 * Check if a finding matches any active suppression.
 *
 * @param {object} finding
 * @param {object[]} suppressions
 * @returns {boolean}
 */
export function checkFindingSuppressed(finding = {}, suppressions = []) {
  if (!finding || suppressions.length === 0) return false;

  for (const sup of suppressions) {
    if (sup.type === 'FINGERPRINT' && sup.target === finding.fingerprint) {
      return true;
    }
    if (sup.type === 'FILE' && sup.target === finding.file) {
      return true;
    }
    if (sup.type === 'RULE' && (sup.target === finding.ruleId || sup.target === finding.type)) {
      return true;
    }
    if (sup.type === 'PATH_PATTERN' && finding.file && finding.file.includes(sup.target)) {
      return true;
    }
  }

  return false;
}
