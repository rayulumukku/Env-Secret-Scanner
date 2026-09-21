/**
 * lib/automation/__tests__/automation.test.js
 *
 * Comprehensive Unit & Integration Tests for Command 21:
 * Autonomous Security Operations + Continuous Protection.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateIdempotencyKey,
  createSecurityEvent,
  SECURITY_EVENT_TYPES,
  EVENT_SOURCES,
} from '../events.js';

import {
  evaluateCondition,
  evaluatePlaybook,
  simulatePlaybookRun,
} from '../playbooks.js';

import {
  createApprovalRequest,
  processApprovalVerdict,
  APPROVAL_STATUS,
} from '../approvals.js';

import {
  calculateBackoff,
  createAutomationAction,
  executeAutomationAction,
  JOB_STATUS,
} from '../queue.js';

import {
  calculateNextRun,
  acquireRepositoryScanLock,
  releaseRepositoryScanLock,
  isRepositoryScanning,
  createScheduledScan,
} from '../scheduler.js';

import { detectSecretReintroduction } from '../reintroduction.js';
import { verifyRemediation, REMEDIATION_STATES } from '../verification.js';
import { sanitizeIncidentNote, createSecurityIncident, createIncidentNote } from '../incidents.js';
import { evaluateNotificationThrottle, formatSafeNotification } from '../notifications.js';
import { recordEventMetric, getAutomationHealthMetrics, resetHealthMetrics } from '../health.js';
import { runContinuousProtectionPipeline } from '../pipeline.js';

describe('Autonomous Security Operations — Events & Idempotency', () => {
  it('should generate deterministic idempotency keys', () => {
    const key1 = generateIdempotencyKey('github', 'delivery-12345', 'repo-abc');
    const key2 = generateIdempotencyKey('github', 'delivery-12345', 'repo-abc');
    const key3 = generateIdempotencyKey('github', 'delivery-67890', 'repo-abc');

    assert.strictEqual(key1, key2);
    assert.notStrictEqual(key1, key3);
    assert.strictEqual(key1.length, 64); // SHA-256
  });

  it('should construct normalized security events without raw secrets', () => {
    const event = createSecurityEvent({
      organizationId: 'org_test_123',
      eventType: SECURITY_EVENT_TYPES.SECRET_DETECTED,
      source: EVENT_SOURCES.GITHUB_PUSH,
      repositoryId: 'repo_backend',
      severity: 'HIGH',
      category: 'API_KEY',
      relatedFingerprints: ['fp_test_1', 'fp_test_2'],
      metadata: {
        branch: 'main',
        secret_value: 'sample_api_secret_key_token_12345678', // Should be sanitized
      },
    });

    assert.ok(event.id.startsWith('sev_'));
    assert.strictEqual(event.eventType, 'SECRET_DETECTED');
    assert.strictEqual(event.source, 'GITHUB_PUSH');
    assert.strictEqual(event.metadata.secret_value, '[REDACTED]');
  });

  it('should reject creation without organizationId', () => {
    assert.throws(() => {
      createSecurityEvent({
        eventType: SECURITY_EVENT_TYPES.SECRET_DETECTED,
        source: EVENT_SOURCES.CLI_SCAN,
      });
    }, /organizationId is strictly required/);
  });
});

describe('Autonomous Security Operations — Declarative Playbooks & Simulator', () => {
  it('should evaluate declarative condition operators accurately', () => {
    const event = {
      eventType: 'SECRET_DETECTED',
      severity: 'CRITICAL',
      source: 'GITHUB_PUSH',
      metadata: { branch: 'main' },
    };
    const context = { isProduction: true, repositoryName: 'payments-api' };

    assert.strictEqual(evaluateCondition({ field: 'severity', operator: 'gte', value: 'HIGH' }, event, context).matched, true);
    assert.strictEqual(evaluateCondition({ field: 'severity', operator: 'gte', value: 'LOW' }, event, context).matched, true);
    assert.strictEqual(evaluateCondition({ field: 'isProduction', operator: 'is_true', value: true }, event, context).matched, true);
    assert.strictEqual(evaluateCondition({ field: 'eventType', operator: 'equals', value: 'SCAN_COMPLETED' }, event, context).matched, false);
    assert.strictEqual(evaluateCondition({ field: 'source', operator: 'in', value: ['GITHUB_PUSH', 'GITHUB_PR'] }, event, context).matched, true);
  });

  it('should execute dry-run simulation without taking side effects', () => {
    const playbooks = [
      {
        id: 'pb_prod_critical',
        name: 'Auto-Block Critical Production Findings',
        conditions: [
          { field: 'severity', operator: 'gte', value: 'HIGH' },
          { field: 'isProduction', operator: 'is_true', value: true },
        ],
        actions: ['BLOCK_CI', 'NOTIFY_SECURITY_CHANNEL'],
        approvalRequired: false,
      },
      {
        id: 'pb_low_info',
        name: 'Low Severity Informational Notice',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'LOW' },
        ],
        actions: ['NOTIFY_REPO_OWNER'],
        approvalRequired: false,
      },
    ];

    const event = {
      eventType: 'SECRET_DETECTED',
      severity: 'HIGH',
      repositoryId: 'repo_prod_api',
    };

    const sim = simulatePlaybookRun(event, playbooks, { isProduction: true });

    assert.strictEqual(sim.isSimulated, true);
    assert.strictEqual(sim.totalPlaybooksEvaluated, 2);
    assert.strictEqual(sim.totalPlaybooksMatched, 1);
    assert.strictEqual(sim.totalProposedActions, 2);
    assert.strictEqual(sim.evaluations[0].matched, true);
    assert.strictEqual(sim.evaluations[1].matched, false);
  });
});

describe('Autonomous Security Operations — Approval Gates & Action Queue', () => {
  it('should manage approval state lifecycle', () => {
    const req = createApprovalRequest({
      organizationId: 'org_test',
      actionType: 'BLOCK_CI',
      targetId: 'pr_99',
      reason: 'Blocking CI for critical AWS token detection',
    });

    assert.strictEqual(req.status, APPROVAL_STATUS.PENDING_APPROVAL);

    const approved = processApprovalVerdict(req, 'APPROVED', 'Security Lead', 'Confirmed valid finding');
    assert.strictEqual(approved.status, APPROVAL_STATUS.APPROVED);
    assert.strictEqual(approved.approver, 'Security Lead');
  });

  it('should calculate exponential backoff safely', () => {
    assert.strictEqual(calculateBackoff(0, 1000), 1000);
    assert.strictEqual(calculateBackoff(1, 1000), 2000);
    assert.strictEqual(calculateBackoff(2, 1000), 4000);
    assert.strictEqual(calculateBackoff(10, 1000, 30000), 30000); // capped at max
  });

  it('should execute queued action and handle transient failure retries', async () => {
    const action = createAutomationAction({
      organizationId: 'org_test',
      actionType: 'NOTIFY_SECURITY_CHANNEL',
    });

    assert.strictEqual(action.status, JOB_STATUS.QUEUED);

    // Fail first attempt
    let attempts = 0;
    await executeAutomationAction(action, async () => {
      attempts++;
      throw new Error('Network timeout');
    });

    assert.strictEqual(action.retryCount, 1);
    assert.strictEqual(action.status, JOB_STATUS.QUEUED);

    // Succeed second attempt
    await executeAutomationAction(action, async () => {
      attempts++;
      return { delivered: true };
    });

    assert.strictEqual(action.status, JOB_STATUS.COMPLETED);
    assert.strictEqual(attempts, 2);
  });
});

describe('Autonomous Security Operations — Scheduled Scans & Concurrency Locking', () => {
  it('should calculate next run dates accurately', () => {
    const base = new Date('2026-09-21T10:00:00.000Z');
    const hourly = calculateNextRun('hourly', base);
    const daily = calculateNextRun('daily', base);
    const weekly = calculateNextRun('weekly', base);

    assert.strictEqual(hourly.toISOString(), '2026-09-21T11:00:00.000Z');
    assert.strictEqual(daily.toISOString(), '2026-09-22T10:00:00.000Z');
    assert.strictEqual(weekly.toISOString(), '2026-09-28T10:00:00.000Z');
  });

  it('should prevent overlapping concurrent scans on the same repository', () => {
    const repoId = 'repo_lock_test';
    assert.strictEqual(acquireRepositoryScanLock(repoId), true);
    assert.strictEqual(isRepositoryScanning(repoId), true);

    // Second lock attempt must fail
    assert.strictEqual(acquireRepositoryScanLock(repoId), false);

    // Release lock
    releaseRepositoryScanLock(repoId);
    assert.strictEqual(isRepositoryScanning(repoId), false);
    assert.strictEqual(acquireRepositoryScanLock(repoId), true);
    releaseRepositoryScanLock(repoId);
  });
});

describe('Autonomous Security Operations — Reintroduction & Remediation Verification', () => {
  it('should detect when a previously remediated secret fingerprint reappears', () => {
    const historicalClusters = [
      {
        fingerprint: '3f2a890471b6',
        status: 'REMEDIATED',
        resolvedAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    const currentFindings = [
      {
        id: 'f_new_1',
        fingerprint: '3f2a890471b6',
        file: 'config/db.js',
        line: 12,
        severity: 'HIGH',
        ruleCategory: 'DATABASE',
      },
    ];

    const result = detectSecretReintroduction(currentFindings, historicalClusters, {
      organizationId: 'org_test',
      repositoryId: 'repo_api',
    });

    assert.strictEqual(result.reintroducedEvents.length, 1);
    assert.strictEqual(result.reintroducedEvents[0].eventType, SECURITY_EVENT_TYPES.SECRET_REINTRODUCED);
    assert.strictEqual(result.newEvidences.length, 1);
  });

  it('should verify remediation and distinguish source removal from unverified rotation', () => {
    const outcome = verifyRemediation({
      organizationId: 'org_test',
      repositoryId: 'repo_api',
      fingerprint: '3f2a890471b6',
      currentRepoFindings: [], // Empty -> no longer in source
      hasProviderRotationEvidence: false,
    });

    assert.strictEqual(outcome.success, true);
    assert.strictEqual(outcome.sourceRemoved, true);
    assert.strictEqual(outcome.rotationState, REMEDIATION_STATES.ROTATION_UNVERIFIED);
    assert.strictEqual(outcome.event.eventType, SECURITY_EVENT_TYPES.REMEDIATION_VERIFIED);
  });
});

describe('Autonomous Security Operations — Incidents & Sanitized Notes', () => {
  it('should sanitize raw credentials pasted into incident notes before saving', () => {
    const rawNote = 'Investigated secret: AKIA0000000000000000 found in docker-compose.yml';
    const { sanitizedText, detectedCount } = sanitizeIncidentNote(rawNote);

    assert.strictEqual(detectedCount, 1);
    assert.ok(!sanitizedText.includes('AKIA0000000000000000'));
    assert.ok(sanitizedText.includes('[REDACTED_CREDENTIAL]'));
  });

  it('should create incident note with automated warning', () => {
    const { note, warning } = createIncidentNote({
      incidentId: 'inc_123',
      organizationId: 'org_test',
      authorId: 'u_1',
      authorName: 'Analyst Jane',
      content: 'Here is the token: ghp_000000000000000000000000000000000000',
    });

    assert.ok(warning !== null);
    assert.ok(!note.content.includes('ghp_000000000000000000000000000000000000'));
    assert.ok(note.content.includes('[REDACTED_CREDENTIAL]'));
  });
});

describe('Autonomous Security Operations — Notification Throttling & Health Metrics', () => {
  beforeEach(() => {
    resetHealthMetrics();
  });

  it('should throttle repetitive notifications for identical fingerprint', () => {
    const first = evaluateNotificationThrottle('org_test', 'fp_1234', 'INITIAL', 60);
    assert.strictEqual(first.shouldSend, true);

    const second = evaluateNotificationThrottle('org_test', 'fp_1234', 'INITIAL', 60);
    assert.strictEqual(second.shouldSend, false);
    assert.ok(second.reason.includes('Throttled'));
  });

  it('should record event processing metrics and aggregate health status', () => {
    recordEventMetric(45, true);
    recordEventMetric(55, true);
    recordEventMetric(100, false, 'Failed connection');

    const health = getAutomationHealthMetrics();
    assert.strictEqual(health.eventsReceived, 3);
    assert.strictEqual(health.eventsProcessed, 2);
    assert.strictEqual(health.processingFailures, 1);
    assert.strictEqual(health.averageProcessingDurationMs, 50);
    assert.strictEqual(health.status, 'HEALTHY');
  });
});

describe('Autonomous Security Operations — Continuous Protection Pipeline', () => {
  it('should execute end-to-end continuous protection pipeline successfully', async () => {
    const result = await runContinuousProtectionPipeline({
      organizationId: 'org_pipeline_test',
      source: EVENT_SOURCES.GITHUB_PUSH,
      eventId: 'evt_push_999',
      repositoryId: 'repo_payments',
      repositoryName: 'payments-service',
      rawFindings: [
        {
          id: 'find_1',
          ruleId: 'aws-access-key',
          ruleName: 'AWS Access Key ID',
          severity: 'CRITICAL',
          ruleCategory: 'CLOUD_PROVIDER',
          fingerprint: '3f2a890471b6',
          file: '.env',
          line: 4,
          maskedValue: 'AKIA••••••••••••••••',
        },
      ],
      activePlaybooks: [
        {
          id: 'pb_1',
          name: 'Auto-Triage Critical Cloud Keys',
          conditions: [
            { field: 'severity', operator: 'gte', value: 'HIGH' },
          ],
          actions: ['CREATE_REMEDIATION_TASK', 'NOTIFY_SECURITY_CHANNEL'],
          approvalRequired: false,
        },
      ],
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.securityEvent.eventType, SECURITY_EVENT_TYPES.SECRET_DETECTED);
    assert.strictEqual(result.clustersCount, 1);
    assert.strictEqual(result.playbookExecutions.length, 1);
    assert.strictEqual(result.playbookExecutions[0].matched, true);
    assert.strictEqual(result.triggeredActions.length, 2);
    assert.strictEqual(result.notificationsDispatched.length, 1);
  });
});
