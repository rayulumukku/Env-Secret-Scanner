import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  LIFECYCLE_STATUS,
  calculateExposureDuration,
  formatDuration,
  createExposureRecord,
} from '../model.js';
import {
  EVIDENCE_TYPES,
  createEvidence,
  validateEvidence,
} from '../evidence.js';
import {
  generateExposureTimeline,
  TIMELINE_EVENT_TYPES,
} from '../timeline.js';
import {
  correlateFindingsByFingerprint,
} from '../correlation.js';
import {
  generateExposureGraph,
  NODE_TYPES,
  RELATIONSHIP_TYPES,
} from '../graph.js';
import {
  calculateExposureMetrics,
} from '../metrics.js';
import {
  sanitizeForExport,
  formatExposureCsv,
  formatExposureHtml,
} from '../sanitizer.js';
import {
  classifyPullRequestFindings,
  PR_FINDING_CLASSIFICATIONS,
} from '../pr-diff.js';

describe('Exposure Intelligence — Model & Duration Engine', () => {
  it('should calculate factual exposure durations accurately', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const resolvedNow = new Date().toISOString();

    const unresolved = calculateExposureDuration({
      firstSeenAt: oneDayAgo,
      isResolved: false,
    });

    assert.ok(unresolved.unresolvedDurationMs > 0);
    assert.ok(unresolved.unresolvedDurationHuman.includes('d') || unresolved.unresolvedDurationHuman.includes('h'));

    const resolved = calculateExposureDuration({
      firstSeenAt: twoDaysAgo,
      resolvedAt: resolvedNow,
      isResolved: true,
    });

    assert.strictEqual(resolved.unresolvedDurationMs, 0);
    assert.ok(resolved.remediationDurationMs > 0);
  });

  it('should format duration into readable string', () => {
    assert.strictEqual(formatDuration(0), '0m');
    assert.strictEqual(formatDuration(60 * 1000), '1m');
    assert.strictEqual(formatDuration(3600 * 1000), '1h');
    assert.strictEqual(formatDuration(25 * 3600 * 1000), '1d 1h');
  });

  it('should construct normalized exposure records without raw secrets', () => {
    const mockFinding = {
      id: 'f_test_1',
      fingerprint: 'fp_abc123',
      ruleId: 'aws-access-key-id',
      severity: 'CRITICAL',
      maskedValue: 'AKIA••••••••1234',
      file: 'config.js',
      line: 10,
    };

    const record = createExposureRecord(mockFinding, {
      repositoryId: 'repo-1',
      repositoryName: 'backend-api',
      branch: 'main',
    });

    assert.strictEqual(record.findingId, 'f_test_1');
    assert.strictEqual(record.fingerprint, 'fp_abc123');
    assert.strictEqual(record.maskedValue, 'AKIA••••••••1234');
    assert.strictEqual(record.lifecycleStatus, LIFECYCLE_STATUS.ACTIVE);
    assert.strictEqual(record.repositoryName, 'backend-api');
    assert.strictEqual(record.lineRange.start, 10);
  });
});

describe('Exposure Intelligence — Evidence Abstraction', () => {
  it('should construct verifiable evidence records', () => {
    const evidence = createEvidence({
      type: EVIDENCE_TYPES.GIT_COMMIT,
      sourceId: 'c1a2b3c4d5',
      fingerprint: 'fp_test_123',
      repositoryId: 'repo-core',
      summary: 'Secret added in commit c1a2b3c4d5',
      metadata: { author: 'Alice', file: '.env' },
    });

    assert.ok(evidence.evidenceId.startsWith('ev_'));
    assert.strictEqual(evidence.type, EVIDENCE_TYPES.GIT_COMMIT);
    assert.strictEqual(evidence.sourceId, 'c1a2b3c4d5');
    assert.strictEqual(evidence.confidence, 100);

    const val = validateEvidence(evidence);
    assert.strictEqual(val.valid, true);
  });
});

