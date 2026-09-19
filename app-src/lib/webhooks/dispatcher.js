/**
 * lib/webhooks/dispatcher.js
 *
 * Webhook event dispatcher.
 *
 * Supported Events:
 *   - scan.completed
 *   - finding.created
 *   - finding.resolved
 *   - critical.finding.created
 *
 * SECURITY:
 *   - Never includes raw secrets in webhook payloads (only masked values and fingerprints).
 *   - Signs all payloads with HMAC-SHA256 in X-SecretShield-Signature header.
 */

import { signWebhookPayload } from './signer.js';
import { listWebhooks, logWebhookDelivery } from '../db/webhooks.js';

/**
 * Dispatch an event to all matching webhooks in an organization / project.
 */
export async function dispatchWebhookEvent(organizationId, eventName, data, { projectId } = {}) {
  const webhooks = await listWebhooks(organizationId, projectId);
  const matching = webhooks.filter(w => {
    if (!w.isEnabled) return false;
    try {
      const events = typeof w.eventsJson === 'string' ? JSON.parse(w.eventsJson) : (w.eventsJson || []);
      return events.includes(eventName) || events.includes('*');
    } catch {
      return false;
    }
  });

  const payload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    organizationId,
    projectId: projectId || null,
    data,
  };

  const results = [];
  for (const wh of matching) {
    results.push(deliverSingleWebhook(wh, eventName, payload));
  }

  return Promise.allSettled(results);
}

/**
 * Deliver payload to a single webhook endpoint.
 */
export async function deliverSingleWebhook(webhook, eventName, payload) {
  const secret = webhook.secret || 'secretshield_default_key';
  const signature = signWebhookPayload(payload, secret);
  const start = Date.now();

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretShield-Event': eventName,
        'X-SecretShield-Signature': signature,
        'User-Agent': 'SecretShield-Webhook/2.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const durationMs = Date.now() - start;
    const bodyText = await res.text().catch(() => '');
    const isSuccess = res.ok;

    await logWebhookDelivery({
      webhookId: webhook.id,
      event: eventName,
      payload,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      responseCode: res.status,
      responseBody: bodyText.slice(0, 500),
      durationMs,
    });

    return { success: isSuccess, status: res.status };
  } catch (err) {
    const durationMs = Date.now() - start;
    await logWebhookDelivery({
      webhookId: webhook.id,
      event: eventName,
      payload,
      status: 'FAILED',
      responseCode: 0,
      responseBody: err.message.slice(0, 500),
      durationMs,
    });

    return { success: false, error: err.message };
  }
}

/**
 * Send synthetic test webhook.
 */
export async function sendTestWebhook(webhook) {
  const testPayload = {
    event: 'test.ping',
    timestamp: new Date().toISOString(),
    organizationId: webhook.organizationId,
    projectId: webhook.projectId,
    data: {
      message: 'SecretShield webhook integration test. Connection successful!',
      sampleFinding: {
        id: 'f_test_sample',
        type: 'AWS_ACCESS_KEY_ID',
        severity: 'CRITICAL',
        maskedValue: 'AKIAIOSF••••••••KEY1',
        file: 'src/config.js',
        line: 42,
      },
    },
  };

  return deliverSingleWebhook(webhook, 'test.ping', testPayload);
}
