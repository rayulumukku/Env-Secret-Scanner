/**
 * app/api/organizations/[orgId]/route.js
 *
 * Single organization retrieval, update, and deletion.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { findOrganizationById, updateOrganization } from '@/lib/db/organizations';
import { hasPermission } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/db/audit';

export async function GET(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const org = await findOrganizationById(orgId);
  if (!org) return jsonNotFound('Organization not found');

  return jsonSuccess(org);
}

export async function PATCH(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId, requiredPermission: 'ORG_UPDATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const body = await req.json().catch(() => ({}));
  const { name, plan } = body;

  const updated = await updateOrganization(orgId, {
    ...(name ? { name } : {}),
    ...(plan ? { plan } : {}),
  });

  await logAuditEvent({
    organizationId: orgId,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'ORGANIZATION_UPDATED',
    targetType: 'Organization',
    targetId: orgId,
    metadata: { name, plan },
  });

  return jsonSuccess(updated);
}
