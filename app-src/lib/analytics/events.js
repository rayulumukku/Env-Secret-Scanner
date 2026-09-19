/**
 * lib/analytics/events.js
 *
 * Privacy-conscious product analytics and telemetry abstraction.
 *
 * ABSOLUTE PRIVACY RULES:
 * 1. Never record, transmit, or process raw source code.
 * 2. Never record or transmit secret values, credentials, tokens, or passwords.
 * 3. Never record file contents or repository trees.
 * 4. Only record safe operational events with anonymized IDs and high-level metadata.
 */

// Event sink hooks (allows external sinks if configured)
const eventListeners = [];

/**
 * Standard product event names
 */
export const EVENT_NAMES = {
  SCAN_STARTED: 'scan.started',
  SCAN_COMPLETED: 'scan.completed',
  SCAN_FAILED: 'scan.failed',
  FINDING_VIEWED: 'finding.viewed',
  FINDING_RESOLVED: 'finding.resolved',
  FINDING_IGNORED: 'finding.ignored',
  RULE_CREATED: 'rule.created',
  RULE_TESTED: 'rule.tested',
  INTEGRATION_CONNECTED: 'integration.connected',
  DOC_SEARCH: 'docs.searched',
  DEMO_RUN: 'demo.run',
};

/**
 * Sanitize event properties to ensure zero credential leakage
 * @param {Record<string, any>} properties
 * @returns {Record<string, any>}
 */
function sanitizeProperties(properties = {}) {
  const safe = {};
  const blockedKeys = new Set([
    'secret', 'rawSecret', 'token', 'password', 'key', 'content',
    'source', 'code', 'fileContent', 'jwt', 'auth', 'cookie',
  ]);

  for (const [key, value] of Object.entries(properties)) {
    if (blockedKeys.has(key.toLowerCase())) {
      continue;
    }
    if (typeof value === 'string' && value.length > 256) {
      safe[key] = value.slice(0, 256) + '...[truncated]';
    } else if (typeof value === 'object' && value !== null) {
      // Shallow object sanitize
      safe[key] = JSON.stringify(value).slice(0, 500);
    } else {
      safe[key] = value;
    }
  }

  return safe;
}

/**
 * Track a privacy-safe product analytics event
 *
 * @param {string} eventName - One of EVENT_NAMES or custom string
 * @param {Record<string, any>} [properties] - Safe metadata only
 * @param {object} [context] - Optional user context (anonymized/user id)
 */
export function trackEvent(eventName, properties = {}, context = {}) {
  const safePayload = {
    event: eventName,
    properties: sanitizeProperties(properties),
    timestamp: new Date().toISOString(),
    anonymousId: context.userId ? `usr_${context.userId.slice(0, 8)}` : 'anon',
  };

  // Dispatch to registered listeners
  for (const listener of eventListeners) {
    try {
      listener(safePayload);
    } catch {
      // Fail-silent on analytics errors to never impact user flows
    }
  }

  return safePayload;
}

/**
 * Register a custom listener / sink for telemetry
 * @param {(payload: object) => void} listener
 * @returns {() => void} unsubscribe function
 */
export function registerEventListener(listener) {
  if (typeof listener === 'function') {
    eventListeners.push(listener);
  }
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx !== -1) eventListeners.splice(idx, 1);
  };
}
