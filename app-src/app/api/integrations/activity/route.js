/**
 * @file app/api/integrations/activity/route.js
 * @description Integration event activity stream API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listIntegrationActivity } from '@/lib/db/integrations-ecosystem';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'ORG_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const integrationId = searchParams.get('integrationId');
  const status = searchParams.get('status');

  const activity = await listIntegrationActivity(auth.organization.id, {
    integrationId,
    status
  });

  return jsonSuccess(activity);
}
