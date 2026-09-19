/**
 * lib/jobs/notification-job.js
 *
 * Worker job to dispatch In-App alerts, Slack Block Kit messages, and HMAC webhooks.
 */

import { sendNotification } from '../notifications/dispatcher.js';
import { sendSlackNotification } from '../notifications/slack.js';
import { dispatchWebhookEvent } from '../webhooks/dispatcher.js';

/**
 * Handle NOTIFICATIONS job.
 *
 * @param {object} payload
 */
export async function executeNotificationJob(payload) {
  const {
    organizationId,
    projectId,
    repositoryName,
    branch,
    author,
    findings = [],
    filesScanned = 0,
    scanId,
  } = payload;

  const results = { inApp: 0, slack: false, webhooks: 0 };
  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const high = findings.filter(f => f.severity === 'HIGH');

  // 1. In-App Notifications
  if (critical.length > 0) {
    await sendNotification({
      organizationId,
      type: 'CRITICAL_SECRET',
      title: `${critical.length} Critical Secret${critical.length === 1 ? '' : 's'} Exposed!`,
      message: `Detected on ${repositoryName} (${branch}) committed by ${author || 'unknown'}.`,
      link: `/findings?severity=CRITICAL&project=${projectId}`,
    });
    results.inApp++;
  } else if (high.length > 0) {
    await sendNotification({
      organizationId,
      type: 'HIGH_SECRET',
      title: `${high.length} High Severity Secret${high.length === 1 ? '' : 's'} Detected`,
      message: `Detected on ${repositoryName} (${branch}).`,
      link: `/findings?severity=HIGH&project=${projectId}`,
    });
    results.inApp++;
  }

  // 2. Slack Notification (if configured or critical/high found)
  if (critical.length > 0 || high.length > 0) {
    const topFinding = critical[0] || high[0];
    results.slack = await sendSlackNotification(
      process.env.SLACK_WEBHOOK_URL,
      critical.length > 0 ? 'CRITICAL_SECRET' : 'HIGH_SECRET',
      {
        type: topFinding.type || topFinding.ruleId,
        repository: repositoryName,
        file: topFinding.file,
        line: topFinding.line,
        confidence: topFinding.confidence,
        author,
        dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/findings?project=${projectId}`,
      }
    );
  }

  // 3. Extended Webhook Event Dispatching (HMAC Signed)
  // Event: scan.completed
  await dispatchWebhookEvent(
    organizationId,
    'scan.completed',
    {
      scanId,
      repositoryName,
      branch,
      filesScanned,
      findingsCount: findings.length,
      criticalCount: critical.length,
      highCount: high.length,
    },
    { projectId }
  );

  // Event: finding.critical or finding.created
  if (critical.length > 0) {
    for (const f of critical.slice(0, 5)) {
      await dispatchWebhookEvent(
        organizationId,
        'finding.critical',
        {
          finding: {
            severity: 'critical',
            type: f.type || f.ruleId,
            file: f.file,
            line: f.line,
            confidence: f.confidence || 50,
            fingerprint: f.fingerprint,
          },
          repositoryName,
          branch,
        },
        { projectId }
      );
    }
  }

  return results;
}
