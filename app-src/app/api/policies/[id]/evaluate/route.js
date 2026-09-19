/**
 * @file app/api/policies/[id]/evaluate/route.js
 * @description Evaluates a specific policy against a target payload.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getPolicyById } from '@/lib/db/policies';
import { evaluateTargetPolicies } from '@/lib/policies/engine';

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_EVALUATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const policy = await getPolicyById(id, auth.organization.id);
  if (!policy) return jsonNotFound('Policy not found');

  try {
    const body = await req.json();
    const result = await evaluateTargetPolicies(
      {
        ...body,
        organizationId: auth.organization.id
      },
      [policy],
      { isSimulation: Boolean(body.isSimulation) }
    );

    return jsonSuccess(result);
  } catch (err) {
    return jsonError(err.message, 400);
  }
}
