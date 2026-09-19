/**
 * @file app/api/security/exposure/route.js
 * @description Organization-wide secret exposure and fingerprint correlation API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityExposureData } from '@/lib/security/command-center';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const data = await getSecurityExposureData(auth.organization.id);
  return jsonSuccess(data);
}
