/**
 * @file app/api/security/trends/route.js
 * @description Organization-wide security trends API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityTrendsData } from '@/lib/security/command-center';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '30d';
  const unit = searchParams.get('unit') || 'count';

  const data = await getSecurityTrendsData(auth.organization.id, range, unit);
  return jsonSuccess(data);
}
