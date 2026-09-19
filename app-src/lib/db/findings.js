/**
 * lib/db/findings.js
 *
 * Finding persistence and lifecycle management.
 *
 * SECURITY INVARIANT:
 *   - NEVER persists raw secret strings.
 *   - Stores exclusively masked strings, fingerprints, line numbers, and rule metadata.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function saveScanFindings(findings, { scanId, projectId, repositoryId }) {
  if (!findings || findings.length === 0) return [];
  const { client, isPostgres } = await getDb();

  const formattedFindings = findings.map(f => {
    // Audit assertion: ensure rawValue is never stored
    return {
      id: f.id || `f_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      scanId,
      projectId,
      repositoryId,
      fingerprint: f.fingerprint || 'unknown_fingerprint',
      ruleId: f.ruleId || f.type || 'CUSTOM',
      type: f.type || 'SECRET',
      category: f.category || 'Generic Secrets',
      severity: f.severity || 'HIGH',
      confidence: typeof f.confidence === 'number' ? f.confidence : 50,
      file: f.file || 'unknown',
      line: typeof f.line === 'number' ? f.line : 1,
      column: typeof f.column === 'number' ? f.column : null,
      maskedValue: f.maskedValue || '••••••••',
      description: f.description || '',
      remediation: f.remediation || '',
      signalsJson: f.signals ? JSON.stringify(f.signals) : null,
      commitHash: f.commitHash || null,
      author: f.author || null,
      commitDate: f.commitDate || null,
      status: 'OPEN',
      resolvedAt: null,
      resolvedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  if (isPostgres) {
    await client.finding.createMany({
      data: formattedFindings,
    });
    return formattedFindings;
  }

  for (const f of formattedFindings) {
    memoryDb.findings.set(f.id, f);
  }

  return formattedFindings;
}

export async function queryFindings({
  organizationId,
  projectId,
  repositoryId,
  severity,
  category,
  status,
  ruleId,
  search,
  sortBy = 'newest',
  page = 1,
  limit = 25,
}) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    const where = {};
    if (projectId) where.projectId = projectId;
    if (repositoryId) where.repositoryId = repositoryId;
    if (organizationId && !projectId) {
      where.project = { organizationId };
    }
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (status) where.status = status;
    if (ruleId) where.ruleId = ruleId;
    if (search) {
      where.OR = [
        { file: { contains: search, mode: 'insensitive' } },
        { fingerprint: { contains: search, mode: 'insensitive' } },
        { ruleId: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'severity') orderBy = { severity: 'asc' }; // CRITICAL < HIGH in enum order or handled custom
    if (sortBy === 'confidence') orderBy = { confidence: 'desc' };

    const total = await client.finding.count({ where });
    const findings = await client.finding.findMany({
      where,
      include: {
        project: true,
        repository: true,
        resolvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      findings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Memory fallback query engine
  let list = [...memoryDb.findings.values()];

  if (projectId) {
    list = list.filter(f => f.projectId === projectId);
  } else if (organizationId) {
    const orgProjectIds = new Set(
      [...memoryDb.projects.values()]
        .filter(p => p.organizationId === organizationId)
        .map(p => p.id)
    );
    list = list.filter(f => orgProjectIds.has(f.projectId));
  }

  if (repositoryId) list = list.filter(f => f.repositoryId === repositoryId);
  if (severity) list = list.filter(f => f.severity === severity);
  if (category) list = list.filter(f => f.category.toLowerCase() === category.toLowerCase());
  if (status) list = list.filter(f => f.status === status);
  if (ruleId) list = list.filter(f => f.ruleId === ruleId);

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(f =>
      f.file.toLowerCase().includes(q) ||
      f.fingerprint.toLowerCase().includes(q) ||
      f.ruleId.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q)
    );
  }

  // Sort
  if (sortBy === 'confidence') {
    list.sort((a, b) => b.confidence - a.confidence);
  } else if (sortBy === 'severity') {
    const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    list.sort((a, b) => (weights[b.severity] || 0) - (weights[a.severity] || 0));
  } else {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const total = list.length;
  const paginated = list.slice((page - 1) * limit, page * limit).map(f => ({
    ...f,
    project: memoryDb.projects.get(f.projectId),
    repository: memoryDb.repositories.get(f.repositoryId),
    resolvedBy: f.resolvedById ? memoryDb.users.get(f.resolvedById) : null,
  }));

  return {
    findings: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateFindingStatus(findingId, { status, note, userId }) {
  const { client, isPostgres } = await getDb();
  const resolvedStatuses = ['FALSE_POSITIVE', 'IGNORED', 'REMEDIATED'];
  const isResolved = resolvedStatuses.includes(status);
  const now = new Date();

  if (isPostgres) {
    const finding = await client.finding.update({
      where: { id: findingId },
      data: {
        status,
        resolvedAt: isResolved ? now : null,
        resolvedById: isResolved ? userId : null,
        updatedAt: now,
        history: {
          create: {
            status,
            note,
            changedById: userId,
          },
        },
      },
      include: {
        history: true,
      },
    });
    return finding;
  }

  const finding = memoryDb.findings.get(findingId);
  if (!finding) throw new Error(`Finding not found: ${findingId}`);

  finding.status = status;
  finding.resolvedAt = isResolved ? now : null;
  finding.resolvedById = isResolved ? userId : null;
  finding.updatedAt = now;
  memoryDb.findings.set(findingId, finding);

  memoryDb.findingHistories.push({
    id: `fh_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    findingId,
    status,
    note: note || null,
    changedById: userId || null,
    createdAt: now,
  });

  return finding;
}

export async function bulkUpdateFindings(findingIds, { status, note, userId }) {
  const results = [];
  for (const id of findingIds) {
    const updated = await updateFindingStatus(id, { status, note, userId });
    results.push(updated);
  }
  return results;
}

export async function saveFindings(arg1, arg2, arg3, arg4) {
  if (Array.isArray(arg1)) {
    return saveScanFindings(arg1, arg2 || {});
  }
  // Called as saveFindings(scanId, projectId, repositoryId, findings)
  const scanId = arg1;
  const projectId = arg2;
  const repositoryId = arg3;
  const findings = arg4 || [];
  return saveScanFindings(findings, { scanId, projectId, repositoryId });
}

export async function getFindings(options = {}) {
  const res = await queryFindings(options);
  return res?.findings || [];
}

