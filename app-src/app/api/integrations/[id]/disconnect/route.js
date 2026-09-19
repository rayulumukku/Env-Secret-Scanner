/**
 * @file app/api/integrations/[id]/disconnect/route.js
 * @description Integration disconnect endpoint.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { disconnectIntegration } from '@/lib/db/integrations-ecosystem';

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'ORG_UPDATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  try {
    await disconnectIntegration(auth.organization.id, id, {
      userId: auth.user.id,
      userEmail: auth.user.email
    });

    return jsonSuccess({
      disconnected: true,
      integrationId: id,
      message: 'Integration disconnected. Historical scan findings remain available.'
    });
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
