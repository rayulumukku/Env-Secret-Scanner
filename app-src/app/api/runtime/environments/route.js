/**
 * app/api/runtime/environments/route.js
 *
 * GET /api/runtime/environments
 * Lists registered environments for organization.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listEnvironments, upsertEnvironment } from '@/lib/db/runtime';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access environments.');
    }

    const environments = await listEnvironments(auth.organization.id);
    return jsonSuccess({ environments });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to modify environments.');
    }

    if (!['OWNER', 'ADMIN'].includes(auth.role)) {
      return jsonError('Insufficient permissions. Owner or Admin required.', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const env = await upsertEnvironment({
      ...body,
      organizationId: auth.organization.id,
    }, auth.user?.email || 'Admin');

    return jsonSuccess({ environment: env });
  } catch (err) {
    return jsonError(err.message, 'BAD_REQUEST', 400);
  }
}
