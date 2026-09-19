/**
 * @file lib/db/policies.js
 * @description Database access layer for Policies, Policy Versions, and Policy Violations.
 * 
 * SECURITY INVARIANT:
 *   - Organization and project isolation is strictly enforced.
 *   - Never stores raw credentials.
 *   - Full version snapshot preserved upon every policy modification.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';
import { policyCache } from '../policies/cache.js';
import { logAuditEvent } from './audit.js';
import { RECOMMENDED_POLICIES } from '../policies/defaults.js';
import { validatePolicySchema, PolicyScope, ViolationStatus } from '../policies/schemas.js';

// Pre-populate recommended default policies in memory store if empty
function initializeDefaultPolicies(orgId) {
  for (const p of RECOMMENDED_POLICIES) {
    const policyId = `pol_${p.id}_${orgId}`;
    if (!memoryDb.policies.has(policyId)) {
      memoryDb.policies.set(policyId, {
        ...p,
        id: policyId,
        organizationId: orgId,
        version: 1,
        versionHistory: [
          {
            version: 1,
            createdAt: new Date().toISOString(),
            createdBy: 'system',
            changes: 'Initial recommended preset'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
}

/**
 * Creates a new policy with version tracking and audit logging.
 */
export async function createPolicy(data, userContext = {}) {
  const validation = validatePolicySchema(data);
  if (!validation.valid) {
    throw new Error(`Policy validation error: ${validation.errors.join(', ')}`);
  }

  const { organizationId, userId, userEmail } = userContext;
  const policyId = data.id || `pol_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  const policyRecord = {
    id: policyId,
    organizationId: organizationId || data.organizationId,
    name: data.name.trim(),
    description: data.description || '',
    scope: data.scope || PolicyScope.ORGANIZATION,
    scopeId: data.scopeId || null,
    conditions: data.conditions || [],
    actions: data.actions || [],
    enabled: data.enabled ?? true,
    isDefault: false,
    version: 1,
    versionHistory: [
      {
        version: 1,
        createdAt: now,
        createdBy: userEmail || userId || 'admin',
        changes: 'Initial policy creation'
      }
    ],
    createdAt: now,
    updatedAt: now,
    createdBy: userEmail || userId || 'admin'
  };

  memoryDb.policies.set(policyId, policyRecord);
  policyCache.invalidate(policyRecord.organizationId);

  await logAuditEvent({
    organizationId: policyRecord.organizationId,
    userId,
    userEmail,
    action: 'POLICY_CREATED',
    targetType: 'Policy',
    targetId: policyId,
    metadata: {
      name: policyRecord.name,
      scope: policyRecord.scope,
      actions: policyRecord.actions
    }
  });

  return policyRecord;
}

/**
 * Retrieves a policy by ID, ensuring organization access.
 */
export async function getPolicyById(policyId, organizationId) {
  if (!policyId) return null;
  if (organizationId) initializeDefaultPolicies(organizationId);

  const policy = memoryDb.policies.get(policyId);
  if (!policy) return null;
  if (organizationId && policy.organizationId !== organizationId) return null;

  return policy;
}

/**
 * Updates an existing policy, creating an immutable version snapshot.
 */
export async function updatePolicy(policyId, updates, userContext = {}) {
  const existing = memoryDb.policies.get(policyId);
  if (!existing) {
    throw new Error('Policy not found');
  }

  const { organizationId, userId, userEmail } = userContext;
  if (organizationId && existing.organizationId !== organizationId) {
    throw new Error('Unauthorized to modify this policy');
  }

  const newVersion = (existing.version || 1) + 1;
  const now = new Date().toISOString();
  const changeSummary = updates.changeSummary || `Updated policy settings (v${newVersion})`;

  const updatedRecord = {
    ...existing,
    ...updates,
    id: policyId,
    organizationId: existing.organizationId,
    version: newVersion,
    versionHistory: [
      ...(existing.versionHistory || []),
      {
        version: newVersion,
        createdAt: now,
        createdBy: userEmail || userId || 'admin',
        changes: changeSummary,
        previousSnapshot: {
          name: existing.name,
          conditions: existing.conditions,
          actions: existing.actions,
          enabled: existing.enabled
        }
      }
    ],
    updatedAt: now
  };

  memoryDb.policies.set(policyId, updatedRecord);
  policyCache.invalidate(existing.organizationId);

  const auditAction = updates.enabled !== undefined && updates.enabled !== existing.enabled
    ? (updates.enabled ? 'POLICY_ENABLED' : 'POLICY_DISABLED')
    : 'POLICY_UPDATED';

  await logAuditEvent({
    organizationId: existing.organizationId,
    userId,
    userEmail,
    action: auditAction,
    targetType: 'Policy',
    targetId: policyId,
    metadata: {
      version: newVersion,
      name: updatedRecord.name,
      enabled: updatedRecord.enabled
    }
  });

  return updatedRecord;
}

/**
 * Deletes a policy and logs the audit event.
 */
export async function deletePolicy(policyId, userContext = {}) {
  const existing = memoryDb.policies.get(policyId);
  if (!existing) return false;

  const { organizationId, userId, userEmail } = userContext;
  if (organizationId && existing.organizationId !== organizationId) {
    throw new Error('Unauthorized to delete this policy');
  }

  memoryDb.policies.delete(policyId);
  policyCache.invalidate(existing.organizationId);

  await logAuditEvent({
    organizationId: existing.organizationId,
    userId,
    userEmail,
    action: 'POLICY_DELETED',
    targetType: 'Policy',
    targetId: policyId,
    metadata: { name: existing.name }
  });

  return true;
}

/**
 * Lists policies for an organization with optional scope filters.
 */
export async function listPolicies(organizationId, filters = {}) {
  if (!organizationId) return [];
  initializeDefaultPolicies(organizationId);

  let policies = Array.from(memoryDb.policies.values()).filter(
    p => p.organizationId === organizationId
  );

  if (filters.scope) {
    policies = policies.filter(p => p.scope === filters.scope);
  }
  if (filters.scopeId) {
    policies = policies.filter(p => p.scopeId === filters.scopeId);
  }
  if (filters.enabled !== undefined) {
    const isEnabled = String(filters.enabled) === 'true';
    policies = policies.filter(p => p.enabled === isEnabled);
  }

  return policies;
}

/**
 * Records a policy violation event.
 */
export async function recordPolicyViolation(violation) {
  const violationRecord = {
    id: violation.id || `viol_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    ...violation,
    status: violation.status || ViolationStatus.OPEN,
    createdAt: violation.createdAt || new Date().toISOString()
  };

  memoryDb.policyViolations.unshift(violationRecord);
  return violationRecord;
}

