/**
 * lib/observability/request-id.js
 *
 * Distributed Request Correlation ID Utility.
 *
 * Propagates correlation IDs across:
 *   - HTTP API Requests & Responses
 *   - Background Scanner Jobs
 *   - Webhook Ingestion & Delivery
 *   - Database Audit Logs
 *   - Structured Logs
 */

import { randomBytes } from 'crypto';

/**
 * Generate a new unique request ID.
 * Example: req_1726839120123_a1b2c3d4
 *
 * @returns {string}
 */
export function generateRequestId() {
  const ts = Date.now();
  const rand = randomBytes(4).toString('hex');
  return `req_${ts}_${rand}`;
}

/**
 * Extract an existing request ID from headers or generate a new one.
 *
 * @param {Request|Headers|object} [requestOrHeaders]
 * @returns {string}
 */
export function getOrCreateRequestId(requestOrHeaders) {
  if (!requestOrHeaders) {
    return generateRequestId();
  }

  let id = null;

  if (typeof requestOrHeaders.headers?.get === 'function') {
    id = requestOrHeaders.headers.get('x-request-id') || requestOrHeaders.headers.get('x-correlation-id');
  } else if (typeof requestOrHeaders.get === 'function') {
    id = requestOrHeaders.get('x-request-id') || requestOrHeaders.get('x-correlation-id');
  } else if (typeof requestOrHeaders === 'object') {
    id = requestOrHeaders['x-request-id'] || requestOrHeaders['x-correlation-id'] || requestOrHeaders.requestId;
  }

  return (id && typeof id === 'string' && id.trim()) ? id.trim() : generateRequestId();
}

/**
 * Attach request ID to response headers.
 *
 * @param {Headers|object} headers
 * @param {string} requestId
 * @returns {object}
 */
export function withRequestIdHeader(headers = {}, requestId) {
  const id = requestId || generateRequestId();
  if (typeof headers.set === 'function') {
    headers.set('x-request-id', id);
    return headers;
  }
  return {
    ...headers,
    'x-request-id': id,
  };
}
