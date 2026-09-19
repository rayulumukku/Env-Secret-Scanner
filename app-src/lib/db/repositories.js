/**
 * lib/db/repositories.js
 *
 * Repository persistence and associations.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function createRepository({
  projectId,
  provider = 'LOCAL',
  externalId,
  name,
  fullName,
  isPrivate = false,
  defaultBranch = 'main',
  htmlUrl,
  description,
}) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.repository.create({
      data: {
        projectId,
        provider,
        externalId,
        name,
        fullName: fullName || name,
        isPrivate,
        defaultBranch,
        htmlUrl,
        description,
      },
    });
  }

  const id = `repo_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();
  const repo = {
    id,
    projectId,
    provider,
    externalId: externalId || null,
    name,
    fullName: fullName || name,
    isPrivate,
    defaultBranch,
    htmlUrl: htmlUrl || null,
    description: description || null,
    lastScannedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryDb.repositories.set(id, repo);
  return repo;
}

export async function findRepositoryById(id) {
  if (!id) return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.repository.findUnique({
      where: { id },
      include: {
        scans: { orderBy: { scannedAt: 'desc' }, take: 10 },
        findings: { where: { status: 'OPEN' } },
      },
    });
  }

  const repo = memoryDb.repositories.get(id);
  if (!repo) return null;
  const scans = [...memoryDb.scans.values()]
    .filter(s => s.repositoryId === id)
    .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
  const findings = [...memoryDb.findings.values()]
    .filter(f => f.repositoryId === id && f.status === 'OPEN');

  return { ...repo, scans, findings };
}

export async function listRepositoriesByProject(projectId) {
  if (!projectId) return [];
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.repository.findMany({
      where: { projectId },
      include: {
        scans: { orderBy: { scannedAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  return [...memoryDb.repositories.values()]
    .filter(r => r.projectId === projectId)
    .map(r => {
      const scans = [...memoryDb.scans.values()]
        .filter(s => s.repositoryId === r.id)
        .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
      return { ...r, scans };
    });
}

export async function updateRepositoryScanTime(id, date = new Date()) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.repository.update({
      where: { id },
      data: { lastScannedAt: date, updatedAt: new Date() },
    });
  }

  const repo = memoryDb.repositories.get(id);
  if (repo) {
    repo.lastScannedAt = date;
    repo.updatedAt = new Date();
    memoryDb.repositories.set(id, repo);
  }
  return repo;
}

export async function getRepositoryByFullName(fullName) {
  if (!fullName) return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.repository.findFirst({
      where: { fullName },
    });
  }

  return [...memoryDb.repositories.values()].find(r => r.fullName === fullName) || null;
}

