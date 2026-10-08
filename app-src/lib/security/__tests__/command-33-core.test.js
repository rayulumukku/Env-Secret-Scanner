import test from 'node:test';
import assert from 'node:assert/strict';

import { SecurityIntelligenceEngine } from '../security-intelligence.js';
import { SecurityGraphService } from '../security-graph.js';
import { ExposureIntelligenceEngine } from '../exposure-intelligence.js';
import { IncidentCorrelationEngine } from '../incident-correlation.js';
import { SecurityContextSanitizer } from '../security-context-sanitizer.js';

test('SecurityIntelligenceEngine normalizes security signals without raw secrets', () => {
  const engine = new SecurityIntelligenceEngine({ organizationId: 'org_1' });
  const signals = engine.consumeSignal({
    source: 'scanner',
    type: 'SECRET_FINDING',
    severity: 'CRITICAL',
    confidence: 0.94,
    timestamp: '2026-10-08T10:00:00.000Z',
    entityId: 'repo_1',
    entityType: 'REPOSITORY',
    fingerprint: 'sha256:abc123',
    metadata: { file: 'config/.env', secretType: 'API_KEY', rawValue: 'super-secret-do-not-store' },
    correlationKeys: ['repo_1', 'org_1'],
  });

  assert.equal(signals.length, 1);
  assert.equal(signals[0].organizationId, 'org_1');
  assert.equal(signals[0].fingerprint, 'sha256:abc123');
  assert.equal(signals[0].metadata.rawValue, undefined);
  assert.equal(signals[0].entityType, 'REPOSITORY');
  assert.ok(signals[0].signalId.length > 10);
});

test('SecurityGraphService manages nodes, edges, and path traversal', () => {
  const graph = new SecurityGraphService({ organizationId: 'org_1' });

  graph.addNode({ entityType: 'REPOSITORY', entityId: 'repo_1', organizationId: 'org_1', label: 'api-service' });
  graph.addNode({ entityType: 'DEPLOYMENT', entityId: 'deploy_1', organizationId: 'org_1', label: 'prod' });
  graph.addNode({ entityType: 'RUNTIME', entityId: 'runtime_1', organizationId: 'org_1', label: 'prod-runtime' });

  graph.addEdge({ sourceId: 'repo_1', sourceType: 'REPOSITORY', targetId: 'deploy_1', targetType: 'DEPLOYMENT', relationshipType: 'DEPLOYED_TO', organizationId: 'org_1' });
  graph.addEdge({ sourceId: 'deploy_1', sourceType: 'DEPLOYMENT', targetId: 'runtime_1', targetType: 'RUNTIME', relationshipType: 'DEPLOYED_TO', organizationId: 'org_1' });

  const neighbors = graph.getNeighbors('repo_1', 'REPOSITORY');
  assert.equal(neighbors.length, 1);
  const paths = graph.findPaths('repo_1', 'RUNTIME', 5);
  assert.ok(paths.length >= 1);
  assert.equal(graph.getNode('repo_1', 'REPOSITORY').entityId, 'repo_1');
});

test('ExposureIntelligenceEngine computes deterministic exposure score', () => {
  const engine = new ExposureIntelligenceEngine({ organizationId: 'org_1' });
  const score = engine.calculateExposureScore({
    secretSeverity: 'CRITICAL',
    assetCriticality: 90,
    isPublic: true,
    runtimeExposure: true,
    cloudExposure: true,
    threatCorrelation: 0.8,
    exposureDurationDays: 21,
    deploymentStatus: 'PRODUCTION',
    recurrence: 2,
  });

  assert.equal(score.score, 94);
  assert.equal(score.level, 'CRITICAL');
  assert.ok(score.explanation.length > 20);
});

test('IncidentCorrelationEngine groups related signals into a single incident family', () => {
  const engine = new IncidentCorrelationEngine({ organizationId: 'org_1' });
  const incident = engine.correlate({
    entityId: 'repo_1',
    entityType: 'REPOSITORY',
    fingerprint: 'sha256:abc123',
    source: 'scanner',
    type: 'SECRET_FINDING',
    severity: 'CRITICAL',
    timestamp: '2026-10-08T10:00:00.000Z',
  }, {
    entityId: 'runtime_1',
    entityType: 'RUNTIME',
    fingerprint: 'sha256:abc123',
    source: 'runtime',
    type: 'RUNTIME_EXPOSURE',
    severity: 'HIGH',
    timestamp: '2026-10-08T10:05:00.000Z',
  });

  assert.equal(incident.clusterType, 'MULTI_SIGNAL');
  assert.ok(incident.relatedSignals.length >= 2);
  assert.equal(incident.organizationId, 'org_1');
});

test('SecurityContextSanitizer removes sensitive values before AI context is shared', () => {
  const sanitizer = new SecurityContextSanitizer();
  const sanitized = sanitizer.sanitize({
    message: 'Token ghp_secret123 should be redacted',
    headers: { authorization: 'Bearer fake-token', cookie: 'session=abc' },
    repo: { path: '.env', content: 'API_KEY=super-secret-value' },
  });

  assert.equal(sanitized.message.includes('ghp_secret123'), false);
  assert.equal(sanitized.headers.authorization, '[REDACTED_TOKEN]');
  assert.equal(sanitized.headers.cookie, '[REDACTED_TOKEN]');
  assert.equal(sanitized.repo.content.includes('super-secret-value'), false);
});
