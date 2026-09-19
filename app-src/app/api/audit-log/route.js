/**
 * app/api/audit-log/route.js
 *
 * Security Audit Log query endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listAuditLogs } from '@/lib/db/audit';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'AUDIT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || undefined;
  const targetType = searchParams.get('targetType') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const logs = await listAuditLogs(auth.organization.id, { limit, action, targetType });
  return jsonSuccess(logs);
}
