/**
 * lib/billing/limits.js
 *
 * Resource quota validation and boundary checks.
 * Prepared for future plan enforcement without blocking current developer functionality.
 */

import { getPlan } from './plans.js';

/**
 * Check if an organization is within its quota for a specific metric
 *
 * @param {object} params
 * @param {string} params.planId - e.g. 'free', 'team', 'enterprise'
 * @param {string} params.metric - e.g. 'maxRepositories', 'maxProjects', 'maxMembers'
 * @param {number} params.currentUsage - Current active count
 * @returns {{ withinQuota: boolean, limit: number, usage: number, percentage: number, unlimited?: boolean }}
 */
export function checkResourceQuota({ planId = 'free', metric, currentUsage = 0 }) {
  const plan = getPlan(planId);
  const limit = plan.limits[metric];

  // -1 indicates unlimited
  if (limit === -1 || limit === undefined) {
    return {
      withinQuota: true,
      limit: -1,
      usage: currentUsage,
      percentage: 0,
      unlimited: true,
    };
  }

  const withinQuota = currentUsage < limit;
  const percentage = Math.min(100, Math.round((currentUsage / limit) * 100));

  return {
    withinQuota,
    limit,
    usage: currentUsage,
    percentage,
    unlimited: false,
  };
}

/**
 * Get comprehensive quota status for an organization
 *
 * @param {string} planId
 * @param {object} usageMap - { repositories: 3, projects: 2, members: 1, scansThisMonth: 45 }
 * @returns {object}
 */
export function getOrganizationQuotaSummary(planId = 'free', usageMap = {}) {
  const plan = getPlan(planId);

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      badge: plan.badge,
    },
    metrics: {
      repositories: checkResourceQuota({ planId, metric: 'maxRepositories', currentUsage: usageMap.repositories || 0 }),
      projects: checkResourceQuota({ planId, metric: 'maxProjects', currentUsage: usageMap.projects || 0 }),
      members: checkResourceQuota({ planId, metric: 'maxMembers', currentUsage: usageMap.members || 0 }),
      scans: checkResourceQuota({ planId, metric: 'maxScansPerMonth', currentUsage: usageMap.scansThisMonth || 0 }),
    },
  };
}
