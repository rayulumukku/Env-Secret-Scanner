/**
 * @file app/api/webhooks/[id]/deliveries/route.js
 * @description Webhook delivery inspection API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listWebhookDeliveries } from '@/lib/db/integrations-ecosystem';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'WEBHOOK_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const deliveries = await listWebhookDeliveries(id, auth.organization.id);
  return jsonSuccess(deliveries);
}
