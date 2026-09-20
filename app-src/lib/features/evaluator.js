/**
 * lib/features/evaluator.js
 *
 * Server-side feature flag evaluator.
 */

import { getFeatureFlag } from './flags.js';

/**
 * Evaluate if a feature is enabled for a given context.
 *
 * @param {string} flagKey
 * @param {object} [context] - { userId, orgId }
 * @returns {boolean}
 */
export function isFeatureEnabled(flagKey, context = {}) {
  const flag = getFeatureFlag(flagKey);
  if (!flag) return false;
  if (!flag.enabled) return false;

  const { rolloutPercentage, allowedUsers, allowedOrgs } = flag.rules || {};

  // Check specific whitelist
  if (context.userId && Array.isArray(allowedUsers) && allowedUsers.includes(context.userId)) {
    return true;
  }
  if (context.orgId && Array.isArray(allowedOrgs) && allowedOrgs.includes(context.orgId)) {
    return true;
  }

  // Rollout percentage check
  if (typeof rolloutPercentage === 'number') {
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;

    // Deterministic hash based on entity ID
    const hashTarget = context.userId || context.orgId || 'anonymous';
    let hash = 0;
    for (let i = 0; i < hashTarget.length; i++) {
      hash = (hash << 5) - hash + hashTarget.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % 100;
    return bucket < rolloutPercentage;
  }

  return true;
}
