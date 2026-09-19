/**
 * @file app/api/security/digest/route.js
 * @description Organization weekly security digest API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityDigestData } from '@/lib/security/command-center';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const data = await getSecurityDigestData(auth.organization.id);
  return jsonSuccess(data);
}
