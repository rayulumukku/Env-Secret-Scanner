import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { buildForensicTimeline } from '@/lib/analytics/security-events.js';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const url = new URL(req.url);
  const repositoryId = url.searchParams.get('repositoryId');
  const fingerprint = url.searchParams.get('fingerprint');
  const findingId = url.searchParams.get('findingId');

  return jsonSuccess(buildForensicTimeline({
    organizationId: auth.organization.id,
    repositoryId,
    fingerprint,
    findingId,
    events: [],
  }));
}
