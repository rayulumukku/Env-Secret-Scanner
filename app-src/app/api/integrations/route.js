/**
 * @file app/api/integrations/route.js
 * @description List all integration manifests and active connection states for the organization.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { integrationRegistry } from '@/lib/integrations/registry';
import { listOrganizationConnections } from '@/lib/db/integrations-ecosystem';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'ORG_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const manifests = integrationRegistry.listManifests();
  const connections = await listOrganizationConnections(auth.organization.id);
  const connMap = new Map(connections.map(c => [c.integrationId, c]));

  const enriched = manifests.map(m => {
    const conn = connMap.get(m.id);
    return {
      ...m,
      isConnected: !!conn,
      connectionStatus: conn ? conn.status : (m.status === 'SUPPORTED' ? 'AVAILABLE' : 'COMING_SOON'),
      connection: conn || null
    };
  });

  return jsonSuccess(enriched);
}
