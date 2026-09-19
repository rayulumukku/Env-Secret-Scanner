/**
 * lib/db/activity.js
 *
 * Project security event timeline repository.
 */

import { getPrismaClient, isDatabaseAvailable } from './client.js';

const activityStore = [];

export const ActivityType = {
  REPOSITORY_CONNECTED: 'REPOSITORY_CONNECTED',
  REPOSITORY_DISCONNECTED: 'REPOSITORY_DISCONNECTED',
  SCAN_STARTED: 'SCAN_STARTED',
  SCAN_COMPLETED: 'SCAN_COMPLETED',
  CRITICAL_FINDING: 'CRITICAL_FINDING',
  FINDING_RESOLVED: 'FINDING_RESOLVED',
  PR_SCANNED: 'PR_SCANNED',
  WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED',
  CI_SCAN_FAILED: 'CI_SCAN_FAILED',
};

/**
 * Record a security activity event.
 *
 * @param {object} params
 */
export async function recordActivity({
  projectId,
  organizationId,
  type,
  title,
  description = null,
  actor = 'System',
  repositoryName = null,
  metadata = {},
}) {
  const event = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    projectId,
    organizationId,
    type,
    title,
    description,
    actor,
    repositoryName,
    metadata,
    createdAt: new Date().toISOString(),
  };

  activityStore.unshift(event);
  if (activityStore.length > 1000) {
    activityStore.pop();
  }

  // Also log to AuditLog if available
  if (isDatabaseAvailable()) {
    try {
      const prisma = await getPrismaClient();
      await prisma.auditLog.create({
        data: {
          organizationId: organizationId || 'default',
          action: type,
          targetType: 'ProjectActivity',
          targetId: projectId,
          userEmail: actor,
          metadataJson: JSON.stringify({ title, repositoryName, ...metadata }),
        },
      });
    } catch {
      // Fallback
    }
  }

  return event;
}

/**
 * Get activity timeline for a project.
 *
 * @param {string} projectId
 * @param {object} [options]
 */
export async function getProjectActivity(projectId, options = {}) {
  const { limit = 50, type = null } = options;
  let items = activityStore.filter(a => a.projectId === projectId);

  if (type) {
    items = items.filter(a => a.type === type);
  }

  return items.slice(0, limit);
}
