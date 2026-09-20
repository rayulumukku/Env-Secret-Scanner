/**
 * lib/analytics/store.js
 *
 * In-memory analytics event store & aggregation computations.
 */

import { ANALYTICS_EVENTS } from './events.js';

const _events = [];

export function recordEvent(event) {
  _events.push(event);
  // Cap history at 50,000 events to manage memory
  if (_events.length > 50000) {
    _events.splice(0, 5000);
  }
}

export function getAllEvents(days = 30) {
  const cutoff = Date.now() - days * 86400000;
  return _events.filter(e => new Date(e.timestamp).getTime() >= cutoff);
}

/**
 * Get aggregate metrics for admin dashboard.
 * @param {number} days - 7, 30, or 90
 */
export function getAggregateMetrics(days = 30) {
  const events = getAllEvents(days);

  const metrics = {
    newUsers: new Set(),
    activeOrgs: new Set(),
    projectsCreated: 0,
    repositoriesConnected: 0,
    scansCompleted: 0,
    findingsDetected: 0,
    findingsResolved: 0,
    documentationViews: 0,
    days,
    totalEvents: events.length,
  };

  for (const e of events) {
    if (e.userId) metrics.newUsers.add(e.userId);
    if (e.orgId) metrics.activeOrgs.add(e.orgId);

    switch (e.event) {
      case ANALYTICS_EVENTS.PROJECT_CREATED:
        metrics.projectsCreated++;
        break;
      case ANALYTICS_EVENTS.REPOSITORY_CONNECTED:
        metrics.repositoriesConnected++;
        break;
      case ANALYTICS_EVENTS.SCAN_COMPLETED:
        metrics.scansCompleted++;
        break;
      case ANALYTICS_EVENTS.FINDING_CREATED:
        metrics.findingsDetected += (e.properties?.count || 1);
        break;
      case ANALYTICS_EVENTS.FINDING_RESOLVED:
        metrics.findingsResolved++;
        break;
      case ANALYTICS_EVENTS.DOCUMENTATION_VIEWED:
        metrics.documentationViews++;
        break;
      default:
        break;
    }
  }

  return {
    timeRangeDays: days,
    totalEvents: events.length,
    newUsers: metrics.newUsers.size,
    activeOrgs: metrics.activeOrgs.size,
    projectsCreated: metrics.projectsCreated,
    repositoriesConnected: metrics.repositoriesConnected,
    scansCompleted: metrics.scansCompleted,
    findingsDetected: metrics.findingsDetected,
    findingsResolved: metrics.findingsResolved,
    documentationViews: metrics.documentationViews,
  };
}

/**
 * Compute the activation funnel.
 * Shows conversion percentages only when sufficient data exists.
 */
export function getActivationFunnel(days = 30) {
  const events = getAllEvents(days);

  const counts = {
    signup: 0,
    organization: 0,
    project: 0,
    repository: 0,
    firstScan: 0,
    findingReview: 0,
    protectionEnabled: 0,
  };

  for (const e of events) {
    if (e.event === ANALYTICS_EVENTS.SIGNUP_COMPLETED) counts.signup++;
    if (e.event === ANALYTICS_EVENTS.ORGANIZATION_CREATED) counts.organization++;
    if (e.event === ANALYTICS_EVENTS.PROJECT_CREATED) counts.project++;
    if (e.event === ANALYTICS_EVENTS.REPOSITORY_CONNECTED) counts.repository++;
    if (e.event === ANALYTICS_EVENTS.SCAN_COMPLETED) counts.firstScan++;
    if (e.event === ANALYTICS_EVENTS.FINDING_RESOLVED) counts.findingReview++;
    if (e.event === ANALYTICS_EVENTS.POLICY_ENABLED) counts.protectionEnabled++;
  }

  const hasEnoughData = counts.signup >= 5;

  const funnelSteps = [
    { key: 'signup', label: 'Signup', count: counts.signup },
    { key: 'organization', label: 'Organization Created', count: counts.organization },
    { key: 'project', label: 'Project Created', count: counts.project },
    { key: 'repository', label: 'Repository Connected', count: counts.repository },
    { key: 'firstScan', label: 'First Scan Completed', count: counts.firstScan },
    { key: 'findingReview', label: 'First Finding Reviewed', count: counts.findingReview },
    { key: 'protectionEnabled', label: 'Protection Enabled', count: counts.protectionEnabled },
  ];

  const stepsWithConversion = funnelSteps.map((step, idx) => {
    let conversionFromStart = 0;
    let stepConversion = 0;

    if (hasEnoughData && counts.signup > 0) {
      conversionFromStart = Math.min(100, Math.round((step.count / counts.signup) * 100));
      const prevCount = idx > 0 ? funnelSteps[idx - 1].count : counts.signup;
      stepConversion = prevCount > 0 ? Math.min(100, Math.round((step.count / prevCount) * 100)) : 0;
    }

    return {
      ...step,
      conversionFromStart: hasEnoughData ? `${conversionFromStart}%` : 'N/A',
      stepConversion: hasEnoughData ? `${stepConversion}%` : 'N/A',
    };
  });

  return {
    timeRangeDays: days,
    hasEnoughData,
    message: hasEnoughData ? null : 'Not enough data',
    steps: stepsWithConversion,
  };
}

export function clearEventsForTesting() {
  _events.length = 0;
}
