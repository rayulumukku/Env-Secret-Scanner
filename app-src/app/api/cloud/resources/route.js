/**
 * app/api/cloud/resources/route.js
 *
 * GET /api/cloud/resources
 * Lists cloud resource inventory with metadata posture status.
 * NEVER returns credentials.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listCloudResources } from '@/lib/db/cloud';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access cloud resources.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:cloud_resources:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { searchParams } = new URL(request.url);
    const organizationId = auth.organization.id;
    const cloudAccountId = searchParams.get('cloudAccountId');
    const provider = searchParams.get('provider');
    const resourceType = searchParams.get('resourceType');
    const environment = searchParams.get('environment');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { resources, total } = await listCloudResources({
      organizationId,
      cloudAccountId,
      provider,
      resourceType,
      environment,
      limit,
      offset,
    });

    return jsonSuccess({
      resources,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + resources.length < total,
      },
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
