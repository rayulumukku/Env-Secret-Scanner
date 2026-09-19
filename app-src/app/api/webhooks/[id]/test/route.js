/**
 * app/api/webhooks/[id]/test/route.js
 *
 * Test webhook dispatch with synthetic payload.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { memoryDb, getDb } from '@/lib/db/client';
import { sendTestWebhook } from '@/lib/webhooks/dispatcher';

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'WEBHOOK_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { client, isPostgres } = await getDb();
  let webhook = null;

  if (isPostgres) {
    webhook = await client.webhook.findFirst({
      where: { id, organizationId: auth.organization.id },
    });
  } else {
    webhook = memoryDb.webhooks.get(id);
    if (webhook && webhook.organizationId !== auth.organization.id) webhook = null;
  }

  if (!webhook) return jsonNotFound('Webhook not found in this organization');

  const result = await sendTestWebhook(webhook);
  return jsonSuccess({
    message: result.success ? 'Test webhook delivered successfully' : 'Test webhook delivery failed',
    delivery: result,
  });
}