/**
 * Lists policy violations with filters (Policy, Repository, Severity, Status, Date).
 */
export async function listPolicyViolations(organizationId, filters = {}) {
  if (!organizationId) return [];

  let list = (memoryDb.policyViolations || []).filter(v => v.organizationId === organizationId);

  if (filters.policyId && filters.policyId !== 'ALL') {
    list = list.filter(v => v.policyId === filters.policyId);
  }
  if (filters.repositoryId && filters.repositoryId !== 'ALL') {
    list = list.filter(v => v.repositoryId === filters.repositoryId || v.repositoryName === filters.repositoryId);
  }
  if (filters.severity && filters.severity !== 'ALL') {
    list = list.filter(v => v.severity === filters.severity);
  }
  if (filters.status && filters.status !== 'ALL') {
    list = list.filter(v => v.status === filters.status);
  }

  return list;
}

/**
 * Resolves a policy violation with resolution reason and audit trail.
 */
export async function resolvePolicyViolation(violationId, resolutionData = {}, userContext = {}) {
  const violation = (memoryDb.policyViolations || []).find(v => v.id === violationId);
  if (!violation) {
    throw new Error('Policy violation not found');
  }

  const { organizationId, userId, userEmail } = userContext;
  if (organizationId && violation.organizationId !== organizationId) {
    throw new Error('Unauthorized to resolve this violation');
  }

  violation.status = ViolationStatus.RESOLVED;
  violation.resolvedAt = new Date().toISOString();
  violation.resolvedBy = userEmail || userId || 'security-team';
  violation.resolutionReason = resolutionData.reason || 'Manual review and approved waiver';

  await logAuditEvent({
    organizationId: violation.organizationId,
    userId,
    userEmail,
    action: 'POLICY_VIOLATION_RESOLVED',
    targetType: 'PolicyViolation',
    targetId: violationId,
    metadata: {
      policyName: violation.policyName,
      repositoryName: violation.repositoryName,
      reason: violation.resolutionReason
    }
  });

  return violation;
}
