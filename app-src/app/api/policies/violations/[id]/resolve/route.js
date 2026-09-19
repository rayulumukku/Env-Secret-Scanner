/**
 * @file app/api/policies/violations/[id]/resolve/route.js
 * @description Resolve a policy violation with documented justification.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { resolvePolicyViolation } from '@/lib/db/policies';

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  try {
    const body = await req.json();
    const resolved = await resolvePolicyViolation(
      id,
      body,
      {
        organizationId: auth.organization.id,
        userId: auth.user.id,
        userEmail: auth.user.email
      }
    );

    return jsonSuccess(resolved);
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
