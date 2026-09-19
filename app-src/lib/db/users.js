/**
 * lib/db/users.js
 *
 * User persistence operations.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function createUser({ email, passwordHash, name, avatarUrl }) {
  const { client, isPostgres } = await getDb();
  const normalizedEmail = email.toLowerCase().trim();

  if (isPostgres) {
    return client.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name || normalizedEmail.split('@')[0],
        avatarUrl,
      },
    });
  }

  // Memory fallback
  const id = `user_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();
  const user = {
    id,
    email: normalizedEmail,
    passwordHash,
    name: name || normalizedEmail.split('@')[0],
    avatarUrl: avatarUrl || null,
    emailVerified: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryDb.users.set(id, user);
  return user;
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const { client, isPostgres } = await getDb();
  const normalizedEmail = email.toLowerCase().trim();

  if (isPostgres) {
    return client.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  for (const user of memoryDb.users.values()) {
    if (user.email === normalizedEmail) return user;
  }
  return null;
}

export async function findUserById(id) {
  if (!id) return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.user.findUnique({
      where: { id },
    });
  }

  return memoryDb.users.get(id) || null;
}

export async function updateUser(id, data) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.user.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  const user = memoryDb.users.get(id);
  if (!user) throw new Error(`User not found: ${id}`);
  const updated = { ...user, ...data, updatedAt: new Date() };
  memoryDb.users.set(id, updated);
  return updated;
}
