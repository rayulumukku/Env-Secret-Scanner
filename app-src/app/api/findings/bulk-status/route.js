/**
 * app/api/findings/bulk-status/route.js
 *
 * Bulk status update for findings (e.g. mark False Positive, Remediate, Ignore).
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { bulkUpdateFindings } from '@/lib/db/findings';
import { logAuditEvent } from '@/lib/db/audit';

const VALID_STATUSES = ['OPEN', 'CONFIRMED', 'FALSE_POSITIVE', 'IGNORED', 'REMEDIATED'];

export async function POST(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'FINDING_UPDATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { findingIds = [], status, note } = await req.json().catch(() => ({}));
  if (!Array.isArray(findingIds) || findingIds.length === 0) {
    return jsonError('At least one finding ID is required.', 'INVALID_FINDINGS', 400);
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    return jsonError(`Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`, 'INVALID_STATUS', 400);
  }

  const updatedList = await bulkUpdateFindings(findingIds, {
    status,
    note,
    userId: auth.user.id,
  });

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'FINDINGS_BULK_UPDATED',
    targetType: 'Finding',
    metadata: {
      count: findingIds.length,
      newStatus: status,
      note,
    },
  });

  return jsonSuccess({
    updatedCount: updatedList.length,
    findings: updatedList,
  });
}
