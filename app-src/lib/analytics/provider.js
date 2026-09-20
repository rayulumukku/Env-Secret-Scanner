/**
 * lib/analytics/provider.js
 *
 * Pluggable telemetry provider interface for SecretShield.
 * Defaults to internal memory/DB sink with zero 3rd-party network calls.
 */

import { trackEvent } from './tracker.js';

export const AnalyticsProvider = {
  name: 'Internal (Privacy-First)',
  track(eventName, properties = {}, context = {}) {
    return trackEvent(eventName, properties, context);
  }
};
