/**
 * lib/db/audit.js
 *
 * Security Audit Log subsystem.
 *
 * Tracks:
 *   - USER_LOGIN / USER_LOGOUT
 *   - REPOSITORY_CONNECTED / REPOSITORY_SCANNED
 *   - FINDING_STATUS_CHANGED / FINDING_BULK_UPDATED
 *   - RULE_CREATED / RULE_MODIFIED
 *   - BASELINE_CREATED
 *   - MEMBER_INVITED / MEMBER_ROLE_CHANGED / MEMBER_REMOVED
 *   - WEBHOOK_CREATED / WEBHOOK_TRIGGERED
 *
 * SECURITY INVARIANT:
 *   - NEVER logs passwords, session tokens, webhook secrets, or raw secrets.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function logAuditEvent({
  organizationId,
  userId,
  userEmail,
  action,
  targetType,
  targetId,
  metadata = {},
  ipAddress,
}) {
  if (!organizationId || !action) return null;
  const { client, isPostgres } = await getDb();

  // Sanitize metadata to strip any sensitive keys
  const safeMeta = {};
  const sensitivePattern = /secret|password|token|raw|hash|auth|cred|cookie|jwt/i;
  for (const [k, v] of Object.entries(metadata)) {
    if (!sensitivePattern.test(k)) {
      safeMeta[k] = v;
    }
  }

  const metadataJson = JSON.stringify(safeMeta);

  if (isPostgres) {
    return client.auditLog.create({
      data: {
        organizationId,
        userId: userId || null,
        userEmail: userEmail || null,
        action,
        targetType: targetType || 'System',
        targetId: targetId || null,
        metadataJson,
        ipAddress: ipAddress || null,
      },
    });
  }

  const log = {
    id: `audit_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    userId: userId || null,
    userEmail: userEmail || null,
    action,
    targetType: targetType || 'System',
    targetId: targetId || null,
    metadataJson,
    ipAddress: ipAddress || null,
    createdAt: new Date(),
  };
  memoryDb.auditLogs.unshift(log);
  return log;
}

export async function listAuditLogs(organizationId, { limit = 50, action, targetType } = {}) {
  if (!organizationId) return [];
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    const where = { organizationId };
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;

    return client.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  let logs = memoryDb.auditLogs.filter(l => l.organizationId === organizationId);
  if (action) logs = logs.filter(l => l.action === action);
  if (targetType) logs = logs.filter(l => l.targetType === targetType);
  return logs.slice(0, limit);
}
