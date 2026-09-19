/**
 * lib/auth/rate-limit.js
 *
 * Sliding-window rate limiter for sensitive authentication and API endpoints.
 */

const tracker = new Map();

/**
 * Check if an IP/key exceeds rate limit.
 * @param {string} key - e.g. "login:127.0.0.1"
 * @param {number} maxAttempts - maximum allowed requests
 * @param {number} windowMs - time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
 */
export function checkRateLimit(key, maxAttempts = 10, windowMs = 5 * 60 * 1000) {
  const now = Date.now();
  let record = tracker.get(key);

  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    tracker.set(key, record);
    return { allowed: true, remaining: maxAttempts - 1, resetMs: windowMs };
  }

  if (record.count >= maxAttempts) {
    const resetMs = Math.max(0, windowMs - (now - record.startTime));
    return { allowed: false, remaining: 0, resetMs };
  }

  record.count += 1;
  tracker.set(key, record);
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetMs: windowMs - (now - record.startTime),
  };
}
