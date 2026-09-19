/**
 * @file app/api/integrations/[id]/health/route.js
 * @description Integration live health probe API endpoint.
 */

import { jsonSuccess, jsonNotFound, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getManifestById } from '@/lib/integrations/manifest';
import { getIntegrationConnection } from '@/lib/db/integrations-ecosystem';
import { checkIntegrationHealth } from '@/lib/integrations/health';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'ORG_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const manifest = getManifestById(id);
  if (!manifest) return jsonNotFound(`Integration "${id}" not found`);

  const connection = await getIntegrationConnection(auth.organization.id, id);
  const health = await checkIntegrationHealth(id, connection || { organizationId: auth.organization.id });

  return jsonSuccess({
    integrationId: id,
    name: manifest.name,
    ...health
  });
}
