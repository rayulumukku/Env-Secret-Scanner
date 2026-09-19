/**
 * app/api/auth/logout/route.js
 *
 * Invalidate active session and clear cookie.
 */

import { jsonSuccess } from '@/lib/api-response';
import { invalidateSession, buildClearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await invalidateSession(token);
  }

  return jsonSuccess(
    { message: 'Logged out successfully' },
    200,
    { 'Set-Cookie': buildClearSessionCookie() }
  );
}
