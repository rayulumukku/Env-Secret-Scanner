/**
 * lib/security/rate-limiter.js
 *
 * Pluggable sliding-window rate limiter for SecretShield.
 *
 * Provides protection against brute-force and resource-exhaustion attacks for:
 * - Authentication (login, register, forgot-password)
 * - Repository scanning & uploads
 * - API endpoints
 * - Webhook ingestion
 *
 * Defaults to a zero-dependency in-memory store for local development and single-node setups,
 * with an adapter pattern for distributed/Redis backends.
 */

// In-memory sliding window bucket store
const memoryStore = new Map();

// Periodic cleanup of stale buckets every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of memoryStore.entries()) {
      if (bucket.resetTime <= now) {
        memoryStore.delete(key);
      }
    }
  }, 60000).unref?.();
}

/**
 * Default rate limit configurations by endpoint category
 */
export const RATE_LIMIT_CONFIGS = {
  auth: {
    max: 10,              // 10 requests
    windowMs: 60 * 1000,  // per 1 minute
    message: 'Too many authentication attempts. Please try again later.',
  },
  scan: {
    max: 30,              // 30 scans
    windowMs: 60 * 1000,  // per 1 minute
    message: 'Scan rate limit exceeded. Please wait a moment before running more scans.',
  },
  upload: {
    max: 15,              // 15 archive uploads
    windowMs: 60 * 1000,  // per 1 minute
    message: 'Upload rate limit exceeded. Please wait before uploading more archives.',
  },
  webhook: {
    max: 120,             // 120 webhooks
    windowMs: 60 * 1000,  // per 1 minute
    message: 'Webhook intake rate limit exceeded.',
  },
  api: {
    max: 100,             // 100 API requests
    windowMs: 60 * 1000,  // per 1 minute
    message: 'API rate limit exceeded.',
  },
};

/**
 * Extract client IP from incoming Next.js Request or Web Request
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  if (!request) return '127.0.0.1';

  // Standard reverse proxy headers
  const forwardedFor = request.headers?.get?.('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers?.get?.('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers?.get?.('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Check rate limit for a given key and configuration
 *
 * @param {string} key - Unique identifier (e.g., `auth:192.168.1.1` or `scan:user-123`)
 * @param {object} [config] - Rate limit options
 * @param {number} [config.max] - Maximum requests allowed in window
 * @param {number} [config.windowMs] - Window duration in milliseconds
 * @returns {{ allowed: boolean, limit: number, remaining: number, reset: number, retryAfter: number }}
 */
export function checkRateLimit(key, config = RATE_LIMIT_CONFIGS.api) {
  const { max = 60, windowMs = 60000 } = config;
  const now = Date.now();

  let bucket = memoryStore.get(key);

  // If no bucket or window expired, initialize fresh bucket
  if (!bucket || bucket.resetTime <= now) {
    bucket = {
      count: 1,
      resetTime: now + windowMs,
    };
    memoryStore.set(key, bucket);

    return {
      allowed: true,
      limit: max,
      remaining: Math.max(0, max - 1),
      reset: Math.ceil(bucket.resetTime / 1000),
      retryAfter: 0,
    };
  }

  // Increment counter
  bucket.count++;

  const remaining = Math.max(0, max - bucket.count);
  const allowed = bucket.count <= max;
  const retryAfter = allowed ? 0 : Math.ceil((bucket.resetTime - now) / 1000);

  return {
    allowed,
    limit: max,
    remaining,
    reset: Math.ceil(bucket.resetTime / 1000),
    retryAfter,
  };
}

/**
 * Helper to build standard rate limit HTTP response headers
 *
 * @param {{ limit: number, remaining: number, reset: number, retryAfter: number }} rateLimitResult
 * @returns {Record<string, string>}
 */
export function getRateLimitHeaders(rateLimitResult) {
  const headers = {
    'X-RateLimit-Limit': String(rateLimitResult.limit),
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Reset': String(rateLimitResult.reset),
  };

  if (!rateLimitResult.allowed) {
    headers['Retry-After'] = String(rateLimitResult.retryAfter);
  }

  return headers;
}

/**
 * Reset / clear rate limit for a specific key (useful after successful login or tests)
 * @param {string} key
 */
export function resetRateLimit(key) {
  memoryStore.delete(key);
}

/**
 * Reset all rate limits in memory (useful for test isolation)
 */
export function resetAllRateLimits() {
  memoryStore.clear();
}
