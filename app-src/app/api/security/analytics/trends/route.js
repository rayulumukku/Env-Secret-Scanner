import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityTrendSeries } from '@/lib/analytics/security-trends.js';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const url = new URL(req.url);
  const rangeDays = Number(url.searchParams.get('rangeDays') || 30);
  const metric = url.searchParams.get('metric') || 'open_findings';

  return jsonSuccess(getSecurityTrendSeries({
    organizationId: auth.organization.id,
    metric,
    rangeDays,
    events: [],
  }));
}
