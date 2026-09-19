/**
 * lib/billing/usage.js
 *
 * Safe aggregation of platform and organization usage metrics.
 *
 * PRIVACY GUARANTEE:
 * This module tracks only aggregate statistical counts (e.g. number of scans, files scanned).
 * It NEVER processes, collects, or returns raw secrets, repository contents, or tokens.
 */

import { getDb, memoryDb } from '../db/client.js';

/**
 * Get aggregated usage metrics for a given organization or system-wide
 *
 * @param {string} [orgId] - Optional organization ID filter
 * @returns {Promise<{
 *   repositoriesCount: number,
 *   projectsCount: number,
 *   membersCount: number,
 *   scansCompleted: number,
 *   filesScanned: number,
 *   findingsDetected: number,
 *   findingsResolved: number,
 *   ciScansCount: number,
 *   lastScanTimestamp: string | null
 * }>}
 */
export async function getUsageMetrics(orgId = null) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    // Project filter if orgId provided
    const projectFilter = orgId ? { organizationId: orgId } : {};
    const projects = await client.project.findMany({
      where: projectFilter,
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);

    const [
      repositoriesCount,
      membersCount,
      scansAgg,
      totalScans,
      ciScansCount,
      findingsAgg,
      resolvedCount,
      latestScan,
    ] = await Promise.all([
      client.repository.count({
        where: projectIds.length > 0 ? { projectId: { in: projectIds } } : (orgId ? { projectId: '__none__' } : {}),
      }),
      orgId
        ? client.membership.count({ where: { organizationId: orgId } })
        : client.user.count(),
      client.scan.aggregate({
        where: projectIds.length > 0 ? { projectId: { in: projectIds } } : (orgId ? { projectId: '__none__' } : {}),
        _sum: {
          filesScanned: true,
          totalFindings: true,
        },
      }),
      client.scan.count({
        where: {
          status: 'COMPLETED',
          ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : (orgId ? { projectId: '__none__' } : {})),
        },
      }),
      client.scan.count({
        where: {
          mode: { in: ['GITHUB_PR', 'GITLAB_MR', 'CI'] },
          ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : (orgId ? { projectId: '__none__' } : {})),
        },
      }),
      client.finding.count({
        where: projectIds.length > 0 ? { projectId: { in: projectIds } } : (orgId ? { projectId: '__none__' } : {}),
      }),
      client.finding.count({
        where: {
          status: { in: ['RESOLVED', 'FALSE_POSITIVE', 'REVOKED'] },
          ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : (orgId ? { projectId: '__none__' } : {})),
        },
      }),
      client.scan.findFirst({
        where: projectIds.length > 0 ? { projectId: { in: projectIds } } : (orgId ? { projectId: '__none__' } : {}),
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      repositoriesCount,
      projectsCount: projects.length,
      membersCount,
      scansCompleted: totalScans,
      filesScanned: scansAgg._sum.filesScanned || 0,
      findingsDetected: findingsAgg,
      findingsResolved: resolvedCount,
      ciScansCount,
      lastScanTimestamp: latestScan?.createdAt?.toISOString() || null,
    };
  }

  // In-Memory Fallback
  let targetProjectIds = null;
  if (orgId) {
    targetProjectIds = new Set(
      Array.from(memoryDb.projects.values())
        .filter(p => p.organizationId === orgId)
        .map(p => p.id)
    );
  }

  const allRepos = Array.from(memoryDb.repositories.values()).filter(
    r => !targetProjectIds || targetProjectIds.has(r.projectId)
  );

  const allScans = Array.from(memoryDb.scans.values()).filter(
    s => !targetProjectIds || targetProjectIds.has(s.projectId)
  );

  const allFindings = Array.from(memoryDb.findings.values()).filter(
    f => !targetProjectIds || targetProjectIds.has(f.projectId)
  );

  const totalFiles = allScans.reduce((acc, s) => acc + (s.filesScanned || 0), 0);
  const resolvedFindings = allFindings.filter(f =>
    ['RESOLVED', 'FALSE_POSITIVE', 'REVOKED'].includes(f.status)
  ).length;

  const ciScans = allScans.filter(s =>
    ['GITHUB_PR', 'GITLAB_MR', 'CI'].includes(s.mode)
  ).length;

  const latest = allScans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const membersCount = orgId
    ? Array.from(memoryDb.memberships.values()).filter(m => m.organizationId === orgId).length
    : memoryDb.users.size;

  return {
    repositoriesCount: allRepos.length,
    projectsCount: targetProjectIds ? targetProjectIds.size : memoryDb.projects.size,
    membersCount: Math.max(1, membersCount),
    scansCompleted: allScans.filter(s => s.status === 'COMPLETED').length,
    filesScanned: totalFiles,
    findingsDetected: allFindings.length,
    findingsResolved: resolvedFindings,
    ciScansCount: ciScans,
    lastScanTimestamp: latest ? new Date(latest.createdAt).toISOString() : null,
  };
}