describe('Exposure Intelligence — Correlation & Clustering Engine', () => {
  it('should group findings with the exact same fingerprint across repositories', () => {
    const findings = [
      {
        id: 'f1',
        fingerprint: 'fp_shared_secret',
        maskedValue: 'sk_live_••••••1234',
        ruleId: 'stripe-secret-key',
        severity: 'CRITICAL',
        repositoryId: 'repo-payments',
        repositoryName: 'Payments Service',
        branch: 'main',
        file: 'stripe.js',
        organizationId: 'org-acme',
      },
      {
        id: 'f2',
        fingerprint: 'fp_shared_secret',
        maskedValue: 'sk_live_••••••1234',
        ruleId: 'stripe-secret-key',
        severity: 'CRITICAL',
        repositoryId: 'repo-billing',
        repositoryName: 'Billing Service',
        branch: 'feature/checkout',
        file: 'checkout.ts',
        organizationId: 'org-acme',
      },
    ];

    const clusters = correlateFindingsByFingerprint(findings, { organizationId: 'org-acme' });

    assert.strictEqual(clusters.length, 1);
    assert.strictEqual(clusters[0].fingerprint, 'fp_shared_secret');
    assert.strictEqual(clusters[0].repositoryCount, 2);
    assert.strictEqual(clusters[0].isCrossRepository, true);
    assert.strictEqual(clusters[0].totalFindings, 2);
    assert.strictEqual(clusters[0].correlationReason, 'Exact cryptographic fingerprint match');
  });

  it('should strictly isolate findings across organizations', () => {
    const findings = [
      { id: 'f1', fingerprint: 'fp_shared', organizationId: 'org-A', severity: 'HIGH' },
      { id: 'f2', fingerprint: 'fp_shared', organizationId: 'org-B', severity: 'HIGH' },
    ];

    const clustersOrgA = correlateFindingsByFingerprint(findings, { organizationId: 'org-A' });
    const clustersOrgB = correlateFindingsByFingerprint(findings, { organizationId: 'org-B' });

    assert.strictEqual(clustersOrgA.length, 1);
    assert.strictEqual(clustersOrgA[0].totalFindings, 1);
    assert.strictEqual(clustersOrgA[0].organizationId, 'org-A');

    assert.strictEqual(clustersOrgB.length, 1);
    assert.strictEqual(clustersOrgB[0].totalFindings, 1);
    assert.strictEqual(clustersOrgB[0].organizationId, 'org-B');
  });
});

describe('Exposure Intelligence — Chronological Timeline Generator', () => {
  it('should generate an evidence-backed chronological event stream', () => {
    const findings = [
      {
        id: 'f_init',
        fingerprint: 'fp_timeline_test',
        maskedValue: 'ghp_••••••••5678',
        commitHash: 'a1b2c3d4',
        commitDate: '2026-01-01T00:00:00Z',
        author: 'Dev One',
        file: 'github.js',
        repositoryId: 'repo-1',
        repositoryName: 'Frontend',
        branch: 'main',
        severity: 'CRITICAL',
      },
      {
        id: 'f_second',
        fingerprint: 'fp_timeline_test',
        maskedValue: 'ghp_••••••••5678',
        commitDate: '2026-01-05T00:00:00Z',
        file: 'worker.js',
        repositoryId: 'repo-2',
        repositoryName: 'Backend',
        branch: 'main',
        severity: 'CRITICAL',
      },
    ];

    const timeline = generateExposureTimeline({
      fingerprint: 'fp_timeline_test',
      findings,
    });

    assert.strictEqual(timeline.fingerprint, 'fp_timeline_test');
    assert.ok(timeline.totalEvents >= 2);
    assert.strictEqual(timeline.affectedRepositoriesCount, 2);
    assert.strictEqual(timeline.events[0].type, TIMELINE_EVENT_TYPES.FIRST_INTRODUCED);
    assert.ok(timeline.events[0].evidence);
    assert.strictEqual(timeline.events[1].type, TIMELINE_EVENT_TYPES.CROSS_REPO_PROPAGATION);
  });
});

