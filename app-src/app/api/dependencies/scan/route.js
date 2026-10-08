/**
 * app-src/app/api/dependencies/scan/route.js
 *
 * POST /api/dependencies/scan
 * Triggers an on-demand dependency security scan for a repository.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { scanProjectDependencies } from '@/lib/dependencies';
import { storeDependencyFindings, recordDependencyScan } from '@/lib/db/dependencies';
import { resolve } from 'path';

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to trigger dependency scan.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:dependencies_scan:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const body = await request.json().catch(() => ({}));
    const organizationId = auth.organization.id;
    const repositoryId = body.repositoryId || 'repo_default';
    const targetPath = body.path ? resolve(body.path) : process.cwd();

    const scanResult = scanProjectDependencies(targetPath, {
      checkReachability: body.checkReachability !== false,
      disallowedLicenses: body.disallowedLicenses || [],
    });

    // Store findings in database
    if (scanResult.vulnerabilities.length > 0) {
      await storeDependencyFindings(organizationId, repositoryId, scanResult.vulnerabilities);
    }

    // Record scan session
    const scanRecord = await recordDependencyScan({
      organizationId,
      repositoryId,
      scanType: body.scanType || 'CLI',
      totalDependencies: scanResult.statistics.totalDependencies,
      directCount: scanResult.statistics.directCount,
      transitiveCount: scanResult.statistics.transitiveCount,
      vulnerabilitiesCount: scanResult.statistics.vulnerabilitiesCount,
      status: 'COMPLETED',
    });

    return jsonSuccess({
      scanId: scanRecord.id,
      manifests: scanResult.manifests,
      lockfiles: scanResult.lockfiles,
      statistics: scanResult.statistics,
      vulnerabilities: scanResult.vulnerabilities,
      heuristicSignals: scanResult.heuristicSignals,
      licenseReviewItems: scanResult.licenseReviewItems,
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
