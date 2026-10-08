/**
 * app-src/lib/db/dependencies.js
 *
 * Database Access Layer for Software Supply-Chain & Dependency Intelligence.
 * Provides multi-tenant, organization-isolated query and mutation interfaces.
 *
 * SECURITY INVARIANTS:
 * - Strictly enforces organizationId isolation on every operation.
 * - Deduplicates package records per organization to prevent index bloat.
 * - NEVER stores raw secret credentials.
 */

import { getDb } from './client.js';
import { randomUUID } from 'crypto';

/**
 * Saves or updates a Dependency record for an organization.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.ecosystem
 * @param {string} params.name
 * @param {string} [params.description]
 * @param {string} [params.homepage]
 * @param {string} [params.repository]
 * @param {boolean} [params.isDeprecated=false]
 * @returns {Promise<object>}
 */
export async function upsertDependency({
  organizationId,
  ecosystem,
  name,
  description = null,
  homepage = null,
  repository = null,
  isDeprecated = false
}) {
  if (!organizationId || !ecosystem || !name) {
    throw new Error('organizationId, ecosystem, and name are required.');
  }

  const { client, isPostgres } = await getDb();
  const normName = name.toLowerCase().trim();
  const normEco = ecosystem.toLowerCase().trim();

  if (isPostgres) {
    return await client.dependency.upsert({
      where: {
        organizationId_ecosystem_name: {
          organizationId,
          ecosystem: normEco,
          name: normName
        }
      },
      update: {
        description,
        homepage,
        repository,
        isDeprecated,
        updatedAt: new Date()
      },
      create: {
        organizationId,
        ecosystem: normEco,
        name: normName,
        description,
        homepage,
        repository,
        isDeprecated
      }
    });
  }

  // MemoryStore
  const key = `${organizationId}:${normEco}:${normName}`;
  const existing = client.dependencies.get(key);
  if (existing) {
    existing.description = description ?? existing.description;
    existing.homepage = homepage ?? existing.homepage;
    existing.repository = repository ?? existing.repository;
    existing.isDeprecated = isDeprecated;
    existing.updatedAt = new Date();
    return existing;
  }

  const record = {
    id: `dep_${randomUUID()}`,
    organizationId,
    ecosystem: normEco,
    name: normName,
    description,
    homepage,
    repository,
    isDeprecated,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  client.dependencies.set(key, record);
  return record;
}

/**
 * Lists dependencies for an organization with optional filters and pagination.
 *
 * @param {object} filter
 * @param {string} filter.organizationId
 * @param {string} [filter.ecosystem]
 * @param {string} [filter.search]
 * @param {number} [filter.page=1]
 * @param {number} [filter.limit=50]
 * @returns {Promise<{ items: Array<object>, total: number, page: number, totalPages: number }>}
 */
export async function listDependencies({
  organizationId,
  ecosystem = null,
  search = null,
  page = 1,
  limit = 50
}) {
  if (!organizationId) throw new Error('organizationId is required.');
  const { client, isPostgres } = await getDb();
  const skip = (Math.max(1, page) - 1) * limit;

  if (isPostgres) {
    const where = { organizationId };
    if (ecosystem) where.ecosystem = ecosystem.toLowerCase();
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      client.dependency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      client.dependency.count({ where })
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // MemoryStore
  let items = Array.from(client.dependencies.values()).filter(d => d.organizationId === organizationId);
  if (ecosystem) items = items.filter(d => d.ecosystem === ecosystem.toLowerCase());
  if (search) items = items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const total = items.length;
  const paginated = items.slice(skip, skip + limit);

  return {
    items: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Saves a batch of DependencyFinding records for a repository scan.
 *
 * @param {string} organizationId
 * @param {string} repositoryId
 * @param {Array<object>} findings
 * @returns {Promise<number>} Number of findings stored
 */
export async function storeDependencyFindings(organizationId, repositoryId, findings = []) {
  if (!organizationId || !repositoryId) throw new Error('organizationId and repositoryId are required.');
  const { client, isPostgres } = await getDb();

  const records = findings.map(f => ({
    id: f.id || `dep_finding_${randomUUID()}`,
    organizationId,
    repositoryId,
    manifestId: f.manifestId || null,
    packageName: f.package || f.packageName,
    ecosystem: f.ecosystem,
    installedVersion: f.installedVersion,
    affectedRange: f.affectedRange,
    fixedVersion: f.fixedVersion || null,
    advisoryId: f.advisoryId,
    severity: String(f.severity || 'MEDIUM').toUpperCase(),
    status: f.status || 'OPEN',
    isDirect: Boolean(f.isDirect),
    dependencyPathJson: JSON.stringify(f.dependencyPath || []),
    reachabilityStatus: f.reachabilityStatus || 'DECLARED',
    evidenceJson: JSON.stringify(f.evidence || {}),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (isPostgres) {
    await client.dependencyFinding.createMany({
      data: records,
      skipDuplicates: true
    });
    return records.length;
  }

  // MemoryStore
  for (const r of records) {
    client.dependencyFindings.set(r.id, r);
  }
  return records.length;
}

/**
 * Lists dependency vulnerability findings for an organization.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} [params.repositoryId]
 * @param {string} [params.severity]
 * @param {string} [params.status='OPEN']
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @returns {Promise<{ items: Array<object>, total: number, page: number, totalPages: number }>}
 */
export async function listDependencyFindings({
  organizationId,
  repositoryId = null,
  severity = null,
  status = 'OPEN',
  page = 1,
  limit = 50
}) {
  if (!organizationId) throw new Error('organizationId is required.');
  const { client, isPostgres } = await getDb();
  const skip = (Math.max(1, page) - 1) * limit;

  if (isPostgres) {
    const where = { organizationId };
    if (repositoryId) where.repositoryId = repositoryId;
    if (severity) where.severity = severity.toUpperCase();
    if (status && status !== 'ALL') where.status = status;

    const [items, total] = await Promise.all([
      client.dependencyFinding.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      client.dependencyFinding.count({ where })
    ]);

    return {
      items: items.map(i => ({
        ...i,
        dependencyPath: i.dependencyPathJson ? JSON.parse(i.dependencyPathJson) : [],
        evidence: i.evidenceJson ? JSON.parse(i.evidenceJson) : {}
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // MemoryStore
  let items = Array.from(client.dependencyFindings.values()).filter(f => f.organizationId === organizationId);
  if (repositoryId) items = items.filter(f => f.repositoryId === repositoryId);
  if (severity) items = items.filter(f => f.severity === severity.toUpperCase());
  if (status && status !== 'ALL') items = items.filter(f => f.status === status);

  const total = items.length;
  const paginated = items.slice(skip, skip + limit).map(i => ({
    ...i,
    dependencyPath: typeof i.dependencyPathJson === 'string' ? JSON.parse(i.dependencyPathJson) : (i.dependencyPath || []),
    evidence: typeof i.evidenceJson === 'string' ? JSON.parse(i.evidenceJson) : (i.evidence || {})
  }));

  return {
    items: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Records a completed dependency scan session.
 *
 * @param {object} scanData
 * @returns {Promise<object>}
 */
export async function recordDependencyScan(scanData) {
  const { client, isPostgres } = await getDb();
  const record = {
    id: `scan_${randomUUID()}`,
    organizationId: scanData.organizationId,
    repositoryId: scanData.repositoryId,
    scanType: scanData.scanType || 'CLI',
    totalDependencies: scanData.totalDependencies || 0,
    directCount: scanData.directCount || 0,
    transitiveCount: scanData.transitiveCount || 0,
    vulnerabilitiesCount: scanData.vulnerabilitiesCount || 0,
    status: scanData.status || 'COMPLETED',
    startedAt: scanData.startedAt || new Date(),
    completedAt: scanData.completedAt || new Date(),
  };

  if (isPostgres) {
    return await client.dependencyScan.create({ data: record });
  }

  client.dependencyScans.set(record.id, record);
  return record;
}
