/**
 * app-src/app/api/security/threats/route.js
 *
 * Serialized threat intelligence feed endpoint, scoped to the active organization.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { DEFAULT_THREAT_SOURCES, getThreatIntelligenceOverview } from '@/lib/threat-intelligence/index.js';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const overview = getThreatIntelligenceOverview({
    sources: DEFAULT_THREAT_SOURCES,
    items: [],
    dependencies: [],
  });

  return jsonSuccess({
    organizationId: auth.organization.id,
    ...overview,
  });
}
