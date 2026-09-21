/**
 * lib/automation/health.js
 *
 * Automation Operational Health & Reliability Metrics Engine for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Only displays factual diagnostic numbers.
 *   - Zero raw secrets or sensitive tokens in error logs.
 */

// In-memory operational metrics counters
let metricsStore = {
  eventsReceived: 0,
  eventsProcessed: 0,
  processingFailures: 0,
  totalProcessingTimeMs: 0,
  queuedJobs: 0,
  retriedActions: 0,
  webhookFailures: 0,
  scheduledScanFailures: 0,
  notificationFailures: 0,
  recentErrors: [],
};

/**
 * Record an event processing operation.
 *
 * @param {number} durationMs
 * @param {boolean} [success=true]
 * @param {string} [error]
 */
export function recordEventMetric(durationMs, success = true, error = null) {
  metricsStore.eventsReceived += 1;
  if (success) {
    metricsStore.eventsProcessed += 1;
    metricsStore.totalProcessingTimeMs += Math.max(0, durationMs);
  } else {
    metricsStore.processingFailures += 1;
    if (error) {
      metricsStore.recentErrors.unshift({
        timestamp: new Date().toISOString(),
        message: String(error).slice(0, 300),
      });
      if (metricsStore.recentErrors.length > 20) {
        metricsStore.recentErrors.pop();
      }
    }
  }
}

/**
 * Record a webhook failure.
 */
export function recordWebhookFailure(err) {
  metricsStore.webhookFailures += 1;
  metricsStore.recentErrors.unshift({
    timestamp: new Date().toISOString(),
    message: `Webhook failure: ${String(err?.message || err).slice(0, 200)}`,
  });
  if (metricsStore.recentErrors.length > 20) metricsStore.recentErrors.pop();
}

/**
 * Get aggregated automation health snapshot.
 *
 * @returns {object}
 */
export function getAutomationHealthMetrics() {
  const avgDurationMs = metricsStore.eventsProcessed > 0
    ? Math.round(metricsStore.totalProcessingTimeMs / metricsStore.eventsProcessed)
    : 0;

  const successRate = metricsStore.eventsReceived > 0
    ? Math.round((metricsStore.eventsProcessed / metricsStore.eventsReceived) * 100)
    : 100;

  return {
    status: metricsStore.processingFailures > 10 ? 'DEGRADED' : 'HEALTHY',
    eventsReceived: metricsStore.eventsReceived,
    eventsProcessed: metricsStore.eventsProcessed,
    processingFailures: metricsStore.processingFailures,
    successRatePercent: successRate,
    averageProcessingDurationMs: avgDurationMs,
    queuedJobs: metricsStore.queuedJobs,
    retriedActions: metricsStore.retriedActions,
    webhookFailures: metricsStore.webhookFailures,
    scheduledScanFailures: metricsStore.scheduledScanFailures,
    notificationFailures: metricsStore.notificationFailures,
    recentErrors: metricsStore.recentErrors,
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Reset health metrics (useful for testing).
 */
export function resetHealthMetrics() {
  metricsStore = {
    eventsReceived: 0,
    eventsProcessed: 0,
    processingFailures: 0,
    totalProcessingTimeMs: 0,
    queuedJobs: 0,
    retriedActions: 0,
    webhookFailures: 0,
    scheduledScanFailures: 0,
    notificationFailures: 0,
    recentErrors: [],
  };
}
