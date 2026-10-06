/**
 * app/api/runtime/assets/route.js
 *
 * GET /api/runtime/assets
 * Lists normalized runtime assets for the authenticated organization.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listRuntimeAssets } from '@/lib/db/runtime';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access runtime assets.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:runtime_assets:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { searchParams } = new URL(request.url);
    const organizationId = auth.organization.id;
    const assetType = searchParams.get('assetType');
    const environment = searchParams.get('environment');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { assets, total } = await listRuntimeAssets({
      organizationId,
      assetType,
      environment,
      limit,
      offset,
    });

    return jsonSuccess({
      assets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + assets.length < total,
      },
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
