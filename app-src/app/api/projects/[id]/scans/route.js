/**
 * app/api/projects/[id]/scans/route.js
 *
 * Project scan runner and history.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { findProjectById } from '@/lib/db/projects';
import { createRepository, updateRepositoryScanTime } from '@/lib/db/repositories';
import { listScansByProject, createScanRecord } from '@/lib/db/scans';
import { saveScanFindings } from '@/lib/db/findings';
import { scan as scanEngine } from '@/lib/scanner/engine';
import { logAuditEvent } from '@/lib/db/audit';
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher';
import { sendNotification } from '@/lib/notifications/dispatcher';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'SCAN_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const project = await findProjectById(id, auth.organization.id);
  if (!project) return jsonNotFound('Project not found');

  const scans = await listScansByProject(id);
  return jsonSuccess(scans);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'SCAN_CREATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const project = await findProjectById(id, auth.organization.id);
  if (!project) return jsonNotFound('Project not found');

  const body = await req.json().catch(() => ({}));
  const { files = [], repositoryName, repositoryId, branch = 'main', commitHash, mode = 'CURRENT' } = body;

  if (!Array.isArray(files) || files.length === 0) {
    return jsonError('No files provided for scan.', 'NO_FILES', 400);
  }

  // Ensure repository exists
  let targetRepoId = repositoryId;
  if (!targetRepoId) {
    const defaultName = repositoryName || `${project.name}-repo`;
    const newRepo = await createRepository({
      projectId: id,
      name: defaultName,
      fullName: defaultName,
      defaultBranch: branch,
    });
    targetRepoId = newRepo.id;
  }

  const start = Date.now();
  // Execute deterministic detection engine
  const scanResult = scanEngine({
    files,
    options: {
      scanId: `scan_${Date.now()}`,
    },
  });
  const durationMs = Date.now() - start;

  const findings = scanResult.findings || [];
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter(f => f.severity === 'LOW').length;

  // Persist scan record
  const scanRecord = await createScanRecord({
    projectId: id,
    repositoryId: targetRepoId,
    scanId: scanResult.scanId,
    status: 'COMPLETED',
    mode,
    branch,
    commitHash,
    durationMs,
    filesScanned: scanResult.statistics?.filesScanned || files.length,
    totalFindings: findings.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  });

  // Persist findings (strictly masked, no raw secrets)
  const savedFindings = await saveScanFindings(findings, {
    scanId: scanRecord.scanId,
    projectId: id,
    repositoryId: targetRepoId,
  });

  await updateRepositoryScanTime(targetRepoId);

  // Security Audit Log
  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'SCAN_COMPLETED',
    targetType: 'Scan',
    targetId: scanRecord.scanId,
    metadata: {
      projectId: id,
      totalFindings: findings.length,
      criticalCount,
      highCount,
      durationMs,
    },
  });

  // Webhook dispatch
  await dispatchWebhookEvent(auth.organization.id, 'scan.completed', {
    scanId: scanRecord.scanId,
    projectId: id,
    totalFindings: findings.length,
    criticalCount,
    highCount,
  }, { projectId: id });

  if (criticalCount > 0) {
    await dispatchWebhookEvent(auth.organization.id, 'critical.finding.created', {
      scanId: scanRecord.scanId,
      projectId: id,
      criticalCount,
      sampleFinding: savedFindings.find(f => f.severity === 'CRITICAL'),
    }, { projectId: id });

    // In-app alert notification
    await sendNotification({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      type: 'CRITICAL_SECRET',
      title: `${criticalCount} Critical Secret(s) Detected in ${project.name}`,
      message: `Scan detected exposed critical credentials in branch ${branch}. Immediate remediation required.`,
      link: `/findings?projectId=${id}&severity=CRITICAL`,
    });
  }

  return jsonSuccess({
    scan: scanRecord,
    findings: savedFindings,
  }, 201);
}
