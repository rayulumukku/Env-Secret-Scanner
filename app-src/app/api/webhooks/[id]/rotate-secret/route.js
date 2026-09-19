/**
 * @file app/api/webhooks/[id]/rotate-secret/route.js
 * @description Webhook signing secret rotation endpoint.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { rotateWebhookSecret } from '@/lib/db/integrations-ecosystem';

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'WEBHOOK_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  try {
    const result = await rotateWebhookSecret(id, auth.organization.id, {
      userId: auth.user.id,
      userEmail: auth.user.email
    });

    return jsonSuccess({
      ...result,
      message: 'Webhook signing secret rotated successfully. Update your endpoint configuration immediately.'
    });
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
