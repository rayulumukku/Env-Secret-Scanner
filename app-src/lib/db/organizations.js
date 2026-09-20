/**
 * lib/db/organizations.js
 *
 * Organization persistence and management.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'workspace';
}

export async function createOrganization({ name, userId, plan = 'free' }) {
  const { client, isPostgres } = await getDb();
  let baseSlug = slugify(name);
  let slug = baseSlug;

  if (isPostgres) {
    // Check if slug exists and make unique
    let counter = 1;
    while (await client.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return client.organization.create({
      data: {
        name,
        slug,
        plan,
        members: userId ? {
          create: {
            userId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        } : undefined,
      },
      include: {
        members: true,
      },
    });
  }

  // Memory fallback
  const id = `org_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  let counter = 1;
  while ([...memoryDb.organizations.values()].some(o => o.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const now = new Date();
  const org = {
    id,
    name,
    slug,
    plan,
    createdAt: now,
    updatedAt: now,
  };
  memoryDb.organizations.set(id, org);

  if (userId) {
    const memberId = `mem_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const member = {
      id: memberId,
      organizationId: id,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: now,
      updatedAt: now,
    };
    memoryDb.members.set(memberId, member);
  }

  return org;
}

export async function findOrganizationById(id) {
  if (!id) return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organization.findUnique({
      where: { id },
      include: {
        members: { include: { user: true } },
        projects: true,
      },
    });
  }

  const org = memoryDb.organizations.get(id);
  if (!org) return null;

  const members = [...memoryDb.members.values()]
    .filter(m => m.organizationId === id)
    .map(m => ({ ...m, user: memoryDb.users.get(m.userId) }));

  const projects = [...memoryDb.projects.values()].filter(p => p.organizationId === id);

  return { ...org, members, projects };
}

export async function findOrganizationsByUserId(userId) {
  if (!userId) return [];
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    const memberships = await client.organizationMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        organization: {
          include: {
            projects: true,
            members: true,
          },
        },
      },
    });
    return memberships.map(m => ({
      ...m.organization,
      userRole: m.role,
    }));
  }

  const userMemberships = [...memoryDb.members.values()]
    .filter(m => m.userId === userId && m.status === 'ACTIVE');

  return userMemberships.map(m => {
    const org = memoryDb.organizations.get(m.organizationId);
    if (!org) return null;
    const projects = [...memoryDb.projects.values()].filter(p => p.organizationId === org.id);
    const memberCount = [...memoryDb.members.values()].filter(mem => mem.organizationId === org.id).length;
    return {
      ...org,
      userRole: m.role,
      projectCount: projects.length,
      memberCount,
    };
  }).filter(Boolean);
}

export async function updateOrganization(id, data) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organization.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  const org = memoryDb.organizations.get(id);
  if (!org) throw new Error(`Organization not found: ${id}`);
  const updated = { ...org, ...data, updatedAt: new Date() };
  memoryDb.organizations.set(id, updated);
  return updated;
}

export async function deleteOrganization(id) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.organization.delete({
      where: { id },
    });
  }

  // Memory cascade deletion
  const org = memoryDb.organizations.get(id);
  if (!org) return false;

  memoryDb.organizations.delete(id);

  // Clean members for this org
  for (const [mid, member] of memoryDb.members.entries()) {
    if (member.organizationId === id) {
      memoryDb.members.delete(mid);
    }
  }

  // Clean projects for this org
  const orgProjectIds = new Set();
  for (const [pid, project] of memoryDb.projects.entries()) {
    if (project.organizationId === id) {
      orgProjectIds.add(pid);
      memoryDb.projects.delete(pid);
    }
  }

  // Clean repositories, scans, findings associated with these projects
  for (const [rid, repo] of memoryDb.repositories.entries()) {
    if (orgProjectIds.has(repo.projectId)) {
      memoryDb.repositories.delete(rid);
    }
  }

  for (const [sid, scan] of memoryDb.scans.entries()) {
    if (orgProjectIds.has(scan.projectId)) {
      memoryDb.scans.delete(sid);
    }
  }

  for (const [fid, finding] of memoryDb.findings.entries()) {
    if (orgProjectIds.has(finding.projectId)) {
      memoryDb.findings.delete(fid);
    }
  }

  return true;
}

