/**
 * lib/db/scans.js
 *
 * Scan records persistence and aggregation.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function createScanRecord({
  projectId,
  repositoryId,
  scanId,
  status = 'COMPLETED',
  mode = 'CURRENT',
  branch,
  commitHash,
  durationMs = 0,
  filesScanned = 0,
  totalFindings = 0,
  criticalCount = 0,
  highCount = 0,
  mediumCount = 0,
  lowCount = 0,
  errorMessage,
}) {
  const { client, isPostgres } = await getDb();
  const actualScanId = scanId || `scan_${Date.now()}`;

  if (isPostgres) {
    return client.scan.create({
      data: {
        scanId: actualScanId,
        projectId,
        repositoryId,
        status,
        mode,
        branch,
        commitHash,
        durationMs,
        filesScanned,
        totalFindings,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        errorMessage,
      },
    });
  }

  const id = `sc_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();
  const scan = {
    id,
    scanId: actualScanId,
    projectId,
    repositoryId,
    status,
    mode,
    branch: branch || null,
    commitHash: commitHash || null,
    durationMs,
    filesScanned,
    totalFindings,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    errorMessage: errorMessage || null,
    scannedAt: now,
  };
  memoryDb.scans.set(actualScanId, scan);
  return scan;
}

export async function findScanById(scanId) {
  if (!scanId) return null;
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.scan.findUnique({
      where: { scanId },
      include: {
        findings: true,
        project: true,
        repository: true,
      },
    });
  }

  const scan = memoryDb.scans.get(scanId) || [...memoryDb.scans.values()].find(s => s.id === scanId);
  if (!scan) return null;

  const findings = [...memoryDb.findings.values()].filter(f => f.scanId === scan.scanId);
  const project = memoryDb.projects.get(scan.projectId);
  const repository = memoryDb.repositories.get(scan.repositoryId);

  return { ...scan, findings, project, repository };
}

export async function listScansByProject(projectId, limit = 20) {
  if (!projectId) return [];
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.scan.findMany({
      where: { projectId },
      include: { repository: true },
      orderBy: { scannedAt: 'desc' },
      take: limit,
    });
  }

  return [...memoryDb.scans.values()]
    .filter(s => s.projectId === projectId)
    .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
    .slice(0, limit)
    .map(s => ({
      ...s,
      repository: memoryDb.repositories.get(s.repositoryId),
    }));
}

export async function updateScan(scanId, updates = {}) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.scan.update({
      where: { scanId },
      data: updates,
    });
  }

  const scan = memoryDb.scans.get(scanId) || [...memoryDb.scans.values()].find(s => s.id === scanId);
  if (!scan) return null;

  Object.assign(scan, updates);
  memoryDb.scans.set(scan.scanId, scan);
  return scan;
}

export const createScan = createScanRecord;

