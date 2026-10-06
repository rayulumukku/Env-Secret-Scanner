/**
 * app/api/runtime/sync/route.js
 *
 * POST /api/runtime/sync
 * Triggers on-demand synchronization of runtime assets and deployment mappings.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { executeRuntimeSync } from '@/lib/runtime/sync';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to trigger runtime synchronization.');
    }

    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(auth.role)) {
      return jsonError('Insufficient permissions. Member, Admin, or Owner required.', 'FORBIDDEN', 403);
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:runtime_sync:${auth.organization.id}`);
    if (!rateCheck.allowed) {
      return jsonError('Sync rate limit exceeded. Please wait a minute before syncing again.', 'TOO_MANY_REQUESTS', 429);
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const result = await executeRuntimeSync({
      organizationId: auth.organization.id,
      actor: auth.user?.email || 'User',
      options: body,
    });

    return jsonSuccess({ sync: result });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
