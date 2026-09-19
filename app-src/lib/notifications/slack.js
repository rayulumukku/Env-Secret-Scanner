/**
 * lib/notifications/slack.js
 *
 * Slack Block Kit notification builder and dispatcher.
 *
 * CRITICAL ZERO-EXPOSURE INVARIANT:
 *   - Slack messages NEVER contain raw secret values.
 *   - Transmits rule title, repository, file, line number, confidence score, and dashboard links only.
 */

/**
 * Build Slack Block Kit payload for a security finding incident.
 *
 * @param {object} params
 */
export function buildFindingSlackBlock({
  severity = 'CRITICAL',
  type = 'API Key',
  repository = 'acme/repo',
  file = 'src/config.js',
  line = 42,
  confidence = 95,
  dashboardUrl = 'http://localhost:3000/findings',
  author = null,
}) {
  const isCritical = severity.toUpperCase() === 'CRITICAL';
  const emoji = isCritical ? '🚨' : '⚠️';
  const headerText = `${emoji} SecretShield: ${severity.toUpperCase()} Secret Detected`;

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: headerText,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Repository:*\n\`${repository}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n*${type}*`,
          },
          {
            type: 'mrkdwn',
            text: `*Location:*\n\`${file}:${line}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Confidence:*\n${confidence}%`,
          },
        ],
      },
      ...(author ? [
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `👤 Committed by *${author}* | 🛡️ SecretShield Zero-Exposure Protection`,
            },
          ],
        },
      ] : [
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🛡️ *SecretShield Zero-Exposure Protection* — Raw secret values are redacted.',
            },
          ],
        },
      ]),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Finding in Dashboard →',
              emoji: true,
            },
            url: dashboardUrl,
            style: isCritical ? 'danger' : 'primary',
          },
        ],
      },
    ],
  };
}

/**
 * Dispatch a Slack notification via Incoming Webhook URL.
 *
 * @param {string} webhookUrl
 * @param {string} eventType - 'CRITICAL_SECRET' | 'HIGH_SECRET' | 'SCAN_FAILED' | 'REPO_CONNECTED' | 'CI_FAILURE' | 'TEST'
 * @param {object} data
 * @returns {Promise<boolean>}
 */
export async function sendSlackNotification(webhookUrl = process.env.SLACK_WEBHOOK_URL, eventType, data = {}) {
  if (!webhookUrl) return false;

  let payload;

  if (eventType === 'TEST') {
    payload = {
      text: '🛡️ *SecretShield Slack Integration*: Connection test successful! Security alerts will appear in this channel.',
    };
  } else if (eventType === 'CRITICAL_SECRET' || eventType === 'HIGH_SECRET') {
    payload = buildFindingSlackBlock({
      severity: eventType === 'CRITICAL_SECRET' ? 'CRITICAL' : 'HIGH',
      type: data.type || 'Exposed Secret',
      repository: data.repository || data.repositoryName || 'unknown/repo',
      file: data.file || 'unknown',
      line: data.line || 1,
      confidence: data.confidence || 90,
      dashboardUrl: data.dashboardUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/findings`,
      author: data.author,
    });
  } else {
    payload = {
      text: `🛡️ *SecretShield Alert*: [${eventType}] on \`${data.repository || 'repository'}\`\n${data.message || ''}`,
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    return res.ok;
  } catch (err) {
    console.error('[Slack] Failed to send webhook alert:', err.message);
    return false;
  }
}
