/**
 * @file app/api/policies/[id]/route.js
 * @description Single Policy API: view, update (with versioning), and delete.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getPolicyById, updatePolicy, deletePolicy } from '@/lib/db/policies';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const policy = await getPolicyById(id, auth.organization.id);
  if (!policy) return jsonNotFound('Policy not found');

  return jsonSuccess(policy);
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  try {
    const updates = await req.json();
    const updated = await updatePolicy(id, updates, {
      organizationId: auth.organization.id,
      userId: auth.user.id,
      userEmail: auth.user.email
    });

    return jsonSuccess(updated);
  } catch (err) {
    return jsonError(err.message, 400);
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  try {
    const deleted = await deletePolicy(id, {
      organizationId: auth.organization.id,
      userId: auth.user.id,
      userEmail: auth.user.email
    });

    if (!deleted) return jsonNotFound('Policy not found');
    return jsonSuccess({ deleted: true, id });
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
