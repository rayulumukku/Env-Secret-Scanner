/**
 * app/api/auth/register/route.js
 *
 * User registration with automatic default organization creation.
 */

import { jsonSuccess, jsonError } from '@/lib/api-response';
import { hashPassword } from '@/lib/auth/password';
import { createUser, findUserByEmail } from '@/lib/db/users';
import { createOrganization } from '@/lib/db/organizations';
import { createSession, buildSessionCookie } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { logAuditEvent } from '@/lib/db/audit';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rate = checkRateLimit(`register:${ip}`, 5, 5 * 60 * 1000);
    if (!rate.allowed) {
      return jsonError('Too many registration attempts. Please try again later.', 'RATE_LIMITED', 429);
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, name, orgName } = body;

    if (!email || !email.includes('@')) {
      return jsonError('A valid email address is required.', 'INVALID_EMAIL', 400);
    }
    if (!password || password.length < 8) {
      return jsonError('Password must be at least 8 characters long.', 'WEAK_PASSWORD', 400);
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return jsonError('An account with this email already exists.', 'EMAIL_EXISTS', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      name: name || email.split('@')[0],
    });

    // Create default workspace
    const defaultOrgName = orgName || `${user.name}'s Workspace`;
    const org = await createOrganization({
      name: defaultOrgName,
      userId: user.id,
      plan: 'free',
    });

    // Log security event
    await logAuditEvent({
      organizationId: org.id,
      userId: user.id,
      userEmail: user.email,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: user.id,
      ipAddress: ip,
    });

    // Create session & HTTP-only cookie
    const { token } = await createSession(user.id, {
      ipAddress: ip,
      userAgent: req.headers.get('user-agent'),
    });

    const cookieHeader = buildSessionCookie(token);
    const { passwordHash: _, ...safeUser } = user;

    return jsonSuccess(
      {
        user: safeUser,
        organization: org,
      },
      201,
      { 'Set-Cookie': cookieHeader }
    );
  } catch (err) {
    return jsonError(err.message, 'SERVER_ERROR', 500);
  }
}
