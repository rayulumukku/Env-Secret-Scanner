/**
 * app/api/runtime/exposure/route.js
 *
 * GET /api/runtime/exposure
 * Comprehensive runtime exposure intelligence overview with evidence-backed correlations.
 *
 * SECURITY INVARIANT:
 * - NO arbitrary "risk scores" fabricated.
 * - Every metric and correlation is factual and backed by verifiable evidence.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listDeployments, listEnvironments } from '@/lib/db/runtime';
import { listCloudResources } from '@/lib/db/cloud';
import { getDb, memoryDb } from '@/lib/db/client';
import { correlateFindingToRuntime } from '@/lib/runtime/correlation';
import { classifyExposure } from '@/lib/runtime/classification';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access runtime exposure.');
    }

    const organizationId = auth.organization.id;
    const { isPostgres, client } = await getDb();

    // Fetch findings for this organization
    let findings = [];
    if (isPostgres) {
      findings = await client.finding.findMany({
        where: { project: { organizationId } },
        include: { repository: true, project: true },
      });
    } else {
      findings = Array.from(memoryDb.findings.values()).filter(f => f.organizationId === organizationId || f.project?.organizationId === organizationId);
    }

    // Fetch deployments, environments, and cloud resources
    const [deploymentsData, environments, cloudResourcesData] = await Promise.all([
      listDeployments({ organizationId, limit: 500 }),
      listEnvironments(organizationId),
      listCloudResources({ organizationId, limit: 500 }),
    ]);

    const deployments = deploymentsData.deployments || [];
    const cloudResources = cloudResourcesData.resources || [];

    // Correlate and classify each finding
    const correlatedFindings = [];
    let sourceExposedCount = 0;
    let deploymentAssociatedCount = 0;
    let productionAssociatedCount = 0;
    let unresolvedHistoricalCount = 0;
    let runtimeStatusUnknownCount = 0;
    let cloudAssociatedCount = 0;
    let verifiedCleanCount = 0;

    for (const f of findings) {
      const isClean = f.status === 'REMEDIATED' || f.lifecycleStatus === 'REMEDIATED' || f.lifecycleStatus === 'VERIFIED';
      if (isClean) {
        verifiedCleanCount++;
      } else {
        sourceExposedCount++;
      }

      const correlation = correlateFindingToRuntime({
        finding: f,
        deployments,
        environments,
        cloudResources,
      });

      const classification = classifyExposure({
        finding: f,
        isInCurrentSource: !isClean,
        isInGitHistory: Boolean(f.commitHash || f.isGitTrackedRisk),
        deployments: correlation.matchingDeployments,
        runtimeAssets: [],
        authoritativeActiveProof: false, // Never guess or authenticate
      });

      if (correlation.matchingDeployments.length > 0) {
        deploymentAssociatedCount++;
      }
      if (correlation.isProductionAssociated) {
        productionAssociatedCount++;
      }
      if (Boolean(f.commitHash || f.isGitTrackedRisk) && isClean) {
        unresolvedHistoricalCount++;
      }
      if (classification.activeStatus === 'ACTIVE_STATUS_UNKNOWN') {
        runtimeStatusUnknownCount++;
      }
      if (correlation.associatedCloudResources.length > 0) {
        cloudAssociatedCount++;
      }

      correlatedFindings.push({
        findingId: f.id,
        fingerprint: f.fingerprint,
        ruleId: f.ruleId,
        ruleName: f.name || f.ruleName || f.ruleId,
        file: f.file,
        line: f.line || 1,
        severity: f.severity,
        maskedValue: f.maskedValue,
        status: f.status,
        correlation,
        classification,
      });
    }

    return jsonSuccess({
      metrics: {
        totalFindingsEvaluated: findings.length,
        sourceExposedCount,
        deploymentAssociatedCount,
        productionAssociatedCount,
        unresolvedHistoricalCount,
        runtimeStatusUnknownCount,
        cloudAssociatedCount,
        verifiedCleanCount,
        validityNotice: 'SecretShield strictly differentiates source occurrence from active runtime credential. Active status unknown unless authoritative metadata exists.',
      },
      correlations: correlatedFindings.slice(0, 50),
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
