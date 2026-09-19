/**
 * lib/db/projects.js
 *
 * Project persistence and health calculation.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';
import { slugify } from './organizations.js';

export async function createProject({ organizationId, name, description, severityThreshold = 'LOW' }) {
  const { client, isPostgres } = await getDb();
  let baseSlug = slugify(name);
  let slug = baseSlug;

  if (isPostgres) {
    let counter = 1;
    while (await client.project.findUnique({
      where: {
        organizationId_slug: { organizationId, slug },
      },
    })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return client.project.create({
      data: {
        organizationId,
        name,
        slug,
        description,
        severityThreshold,
      },
    });
  }

  const id = `proj_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  let counter = 1;
  while ([...memoryDb.projects.values()].some(p => p.organizationId === organizationId && p.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const now = new Date();
  const project = {
    id,
    organizationId,
    name,
    slug,
    description: description || null,
    severityThreshold,
    createdAt: now,
    updatedAt: now,
  };
  memoryDb.projects.set(id, project);
  return project;
}

export async function findProjectById(id, organizationId) {
  if (!id) return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.project.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        repositories: true,
        scans: { orderBy: { scannedAt: 'desc' }, take: 10 },
        findings: { where: { status: 'OPEN' } },
        customRules: true,
        baselines: true,
      },
    });
  }

  const project = memoryDb.projects.get(id);
  if (!project) return null;
  if (organizationId && project.organizationId !== organizationId) return null;

  const repositories = [...memoryDb.repositories.values()].filter(r => r.projectId === id);
  const scans = [...memoryDb.scans.values()]
    .filter(s => s.projectId === id)
    .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
  const findings = [...memoryDb.findings.values()].filter(f => f.projectId === id && f.status === 'OPEN');
  const customRules = [...memoryDb.customRules.values()].filter(r => r.projectId === id);
  const baselines = [...memoryDb.baselines.values()].filter(b => b.projectId === id);

  return {
    ...project,
    repositories,
    scans,
    findings,
    customRules,
    baselines,
  };
}

export async function listProjects(organizationId) {
  if (!organizationId) return [];
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    const projects = await client.project.findMany({
      where: { organizationId },
      include: {
        repositories: true,
        scans: { orderBy: { scannedAt: 'desc' }, take: 1 },
        findings: { where: { status: 'OPEN' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(p => {
      const openFindings = p.findings.length;
      const criticalCount = p.findings.filter(f => f.severity === 'CRITICAL').length;
      const highCount = p.findings.filter(f => f.severity === 'HIGH').length;
      return {
        ...p,
        stats: {
          repositoriesCount: p.repositories.length,
          lastScan: p.scans[0] || null,
          openFindings,
          criticalCount,
          highCount,
          securityHealth: computeSecurityHealthScore({
            criticalCount,
            highCount,
            totalRepositories: p.repositories.length,
            scannedRepositories: p.repositories.filter(r => r.lastScannedAt).length,
            lastScanDate: p.scans[0]?.scannedAt,
          }),
        },
      };
    });
  }

  const orgProjects = [...memoryDb.projects.values()]
    .filter(p => p.organizationId === organizationId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return orgProjects.map(p => {
    const repos = [...memoryDb.repositories.values()].filter(r => r.projectId === p.id);
    const scans = [...memoryDb.scans.values()]
      .filter(s => s.projectId === p.id)
      .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
    const openFindings = [...memoryDb.findings.values()].filter(f => f.projectId === p.id && f.status === 'OPEN');
    const criticalCount = openFindings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = openFindings.filter(f => f.severity === 'HIGH').length;

    return {
      ...p,
      repositories: repos,
      lastScan: scans[0] || null,
      stats: {
        repositoriesCount: repos.length,
        openFindings: openFindings.length,
        criticalCount,
        highCount,
        securityHealth: computeSecurityHealthScore({
          criticalCount,
          highCount,
          totalRepositories: repos.length,
          scannedRepositories: repos.filter(r => r.lastScannedAt).length,
          lastScanDate: scans[0]?.scannedAt,
        }),
      },
    };
  });
}

export async function updateProject(id, organizationId, data) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.project.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  const project = memoryDb.projects.get(id);
  if (!project || (organizationId && project.organizationId !== organizationId)) {
    throw new Error(`Project not found: ${id}`);
  }
  const updated = { ...project, ...data, updatedAt: new Date() };
  memoryDb.projects.set(id, updated);
  return updated;
}

export async function deleteProject(id, organizationId) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.project.delete({
      where: { id },
    });
  }

  const project = memoryDb.projects.get(id);
  if (!project || (organizationId && project.organizationId !== organizationId)) {
    return false;
  }
  memoryDb.projects.delete(id);
  return true;
}

/**
 * Transparent, deterministic Security Health Score calculation.
 * Factors:
 *   - Critical secrets deduction: -25 pts each
 *   - High secrets deduction: -10 pts each
 *   - Coverage bonus/penalty: up to +/- 20 pts based on % of repos scanned
 *   - Recency bonus: up to +15 pts if scanned within last 7 days
 * Base: 100
 */
export function computeSecurityHealthScore({
  criticalCount = 0,
  highCount = 0,
  totalRepositories = 0,
  scannedRepositories = 0,
  lastScanDate = null,
}) {
  let score = 100;

  // Deductions for active secrets
  score -= (criticalCount * 25);
  score -= (highCount * 10);

  // Coverage factor
  if (totalRepositories > 0) {
    const coverageRatio = scannedRepositories / totalRepositories;
    if (coverageRatio < 0.5) score -= 15;
    else if (coverageRatio < 1.0) score -= 5;
  }

  // Recency factor
  if (lastScanDate) {
    const daysSinceScan = (Date.now() - new Date(lastScanDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceScan > 30) score -= 15;
    else if (daysSinceScan > 14) score -= 5;
  } else if (totalRepositories > 0) {
    score -= 20; // No scan ever performed
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  let status = 'EXCELLENT';
  if (clampedScore < 40) status = 'CRITICAL_RISK';
  else if (clampedScore < 70) status = 'NEEDS_ATTENTION';
  else if (clampedScore < 85) status = 'GOOD';

  return {
    score: clampedScore,
    status,
    factors: {
      criticalDeduction: -(criticalCount * 25),
      highDeduction: -(highCount * 10),
      openCriticals: criticalCount,
      openHighs: highCount,
      repoCoverage: `${scannedRepositories}/${totalRepositories}`,
      lastScanDate,
    },
  };
}

export const getProjectById = findProjectById;

