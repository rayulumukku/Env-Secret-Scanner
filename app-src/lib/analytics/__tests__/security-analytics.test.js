import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSecurityEvent,
  validateSecurityEvent,
  migrateSecurityEvent,
  ingestSecurityEvent,
  createDailySecuritySnapshot,
  detectRegression,
  detectImprovement,
  getHistoricalReplay,
  buildForensicTimeline,
} from '../security-events.js';

import { getSecurityTrendSeries, getSecurityOverview } from '../security-trends.js';

test('buildSecurityEvent stores sanitized evidence and schema metadata', () => {
  const event = buildSecurityEvent({
    organizationId: 'org_1',
    projectId: 'proj_1',
    repositoryId: 'repo_1',
    eventType: 'SCAN',
    source: 'scanner',
    relatedEntityId: 'scan_42',
    metadata: { count: 3, secret: 'sk_live_123', ruleId: 'AWS_KEY' },
    evidenceIds: ['ev_1'],
  });

  assert.equal(event.organizationId, 'org_1');
  assert.equal(event.schemaVersion, 'v2');
  assert.equal(event.metadata.count, 3);
  assert.equal(event.metadata.secret, undefined);
  assert.equal(event.metadata.ruleId, 'AWS_KEY');
  assert.ok(validateSecurityEvent(event));
});

test('migrates v1 events and quarantines invalid events', () => {
  const migrated = migrateSecurityEvent({
    organizationId: 'org_1',
    projectId: 'proj_1',
    repositoryId: 'repo_1',
    eventType: 'FINDING',
    timestamp: '2026-10-01T00:00:00.000Z',
    source: 'scanner',
    metadata: { count: 1 },
    evidenceIds: ['ev_1'],
  });

  assert.equal(migrated.schemaVersion, 'v2');

  const invalid = ingestSecurityEvent({
    organizationId: 'org_1',
    eventType: 'SCAN',
    timestamp: 'bad-date',
  });

  assert.equal(invalid.quarantined, true);
  assert.ok(Array.isArray(invalid.reasons));
});

test('creates daily snapshots, trend series, regression and replay', () => {
  const events = [
    buildSecurityEvent({
      organizationId: 'org_1',
      projectId: 'proj_1',
      repositoryId: 'repo_1',
      eventType: 'FINDING',
      source: 'scanner',
      relatedEntityId: 'find_1',
      metadata: { severity: 'HIGH', status: 'OPEN' },
      evidenceIds: ['ev_1'],
      timestamp: '2026-10-01T12:00:00.000Z',
    }),
    buildSecurityEvent({
      organizationId: 'org_1',
      projectId: 'proj_1',
      repositoryId: 'repo_1',
      eventType: 'FINDING',
      source: 'scanner',
      relatedEntityId: 'find_2',
      metadata: { severity: 'CRITICAL', status: 'OPEN' },
      evidenceIds: ['ev_2'],
      timestamp: '2026-10-02T12:00:00.000Z',
    }),
    buildSecurityEvent({
      organizationId: 'org_1',
      projectId: 'proj_1',
      repositoryId: 'repo_1',
      eventType: 'REMEDIATION',
      source: 'automation',
      relatedEntityId: 'rem_1',
      metadata: { durationHours: 8 },
      evidenceIds: ['ev_3'],
      timestamp: '2026-10-03T12:00:00.000Z',
    }),
  ];

  const snapshot = createDailySecuritySnapshot(events, '2026-10-03', 'org_1');
  assert.equal(snapshot.openFindings, 2);
  assert.equal(snapshot.criticalFindings, 1);
  assert.equal(snapshot.remediationBacklog, 0);

  const trends = getSecurityTrendSeries({
    organizationId: 'org_1',
    metric: 'open_findings',
    rangeDays: 31,
    events,
  });
  assert.ok(Array.isArray(trends.series));
  assert.ok(trends.series.length >= 1);

  const regression = detectRegression(events, { organizationId: 'org_1', metric: 'open_findings', previousCount: 1, currentCount: 2 });
  assert.equal(regression.eventType, 'SECURITY_REGRESSION');

  const improvement = detectImprovement(events, { organizationId: 'org_1', metric: 'open_findings', previousCount: 2, currentCount: 1 });
  assert.equal(improvement.eventType, 'SECURITY_IMPROVEMENT');

  const replay = getHistoricalReplay({
    organizationId: 'org_1',
    asOfDate: '2026-10-02T00:00:00.000Z',
    events,
  });
  assert.equal(replay.label, 'Historical state — 2026-10-02');

  const timeline = buildForensicTimeline({
    organizationId: 'org_1',
    repositoryId: 'repo_1',
    events,
  });
  assert.ok(Array.isArray(timeline.events));
  assert.equal(timeline.events.length, 3);
});
