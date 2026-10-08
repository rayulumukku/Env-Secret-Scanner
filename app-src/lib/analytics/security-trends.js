import {
  buildForensicTimeline,
  createDailySecuritySnapshot,
  detectImprovement,
  detectRegression,
  getHistoricalReplay,
} from './security-events.js';
import { SUPPORTED_METRICS } from './metrics.js';
import { buildTimeSeries } from './timeseries.js';

export function getSecurityTrendSeries({ organizationId, metric = 'open_findings', rangeDays = 30, events = [] }) {
  const safeMetric = SUPPORTED_METRICS[metric] ? metric : 'open_findings';
  const series = buildTimeSeries({
    events,
    metric: safeMetric,
    organizationId,
    rangeDays,
  });

  return {
    organizationId,
    metric: safeMetric,
    rangeDays,
    series,
    calculationMethod: `count of ${safeMetric} events observed within the selected period`,
    dataFreshness: 'observed',
    organizationScope: organizationId,
  };
}

export function getSecurityOverview({ organizationId, events = [] }) {
  const summary = {
    organizationId,
    observedMetrics: true,
    currentState: {
      openFindings: events.filter((e) => e.eventType === 'FINDING' && e.metadata?.status === 'OPEN').length,
      criticalFindings: events.filter((e) => e.eventType === 'FINDING' && e.metadata?.severity === 'CRITICAL').length,
      activeExposures: events.filter((e) => e.eventType === 'EXPOSURE').length,
      dependencyVulnerabilities: events.filter((e) => e.eventType === 'DEPENDENCY').length,
      policyViolations: events.filter((e) => e.eventType === 'POLICY' && String(e.metadata?.status || '').toUpperCase() !== 'PASSED').length,
      incidents: events.filter((e) => e.eventType === 'INCIDENT').length,
    },
    recentSnapshot: createDailySecuritySnapshot(events, new Date().toISOString().slice(0, 10), organizationId),
    trendSummary: {
      findings: getSecurityTrendSeries({ organizationId, metric: 'open_findings', rangeDays: 30, events }),
      dependencies: getSecurityTrendSeries({ organizationId, metric: 'dependency_vulnerabilities', rangeDays: 30, events }),
      policy: getSecurityTrendSeries({ organizationId, metric: 'policy_violations', rangeDays: 30, events }),
    },
  };

  return summary;
}

export {
  createDailySecuritySnapshot,
  detectRegression,
  detectImprovement,
  getHistoricalReplay,
  buildForensicTimeline,
};
