/**
 * @file lib/policies/cache.js
 * @description Safe in-memory policy compilation cache.
 * 
 * SECURITY INVARIANT:
 *   - Never caches raw credentials or finding contents.
 *   - Only caches compiled policy rule definitions and scope mappings.
 */

class PolicyCache {
  constructor() {
    this.cache = new Map();
  }

  getCacheKey(organizationId, scope = 'ALL', scopeId = 'ALL') {
    return `${organizationId}:${scope}:${scopeId}`;
  }

  get(organizationId, scope, scopeId) {
    const key = this.getCacheKey(organizationId, scope, scopeId);
    return this.cache.get(key) || null;
  }

  set(organizationId, scope, scopeId, compiledPolicies) {
    const key = this.getCacheKey(organizationId, scope, scopeId);
    this.cache.set(key, {
      policies: compiledPolicies,
      timestamp: Date.now()
    });
  }

  invalidate(organizationId) {
    if (!organizationId) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${organizationId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

export const policyCache = new PolicyCache();
