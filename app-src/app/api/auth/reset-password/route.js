/**
 * app/api/auth/reset-password/route.js
 *
 * Password reset submission endpoint.
 */

import { jsonSuccess, jsonError } from '@/lib/api-response';
import { hashPassword } from '@/lib/auth/password';
import { updateUser } from '@/lib/db/users';
import { resetTokens } from '@/lib/auth/reset-tokens';

export async function POST(req) {
  const { token, newPassword } = await req.json().catch(() => ({}));

  if (!token || !newPassword || newPassword.length < 8) {
    return jsonError('Valid token and password of at least 8 characters are required.', 'INVALID_REQUEST', 400);
  }

  const record = resetTokens.get(token);
  if (!record || Date.now() > record.expiresAt) {
    if (record) resetTokens.delete(token);
    return jsonError('Password reset link is invalid or has expired.', 'INVALID_TOKEN', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUser(record.userId, { passwordHash });
  resetTokens.delete(token);

  return jsonSuccess({ message: 'Password has been successfully updated. You may now log in.' });
}
