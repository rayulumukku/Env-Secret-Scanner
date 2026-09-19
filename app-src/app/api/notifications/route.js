/**
 * app/api/notifications/route.js
 *
 * In-app notification center inbox endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listNotifications } from '@/lib/db/notifications';

export async function GET(req) {
  const auth = await getAuthContext(req);
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const notifications = await listNotifications(auth.organization.id, auth.user.id, { unreadOnly });
  return jsonSuccess(notifications);
}
