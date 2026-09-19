/**
 * app/api/notifications/[id]/read/route.js
 *
 * Mark an in-app notification as read.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { markNotificationRead } from '@/lib/db/notifications';

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req);
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const updated = await markNotificationRead(id);
  return jsonSuccess(updated);
}
