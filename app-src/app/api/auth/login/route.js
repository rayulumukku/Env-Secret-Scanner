/**
 * app/api/auth/login/route.js
 *
 * User authentication and session creation.
 */

import { jsonSuccess, jsonError } from '@/lib/api-response';
import { verifyPassword } from '@/lib/auth/password';
import { findUserByEmail } from '@/lib/db/users';
import { findOrganizationsByUserId } from '@/lib/db/organizations';
import { createSession, buildSessionCookie } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { logAuditEvent } from '@/lib/db/audit';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`login:${ip}`, 10, 5 * 60 * 1000);
    if (!rate.allowed) {
      return jsonError('Too many login attempts. Please try again later.', 'RATE_LIMITED', 429);
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return jsonError('Email and password are required.', 'MISSING_CREDENTIALS', 400);
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return jsonError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return jsonError('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
    }

    const userOrgs = await findOrganizationsByUserId(user.id);
    const defaultOrg = userOrgs[0] || null;

    if (defaultOrg) {
      await logAuditEvent({
        organizationId: defaultOrg.id,
        userId: user.id,
        userEmail: user.email,
        action: 'USER_LOGIN',
        targetType: 'User',
        targetId: user.id,
        ipAddress: ip,
      });
    }

    const { token } = await createSession(user.id, {
      ipAddress: ip,
      userAgent: req.headers.get('user-agent'),
    });

    const cookieHeader = buildSessionCookie(token);
    const { passwordHash: _, ...safeUser } = user;

    return jsonSuccess(
      {
        user: safeUser,
        organizations: userOrgs,
        activeOrganization: defaultOrg,
      },
      200,
      { 'Set-Cookie': cookieHeader }
    );
  } catch (err) {
    return jsonError(err.message, 'SERVER_ERROR', 500);
  }
}