describe('Exposure Intelligence — Repository Graph Generator', () => {
  it('should build a directed dependency graph with explicit evidence', () => {
    const findings = [
      {
        id: 'f_graph_1',
        fingerprint: 'fp_graph_test',
        ruleId: 'aws-access-key-id',
        severity: 'HIGH',
        maskedValue: 'AKIA••••••••0000',
        projectId: 'proj-1',
        projectName: 'Web App',
        repositoryId: 'repo-1',
        repositoryName: 'web-repo',
        branch: 'main',
        file: 'server.js',
        organizationId: 'org-test',
      },
    ];

    const graph = generateExposureGraph({
      findings,
      context: { organizationId: 'org-test', organizationName: 'Acme Test' },
      maxDepth: 4,
    });

    assert.ok(graph.nodes.length >= 5);
    assert.ok(graph.edges.length >= 4);

    const nodeTypes = graph.nodes.map(n => n.type);
    assert.ok(nodeTypes.includes(NODE_TYPES.ORGANIZATION));
    assert.ok(nodeTypes.includes(NODE_TYPES.PROJECT));
    assert.ok(nodeTypes.includes(NODE_TYPES.REPOSITORY));
    assert.ok(nodeTypes.includes(NODE_TYPES.FILE));
    assert.ok(nodeTypes.includes(NODE_TYPES.FINDING));

    for (const edge of graph.edges) {
      assert.ok(edge.evidenceId);
      assert.ok(edge.relationshipType);
    }
  });
});

describe('Exposure Intelligence — PR Change Intelligence', () => {
  it('should categorize PR findings into introduced, existing, and removed', () => {
    const baseFindings = [
      { id: 'b1', fingerprint: 'fp_pre_existing', file: 'old.js', severity: 'MEDIUM' },
    ];
    const prFindings = [
      { id: 'p1', fingerprint: 'fp_pre_existing', file: 'old.js', severity: 'MEDIUM' },
      { id: 'p2', fingerprint: 'fp_brand_new_secret', file: 'new.js', severity: 'HIGH' },
    ];

    const result = classifyPullRequestFindings({
      prFindings,
      baseFindings,
    });

    assert.strictEqual(result.isPassed, false);
    assert.strictEqual(result.counts.introduced, 1);
    assert.strictEqual(result.counts.existing, 1);
    assert.strictEqual(result.introducedFindings[0].classification, PR_FINDING_CLASSIFICATIONS.INTRODUCED_BY_PR);
    assert.strictEqual(result.existingFindings[0].classification, PR_FINDING_CLASSIFICATIONS.EXISTING_BEFORE_PR);
    assert.strictEqual(result.existingFindings[0].isBlocking, false);
  });
});

describe('Exposure Intelligence — Sanitization & Leak Prevention', () => {
  it('should strip raw credentials and format clean exports', () => {
    const rawData = {
      fingerprint: 'fp_123',
      maskedValue: 'postgres://app••••••@localhost:5432/proddb',
      ruleId: 'postgres-uri',
      dangerousField: 'postgres://appuser:supersecretpassword@localhost:5432/proddb',
      rawValue: 'raw_secret_value_must_be_stripped',
    };

    const sanitized = sanitizeForExport(rawData);

    assert.strictEqual(sanitized.fingerprint, 'fp_123');
    assert.strictEqual(sanitized.rawValue, undefined);
    assert.ok(!sanitized.dangerousField.includes('supersecretpassword'));
    assert.ok(sanitized.dangerousField.includes('••••'));

    const csv = formatExposureCsv([{
      fingerprint: 'fp_123',
      ruleId: 'stripe-key',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      repositoryCount: 2,
      firstSeenAt: '2026-01-01',
      lastSeenAt: '2026-01-02',
    }]);

    assert.ok(csv.includes('fp_123'));
    assert.ok(csv.includes('stripe-key'));
  });
});
