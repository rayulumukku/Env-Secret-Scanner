/**
 * @file app/api/policies/route.js
 * @description Organization Policy API: list and create security policies.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listPolicies, createPolicy } from '@/lib/db/policies';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const scopeId = searchParams.get('scopeId');
  const enabled = searchParams.get('enabled');

  const policies = await listPolicies(auth.organization.id, {
    scope,
    scopeId,
    enabled
  });

  return jsonSuccess(policies);
}

export async function POST(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  try {
    const body = await req.json();
    const policy = await createPolicy(
      {
        ...body,
        organizationId: auth.organization.id
      },
      {
        organizationId: auth.organization.id,
        userId: auth.user.id,
        userEmail: auth.user.email
      }
    );

    return jsonSuccess(policy, 201);
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
