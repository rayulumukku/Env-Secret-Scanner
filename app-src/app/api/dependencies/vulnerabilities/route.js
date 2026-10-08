/**
 * app-src/app/api/dependencies/vulnerabilities/route.js
 *
 * GET /api/dependencies/vulnerabilities
 * Lists DEPENDENCY_VULNERABILITY findings for the authenticated organization.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listDependencyFindings } from '@/lib/db/dependencies';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access dependency vulnerabilities.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:dependencies_vulns:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { searchParams } = new URL(request.url);
    const organizationId = auth.organization.id;
    const repositoryId = searchParams.get('repositoryId');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status') || 'OPEN';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const result = await listDependencyFindings({
      organizationId,
      repositoryId,
      severity,
      status,
      page,
      limit,
    });

    return jsonSuccess({
      vulnerabilities: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
