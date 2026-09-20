/**
 * lib/db/exposure.js
 *
 * Database persistence and retrieval layer for Secret Exposure Intelligence.
 * Supports both PostgreSQL via Prisma and high-performance in-memory fallback.
 */

import { getDb, memoryDb } from './client.js';
import { correlateFindingsByFingerprint } from '../exposure/correlation.js';
import { generateExposureTimeline } from '../exposure/timeline.js';
import { createEvidence } from '../exposure/evidence.js';

/**
 * List all exposure clusters for an organization.
 *
 * @param {object} [filters={}]
 * @param {string} [filters.organizationId]
 * @param {string} [filters.repositoryId]
 * @param {string} [filters.status]
 * @param {number} [filters.limit=50]
 * @param {number} [filters.offset=0]
 * @returns {Promise<{ clusters: object[], total: number }>}
 */
export async function listExposureClusters({
  organizationId = null,
  repositoryId = null,
  status = null,
  limit = 50,
  offset = 0,
} = {}) {
  const { isPostgres, client } = await getDb();

  // Retrieve raw findings from database or memory store
  let allFindings = [];
  if (isPostgres) {
    const where = {};
    if (organizationId) where.project = { organizationId };
    if (repositoryId) where.repositoryId = repositoryId;
    allFindings = await client.finding.findMany({
      where,
      include: {
        repository: true,
        project: true,
      },
    });
  } else {
    allFindings = Array.from(memoryDb.findings.values());
  }

  // Correlate into clusters
  let clusters = correlateFindingsByFingerprint(allFindings, { organizationId });

  if (repositoryId) {
    clusters = clusters.filter(c => c.repositories.some(r => r.repositoryId === repositoryId));
  }
  if (status) {
    clusters = clusters.filter(c => c.status.toLowerCase() === status.toLowerCase());
  }

  const total = clusters.length;
  const paginated = clusters.slice(offset, offset + limit);

  return { clusters: paginated, total };
}

/**
 * Get detailed exposure intelligence for a specific fingerprint.
 *
 * @param {string} fingerprint
 * @param {object} [options={}]
 * @param {string} [options.organizationId]
 * @returns {Promise<object|null>}
 */
export async function getExposureClusterByFingerprint(fingerprint, options = {}) {
  const { clusters } = await listExposureClusters({ organizationId: options.organizationId, limit: 1000 });
  const found = clusters.find(c => c.fingerprint === fingerprint);
  return found || null;
}

/**
 * Retrieve the full chronological timeline for a secret fingerprint.
 *
 * @param {string} fingerprint
 * @param {object} [options={}]
 * @param {string} [options.organizationId]
 * @returns {Promise<object>}
 */
export async function getExposureTimeline(fingerprint, options = {}) {
  const { isPostgres, client } = await getDb();

  let findings = [];
  if (isPostgres) {
    findings = await client.finding.findMany({
      where: { fingerprint },
      include: { repository: true, project: true },
    });
  } else {
    findings = Array.from(memoryDb.findings.values()).filter(f => f.fingerprint === fingerprint);
  }

  // In-memory / recorded events
  const gitEvents = (memoryDb.exposureEvents || []).filter(e => e.fingerprint === fingerprint);
  const remediationEvents = [];
  for (const f of findings) {
    if (f.status === 'REMEDIATED') {
      remediationEvents.push({
        id: `rem_${f.id}`,
        status: 'REMEDIATED',
        timestamp: f.resolvedAt || f.updatedAt,
        repositoryId: f.repositoryId,
        note: 'Finding marked remediated',
      });
    }
  }

  return generateExposureTimeline({
    fingerprint,
    findings,
    gitEvents,
    remediationEvents,
  });
}

/**
 * Store an Evidence record.
 *
 * @param {object} evidenceData
 * @returns {Promise<object>}
 */
export async function saveEvidenceRecord(evidenceData) {
  const evidence = createEvidence(evidenceData);
  memoryDb.evidenceRecords.set(evidence.evidenceId, evidence);
  return evidence;
}

/**
 * Retrieve all evidence for a fingerprint.
 *
 * @param {string} fingerprint
 * @param {object} [options={}]
 * @returns {Promise<object[]>}
 */
export async function listEvidenceForFingerprint(fingerprint, options = {}) {
  const records = Array.from(memoryDb.evidenceRecords.values()).filter(e => e.fingerprint === fingerprint);
  return records;
}

/**
 * Record findings from a repository / file scan into exposure intelligence history.
 *
 * @param {object[]} findings
 * @param {object} [context={}]
 */
export async function recordExposureFindings(findings = [], context = {}) {
  for (const f of findings) {
    const fp = f.fingerprint;
    if (!fp) continue;

    // Save evidence of detection
    await saveEvidenceRecord({
      type: f.commitHash ? 'GIT_COMMIT' : 'SCANNER_RESULT',
      sourceId: f.commitHash || f.id || 'scan',
      fingerprint: fp,
      repositoryId: f.repositoryId || context.repositoryId,
      repositoryName: f.repositoryName || context.repositoryName,
      commitHash: f.commitHash || context.commitHash,
      branch: f.branch || context.branch,
      file: f.file || context.file,
      summary: `Finding detected in ${f.file || 'source code'} (${f.severity || 'HIGH'})`,
      metadata: {
        ruleId: f.ruleId,
        line: f.line,
        author: f.author,
      },
    });
  }
}
