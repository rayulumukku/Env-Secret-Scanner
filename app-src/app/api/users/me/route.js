/**
 * app/api/users/me/route.js
 *
 * Current User Profile Management and Account Deletion.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { memoryDb, getDb } from '@/lib/db/client';

export async function GET(req) {
  const auth = await getAuthContext(req);
  if (!auth.authenticated) return jsonUnauthorized(auth.error);

  return jsonSuccess({
    user: auth.user,
    memberships: auth.memberships || [],
  });
}

export async function DELETE(req) {
  const auth = await getAuthContext(req);
  if (!auth.authenticated) return jsonUnauthorized(auth.error);

  const userId = auth.user.id;
  const { client, isPostgres } = await getDb();

  try {
    if (isPostgres) {
      await client.user.delete({ where: { id: userId } });
    } else {
      memoryDb.users.delete(userId);
      // Remove sessions & memberships
      for (const [sid, sess] of memoryDb.sessions.entries()) {
        if (sess.userId === userId) memoryDb.sessions.delete(sid);
      }
      for (const [mid, mem] of memoryDb.members.entries()) {
        if (mem.userId === userId) memoryDb.members.delete(mid);
      }
    }

    return jsonSuccess({ message: 'User account and personal sessions deleted successfully.' });
  } catch (err) {
    return jsonError('Failed to delete account', 'ACCOUNT_DELETION_ERROR', 500);
  }
}
