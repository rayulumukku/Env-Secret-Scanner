import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  resetRateLimit,
  resetAllRateLimits,
  RATE_LIMIT_CONFIGS,
} from '../rate-limiter.js';

describe('Rate Limiter Module', () => {
  beforeEach(() => {
    resetAllRateLimits();
  });

  test('allows requests within limit', () => {
    const key = 'test-user-1';
    const config = { max: 3, windowMs: 10000 };

    const r1 = checkRateLimit(key, config);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    const r2 = checkRateLimit(key, config);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    const r3 = checkRateLimit(key, config);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);
  });

  test('blocks requests exceeding limit and provides retryAfter', () => {
    const key = 'test-user-2';
    const config = { max: 2, windowMs: 5000 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const r3 = checkRateLimit(key, config);
    assert.equal(r3.allowed, false);
    assert.equal(r3.remaining, 0);
    assert.ok(r3.retryAfter > 0);

    const headers = getRateLimitHeaders(r3);
    assert.equal(headers['X-RateLimit-Limit'], '2');
    assert.equal(headers['X-RateLimit-Remaining'], '0');
    assert.ok(headers['Retry-After']);
  });

  test('extracts client IP from standard headers', () => {
    const req1 = { headers: new Map([['x-forwarded-for', '203.0.113.195, 70.41.3.18']]) };
    req1.headers.get = (k) => (k === 'x-forwarded-for' ? '203.0.113.195, 70.41.3.18' : null);

    const ip = getClientIp(req1);
    assert.equal(ip, '203.0.113.195');

    const req2 = { headers: { get: () => null } };
    assert.equal(getClientIp(req2), '127.0.0.1');
  });
});
