/**
 * app/api/cloud/accounts/route.js
 *
 * GET /api/cloud/accounts
 * Lists connected cloud accounts for organization.
 * NEVER returns credentials.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listCloudAccounts } from '@/lib/db/cloud';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access cloud accounts.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:cloud_accounts:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const accounts = await listCloudAccounts(auth.organization.id);
    return jsonSuccess({ accounts });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
