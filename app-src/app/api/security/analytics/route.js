import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityOverview } from '@/lib/analytics/security-trends.js';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const overview = getSecurityOverview({
    organizationId: auth.organization.id,
    events: [],
  });

  return jsonSuccess({
    ...overview,
    generatedAt: new Date().toISOString(),
    evidenceOnly: true,
    organizationScope: auth.organization.id,
  });
}
