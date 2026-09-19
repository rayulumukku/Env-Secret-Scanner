/**
 * @file app/api/integrations/[id]/route.js
 * @description Single integration manifest, permissions, and connection detail.
 */

import { jsonSuccess, jsonNotFound, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getManifestById } from '@/lib/integrations/manifest';
import { getIntegrationPermissions } from '@/lib/integrations/permissions';
import { getIntegrationConnection } from '@/lib/db/integrations-ecosystem';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'ORG_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const manifest = getManifestById(id);
  if (!manifest) return jsonNotFound(`Integration "${id}" not found`);

  const connection = await getIntegrationConnection(auth.organization.id, id);
  const permissions = getIntegrationPermissions(id);

  return jsonSuccess({
    ...manifest,
    permissions,
    isConnected: !!connection,
    connectionStatus: connection ? connection.status : (manifest.status === 'SUPPORTED' ? 'AVAILABLE' : 'COMING_SOON'),
    connection: connection || null
  });
}
