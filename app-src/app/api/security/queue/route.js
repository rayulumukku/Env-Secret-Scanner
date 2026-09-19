/**
 * @file app/api/security/queue/route.js
 * @description Prioritized Security Findings Queue API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityQueueData } from '@/lib/security/command-center';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const severity = searchParams.get('severity') || 'ALL';
  const category = searchParams.get('category') || 'ALL';
  const status = searchParams.get('status') || 'ALL';

  const data = await getSecurityQueueData(auth.organization.id, {
    severity,
    category,
    status
  });

  return jsonSuccess(data);
}
