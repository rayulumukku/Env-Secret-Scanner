/**
 * app/api/projects/[id]/rules/route.js
 *
 * Custom detection rules management.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listCustomRules, createCustomRule } from '@/lib/db/rules';
import { logAuditEvent } from '@/lib/db/audit';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const rules = await listCustomRules(auth.organization.id, id);
  return jsonSuccess(rules);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'RULE_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { name, pattern, severity = 'HIGH', category = 'Custom', description } = await req.json().catch(() => ({}));

  if (!name || !pattern) {
    return jsonError('Rule name and regex pattern are required.', 'INVALID_RULE', 400);
  }

  // Validate regex syntax
  try {
    new RegExp(pattern);
  } catch (err) {
    return jsonError(`Invalid regex pattern: ${err.message}`, 'INVALID_REGEX', 400);
  }

  const rule = await createCustomRule({
    organizationId: auth.organization.id,
    projectId: id,
    name,
    pattern,
    severity,
    category,
    description,
  });

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'RULE_CREATED',
    targetType: 'CustomRule',
    targetId: rule.id,
    metadata: { name, severity },
  });

  return jsonSuccess(rule, 201);
}
