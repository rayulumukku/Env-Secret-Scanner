/**
 * @file app/api/security/ci/route.js
 * @description Organization CI/CD & Git hook protection status API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityCIData } from '@/lib/security/command-center';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const data = await getSecurityCIData(auth.organization.id);
  return jsonSuccess(data);
}
