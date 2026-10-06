/**
 * app/api/runtime/deployments/route.js
 *
 * GET /api/runtime/deployments
 * Lists deployment records with evidence tracking and pagination.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listDeployments } from '@/lib/db/runtime';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access deployments.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:runtime_deployments:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { searchParams } = new URL(request.url);
    const organizationId = auth.organization.id;
    const repositoryId = searchParams.get('repositoryId');
    const environment = searchParams.get('environment');
    const commitSha = searchParams.get('commitSha');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { deployments, total } = await listDeployments({
      organizationId,
      repositoryId,
      environment,
      commitSha,
      limit,
      offset,
    });

    return jsonSuccess({
      deployments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + deployments.length < total,
      },
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
