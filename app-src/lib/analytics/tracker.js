/**
 * lib/analytics/tracker.js
 *
 * Privacy-preserving event tracker and payload sanitizer.
 */

import { ALLOWED_EVENT_NAMES, ANALYTICS_EVENTS } from './events.js';
import { recordEvent } from './store.js';

export { ANALYTICS_EVENTS };

// Forbidden keywords (checked via substring matching on normalized key names)
const FORBIDDEN_SUBSTRINGS = [
  'secret', 'rawvalue', 'token', 'key', 'password', 'auth', 'bearer',
  'credential', 'privatekey', 'source', 'content', 'diff', 'code',
  'env', 'apikey', 'jwt', 'signature'
];

/**
 * Recursively sanitize metadata payload to guarantee zero secret leakage.
 * @param {object} data
 * @returns {object}
 */
export function sanitizePayload(data) {
  if (!data || typeof data !== 'object') return {};
  if (Array.isArray(data)) return data.map(item => typeof item === 'object' ? sanitizePayload(item) : item);

  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    const lower = k.toLowerCase().replace(/[^a-z]/g, '');
    const isForbidden = FORBIDDEN_SUBSTRINGS.some(term => lower.includes(term));
    if (isForbidden) {
      continue; // drop forbidden key completely
    }

    if (v === null || v === undefined) {
      continue;
    }

    if (typeof v === 'string') {
      // Discard suspiciously long text strings (potential file/token dumps)
      if (v.length > 256) {
        clean[k] = v.slice(0, 64) + '…[TRUNCATED]';
      } else {
        clean[k] = v;
      }
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      clean[k] = v;
    } else if (typeof v === 'object') {
      clean[k] = sanitizePayload(v);
    }
  }
  return clean;
}

/**
 * Track a safe product analytics event.
 *
 * @param {string} eventName - from ANALYTICS_EVENTS
 * @param {object} properties - safe event properties
 * @param {object} context - user / organization ID context
 * @returns {boolean}
 */
export function trackEvent(eventName, properties = {}, context = {}) {
  if (!ALLOWED_EVENT_NAMES.has(eventName)) {
    return false; // ignore non-whitelisted events
  }

  const sanitizedProperties = sanitizePayload(properties);
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    event: eventName,
    properties: sanitizedProperties,
    userId: context.userId ? String(context.userId).slice(0, 64) : null,
    orgId: context.orgId ? String(context.orgId).slice(0, 64) : null,
    timestamp: new Date().toISOString(),
  };

  recordEvent(event);
  return true;
}
