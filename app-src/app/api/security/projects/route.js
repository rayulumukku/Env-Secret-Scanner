/**
 * @file app/api/security/projects/route.js
 * @description Organization project security posture API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityProjectsData } from '@/lib/security/command-center';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const data = await getSecurityProjectsData(auth.organization.id);
  return jsonSuccess(data);
}
