/**
 * app/api/integrations/slack/route.js
 *
 * Slack integration configuration and testing API.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { saveIntegrationConnection, removeIntegrationConnection } from '@/lib/db/integrations.js';
import { sendSlackNotification } from '@/lib/notifications/slack.js';

export async function GET(req) {
  try {
    const isConfigured = !!process.env.SLACK_WEBHOOK_URL;
    return new Response(JSON.stringify({
      isConfigured,
      webhookConfigured: isConfigured,
      targetChannel: '#security-alerts',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthContext(req);
    const body = await req.json();
    const { webhookUrl, channelName = '#security-alerts', test = false } = body;
    const targetUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Slack Webhook URL is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (test) {
      const delivered = await sendSlackNotification(targetUrl, 'TEST');
      if (!delivered) {
        return new Response(JSON.stringify({ error: 'Failed to deliver test message to Slack webhook. Verify URL.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, message: 'Test alert sent successfully to Slack!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orgId = auth.currentOrgId || 'default';
    await saveIntegrationConnection({
      organizationId: orgId,
      provider: 'SLACK',
      accountId: 'slack_webhook',
      accountName: channelName,
      lastStatus: 'HEALTHY',
    });

    return new Response(JSON.stringify({ success: true, message: 'Slack alerts configured successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(req) {
  try {
    const auth = await getAuthContext(req);
    const orgId = auth.currentOrgId || 'default';
    await removeIntegrationConnection(orgId, 'SLACK');

    return new Response(JSON.stringify({ success: true, message: 'Slack integration disconnected' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
