/**
 * lib/db/baselines.js
 *
 * Project baseline persistence.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function createBaseline({ organizationId, projectId, name = 'Default Baseline', description, entries, userId }) {
  const { client, isPostgres } = await getDb();
  const entriesJson = typeof entries === 'string' ? entries : JSON.stringify(entries || []);
  const parsedEntries = typeof entries === 'string' ? JSON.parse(entries) : (entries || []);

  if (isPostgres) {
    return client.baseline.create({
      data: {
        organizationId,
        projectId,
        name,
        description,
        entriesJson,
        activeCount: parsedEntries.length,
        createdById: userId,
      },
    });
  }

  const id = `base_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();
  const baseline = {
    id,
    organizationId,
    projectId: projectId || null,
    name,
    description: description || null,
    entriesJson,
    activeCount: parsedEntries.length,
    createdById: userId || null,
    createdAt: now,
    updatedAt: now,
  };
  memoryDb.baselines.set(id, baseline);
  return baseline;
}

export async function listBaselinesByProject(projectId, organizationId) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.baseline.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return [...memoryDb.baselines.values()]
    .filter(b => (!projectId || b.projectId === projectId) && (!organizationId || b.organizationId === organizationId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
