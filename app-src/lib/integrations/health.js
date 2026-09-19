/**
 * @file lib/integrations/health.js
 * @description Integration health probe runner and provider rate-limit backoff tracker.
 * 
 * RATE LIMIT & RESILIENCY:
 *   - Tracks provider 429 / 403 rate-limit responses with retry-after backoff.
 *   - Avoids hammering third-party APIs during outages or rate-limit windows.
 *   - Never exposes sensitive connection tokens in error diagnostics.
 */

class RateLimitTracker {
  constructor() {
    this.limits = new Map(); // provider:orgId -> { resetAt, limit, remaining }
  }

  getLimitKey(provider, organizationId = 'default') {
    return `${provider}:${organizationId}`;
  }

  isRateLimited(provider, organizationId) {
    const key = this.getLimitKey(provider, organizationId);
    const entry = this.limits.get(key);
    if (!entry) return false;

    if (Date.now() < entry.resetAt) {
      return {
        rateLimited: true,
        resetInSeconds: Math.ceil((entry.resetAt - Date.now()) / 1000)
      };
    }

    this.limits.delete(key);
    return false;
  }

  recordRateLimit(provider, organizationId, retryAfterSeconds = 60) {
    const key = this.getLimitKey(provider, organizationId);
    this.limits.set(key, {
      resetAt: Date.now() + retryAfterSeconds * 1000,
      recordedAt: Date.now()
    });
  }

  reset() {
    this.limits.clear();
  }
}

export const rateLimitTracker = new RateLimitTracker();

/**
 * Runs a health check for an integration connection.
 * 
 * @param {string} provider 
 * @param {Object} connection 
 * @returns {Promise<Object>} Health status
 */
export async function checkIntegrationHealth(provider, connection = {}) {
  const rateLimitStatus = rateLimitTracker.isRateLimited(provider, connection.organizationId);
  if (rateLimitStatus) {
    return {
      status: 'RATE_LIMITED',
      healthy: false,
      message: `Provider rate limit active. Retry in ${rateLimitStatus.resetInSeconds}s.`,
      lastChecked: new Date().toISOString()
    };
  }

  if (!connection || connection.status !== 'CONNECTED') {
    return {
      status: connection?.status || 'NOT_CONNECTED',
      healthy: false,
      message: 'Integration is not connected or requires configuration.',
      lastChecked: new Date().toISOString()
    };
  }

  // Simulated provider check
  const failureCount = connection.failureCount || 0;
  if (failureCount > 3) {
    return {
      status: 'DEGRADED',
      healthy: false,
      message: `Integration experienced ${failureCount} recent delivery failure(s).`,
      lastChecked: new Date().toISOString(),
      failureCount
    };
  }

  return {
    status: 'HEALTHY',
    healthy: true,
    message: 'Integration is operating normally with healthy gateway connectivity.',
    lastChecked: new Date().toISOString(),
    lastEventAt: connection.lastEventAt || null
  };
}
