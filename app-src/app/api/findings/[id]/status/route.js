/**
 * app/api/findings/[id]/status/route.js
 *
 * Finding Lifecycle transition endpoint.
 *
 * Statuses:
 *   - OPEN
 *   - CONFIRMED
 *   - FALSE_POSITIVE
 *   - IGNORED
 *   - REMEDIATED
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { updateFindingStatus } from '@/lib/db/findings';
import { logAuditEvent } from '@/lib/db/audit';
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher';

const VALID_STATUSES = ['OPEN', 'CONFIRMED', 'FALSE_POSITIVE', 'IGNORED', 'REMEDIATED'];

export async function PATCH(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'FINDING_UPDATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { status, note } = await req.json().catch(() => ({}));
  if (!status || !VALID_STATUSES.includes(status)) {
    return jsonError(`Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`, 'INVALID_STATUS', 400);
  }

  const updated = await updateFindingStatus(id, {
    status,
    note,
    userId: auth.user.id,
  });

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'FINDING_STATUS_CHANGED',
    targetType: 'Finding',
    targetId: id,
    metadata: {
      newStatus: status,
      note,
      fingerprint: updated.fingerprint,
      ruleId: updated.ruleId,
    },
  });

  if (status === 'REMEDIATED') {
    await dispatchWebhookEvent(auth.organization.id, 'finding.resolved', {
      findingId: id,
      fingerprint: updated.fingerprint,
      resolvedBy: auth.user.email,
    }, { projectId: updated.projectId });
  }

  return jsonSuccess(updated);
}
