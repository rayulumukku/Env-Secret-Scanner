/**
 * @file app/api/integrations/[id]/connect/route.js
 * @description Secure integration connection endpoint.
 */

import { jsonSuccess, jsonError, jsonNotFound, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getManifestById } from '@/lib/integrations/manifest';
import { saveIntegrationConnection } from '@/lib/db/integrations-ecosystem';
import { integrationRegistry } from '@/lib/integrations/registry';

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'ORG_UPDATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const manifest = getManifestById(id);
  if (!manifest) return jsonNotFound(`Integration "${id}" not found`);
  if (manifest.status !== 'SUPPORTED') {
    return jsonError(`Integration "${manifest.name}" is planned for a future release and cannot be connected yet.`, 400);
  }

  try {
    const body = await req.json();
    const adapter = integrationRegistry.getAdapter(id);
    if (!adapter) return jsonError('Integration adapter not found', 500);

    const connectionData = await adapter.connect(body, { organizationId: auth.organization.id });
    const saved = await saveIntegrationConnection(
      auth.organization.id,
      id,
      body,
      {
        userId: auth.user.id,
        userEmail: auth.user.email
      }
    );

    return jsonSuccess({
      ...connectionData,
      ...saved
    });
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
