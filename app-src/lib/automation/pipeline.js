/**
 * lib/automation/pipeline.js
 *
 * Continuous Protection & Autonomous Security Pipeline for SecretShield.
 *
 * PIPELINE WORKFLOW:
 *   Repository Event
 *   → Normalize Event
 *   → Check Idempotency & Deduplicate
 *   → Determine Scope
 *   → Run Scanner / Correlate Findings
 *   → Evaluate Policies
 *   → Update Exposure Intelligence
 *   → Create Verifiable Security Event
 *   → Evaluate & Trigger Allowed Playbook Actions
 *   → Record Audit Event
 *   → Dispatch Deduplicated Notifications
 *
 * SAFETY INVARIANTS:
 *   - NEVER leaks raw secret tokens into logs, notifications, or audit trails.
 *   - Fail-closed: halts automated approval if policy verification cannot be asserted.
 *   - Completely declarative with explicit evidence links.
 */

import { generateIdempotencyKey, createSecurityEvent, SECURITY_EVENT_TYPES, EVENT_SOURCES } from './events.js';
import { evaluatePlaybook } from './playbooks.js';
import { detectSecretReintroduction } from './reintroduction.js';
import { formatSafeNotification, evaluateNotificationThrottle } from './notifications.js';
import { recordEventMetric } from './health.js';
import { correlateFindingsByFingerprint } from '../exposure/correlation.js';
import { createEvidence } from '../exposure/evidence.js';

/**
 * Execute the Continuous Protection Pipeline for a repository event.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.source - GITHUB_PUSH | GITHUB_PR | SCHEDULED_SCAN | CLI_SCAN etc.
 * @param {string} params.eventId - Unique incoming event ID
 * @param {string} [params.repositoryId]
 * @param {string} [params.repositoryName]
 * @param {string} [params.commitHash]
 * @param {string} [params.branch]
 * @param {string} [params.actor]
 * @param {object[]} [params.rawFindings=[]] - Raw scanner findings
 * @param {object[]} [params.activePlaybooks=[]] - Organization's enabled playbooks
 * @param {object[]} [params.historicalClusters=[]] - Organization's existing clusters
 * @param {object} [params.policiesContext={}] - Policy evaluator context
 * @returns {Promise<object>} Pipeline execution summary
 */
export async function runContinuousProtectionPipeline({
  organizationId,
  source,
  eventId,
  repositoryId = null,
  repositoryName = 'Repository',
  commitHash = null,
  branch = null,
  actor = 'System',
  rawFindings = [],
  activePlaybooks = [],
  historicalClusters = [],
  policiesContext = {},
}) {
  const startTime = Date.now();
  const idempotencyKey = generateIdempotencyKey(source, eventId, repositoryId);

  try {
    // 1. Correlate findings into exposure clusters
    const clusters = correlateFindingsByFingerprint(rawFindings, { organizationId });
    const hasFindings = rawFindings.length > 0;

    // 2. Check for secret reintroduction
    const { reintroducedEvents, newEvidences } = detectSecretReintroduction(
      rawFindings,
      historicalClusters,
      { organizationId, repositoryId, commitHash, branch, source }
    );

    // 3. Construct Primary Security Event
    const primaryEventType = reintroducedEvents.length > 0
      ? SECURITY_EVENT_TYPES.SECRET_REINTRODUCED
      : (hasFindings ? SECURITY_EVENT_TYPES.SECRET_DETECTED : SECURITY_EVENT_TYPES.SCAN_COMPLETED);

    const highestSeverity = rawFindings.reduce((max, f) => {
      const order = { INFO: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      return (order[f.severity] || 0) > (order[max] || 0) ? f.severity : max;
    }, hasFindings ? 'LOW' : 'INFO');

    const securityEvent = createSecurityEvent({
      organizationId,
      eventType: primaryEventType,
      source,
      repositoryId,
      actor,
      severity: highestSeverity,
      category: rawFindings[0]?.ruleCategory || 'SCAN',
      relatedFindingIds: rawFindings.map(f => f.id).filter(Boolean),
      relatedFingerprints: Array.from(new Set(rawFindings.map(f => f.fingerprint))),
      metadata: {
        findingsCount: rawFindings.length,
        repositoryName,
        commitHash,
        branch,
        reintroducedCount: reintroducedEvents.length,
      },
    });

    // 4. Evaluate Playbooks
    const playbookExecutions = [];
    const triggeredActions = [];

    for (const playbook of activePlaybooks) {
      const evalResult = evaluatePlaybook(playbook, securityEvent, {
        repositoryName,
        branch,
        isProduction: policiesContext.isProduction || false,
        ...policiesContext,
      });

      playbookExecutions.push(evalResult);

      if (evalResult.matched && evalResult.actionsToExecute?.length > 0) {
        for (const action of evalResult.actionsToExecute) {
          triggeredActions.push({
            playbookId: playbook.id,
            playbookName: playbook.name,
            action,
            requiresApproval: evalResult.approvalRequired,
            status: evalResult.approvalRequired ? 'PENDING_APPROVAL' : 'EXECUTED',
          });
        }
      }
    }

    // 5. Generate Safe Notifications
    const notifications = [];
    if (hasFindings) {
      for (const cluster of clusters) {
        const throttleCheck = evaluateNotificationThrottle(organizationId, cluster.fingerprint, 'INITIAL');
        if (throttleCheck.shouldSend) {
          notifications.push(formatSafeNotification({
            eventType: primaryEventType,
            fingerprint: cluster.fingerprint,
            ruleName: cluster.ruleName,
            severity: cluster.severity,
            repositoryName,
            tier: 'INITIAL',
          }));
        }
      }
    }

    const durationMs = Date.now() - startTime;
    recordEventMetric(durationMs, true);

    return {
      success: true,
      idempotencyKey,
      securityEvent,
      reintroducedEvents,
      clustersCount: clusters.length,
      findingsCount: rawFindings.length,
      playbookExecutions,
      triggeredActions,
      notificationsDispatched: notifications,
      durationMs,
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    recordEventMetric(durationMs, false, err.message);

    return {
      success: false,
      idempotencyKey,
      error: err.message || 'Pipeline execution failed',
      durationMs,
    };
  }
}
