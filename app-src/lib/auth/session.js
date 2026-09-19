/**
 * lib/auth/session.js
 *
 * Session token generation, verification, and HTTP-only cookie management.
 */

import { randomBytes } from 'crypto';
import { getDb, memoryDb } from '../db/client.js';
import { findUserById } from '../db/users.js';

export const SESSION_COOKIE_NAME = 'secretshield_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId, { ipAddress, userAgent } = {}) {
  const { client, isPostgres } = await getDb();
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  if (isPostgres) {
    const session = await client.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
    return { token, session };
  }

  const id = `sess_${randomBytes(16).toString('hex')}`;
  const session = {
    id,
    userId,
    token,
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    createdAt: new Date(),
  };
  memoryDb.sessions.set(token, session);
  return { token, session };
}

export async function validateSession(token) {
  if (!token || typeof token !== 'string') return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    const session = await client.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || new Date() > new Date(session.expiresAt)) {
      return null;
    }
    const { passwordHash, ...safeUser } = session.user;
    return { session, user: safeUser };
  }

  const session = memoryDb.sessions.get(token);
  if (!session || new Date() > new Date(session.expiresAt)) {
    if (session) memoryDb.sessions.delete(token);
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) return null;

  const { passwordHash, ...safeUser } = user;
  return { session, user: safeUser };
}

export async function invalidateSession(token) {
  if (!token) return true;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    try {
      await client.session.delete({ where: { token } });
    } catch {}
    return true;
  }

  memoryDb.sessions.delete(token);
  return true;
}

export function buildSessionCookie(token, { isProduction = process.env.NODE_ENV === 'production' } = {}) {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_MS / 1000}${isProduction ? '; Secure' : ''}`;
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
