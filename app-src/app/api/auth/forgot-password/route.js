/**
 * app/api/auth/forgot-password/route.js
 *
 * Password reset request endpoint.
 */

import { jsonSuccess, jsonError } from '@/lib/api-response';
import { findUserByEmail } from '@/lib/db/users';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { resetTokens } from '@/lib/auth/reset-tokens';
import { randomBytes } from 'crypto';

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`forgot-pass:${ip}`, 5, 10 * 60 * 1000);
  if (!rate.allowed) {
    return jsonError('Too many password reset requests. Please wait a few minutes.', 'RATE_LIMITED', 429);
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email) {
    return jsonError('Email address is required.', 'INVALID_EMAIL', 400);
  }

  const user = await findUserByEmail(email);
  // Always return success to avoid user enumeration
  if (user) {
    const token = randomBytes(24).toString('hex');
    resetTokens.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    console.log(`[SecretShield Password Reset] Generated reset token for ${email}: ${token}`);
  }

  return jsonSuccess({
    message: 'If an account exists for this email, password reset instructions have been sent.',
  });
}
