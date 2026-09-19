/**
 * lib/db/members.js
 *
 * Organization team member management.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function addMember({ organizationId, userId, role = 'MEMBER', invitedEmail, status = 'ACTIVE' }) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
        status,
        invitedEmail,
      },
      include: { user: true },
    });
  }

  const id = `mem_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();
  const member = {
    id,
    organizationId,
    userId,
    role,
    status,
    invitedEmail: invitedEmail || null,
    joinedAt: now,
    updatedAt: now,
  };
  memoryDb.members.set(id, member);
  const user = memoryDb.users.get(userId);
  return { ...member, user };
}

export async function findMember(organizationId, userId) {
  if (!organizationId || !userId) return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: { user: true },
    });
  }

  const member = [...memoryDb.members.values()].find(
    m => m.organizationId === organizationId && m.userId === userId
  );
  if (!member) return null;
  const user = memoryDb.users.get(userId);
  return { ...member, user };
}

export async function listMembers(organizationId) {
  if (!organizationId) return [];
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organizationMember.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
  }

  return [...memoryDb.members.values()]
    .filter(m => m.organizationId === organizationId)
    .map(m => ({
      ...m,
      user: memoryDb.users.get(m.userId) || { name: m.invitedEmail, email: m.invitedEmail },
    }))
    .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
}

export async function updateMemberRole(organizationId, userId, role) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: { role, updatedAt: new Date() },
    });
  }

  const member = [...memoryDb.members.values()].find(
    m => m.organizationId === organizationId && m.userId === userId
  );
  if (!member) throw new Error('Member not found');
  member.role = role;
  member.updatedAt = new Date();
  memoryDb.members.set(member.id, member);
  return member;
}

export async function removeMember(organizationId, userId) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  const member = [...memoryDb.members.values()].find(
    m => m.organizationId === organizationId && m.userId === userId
  );
  if (member) {
    memoryDb.members.delete(member.id);
    return true;
  }
  return false;
}
