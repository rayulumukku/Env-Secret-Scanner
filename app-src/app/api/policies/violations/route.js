/**
 * @file app/api/policies/violations/route.js
 * @description Organization policy violations query API endpoint.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listPolicyViolations } from '@/lib/db/policies';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'POLICY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get('policyId');
  const repositoryId = searchParams.get('repositoryId');
  const severity = searchParams.get('severity');
  const status = searchParams.get('status');

  const violations = await listPolicyViolations(auth.organization.id, {
    policyId,
    repositoryId,
    severity,
    status
  });

  return jsonSuccess(violations);
}
