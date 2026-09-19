/**
 * app/api/projects/[id]/baselines/route.js
 *
 * Project baseline suppression management.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listBaselinesByProject, createBaseline } from '@/lib/db/baselines';
import { logAuditEvent } from '@/lib/db/audit';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const baselines = await listBaselinesByProject(id, auth.organization.id);
  return jsonSuccess(baselines);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'BASELINE_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { name = 'Default Baseline', description, entries = [] } = await req.json().catch(() => ({}));

  const baseline = await createBaseline({
    organizationId: auth.organization.id,
    projectId: id,
    name,
    description,
    entries,
    userId: auth.user.id,
  });

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'BASELINE_CREATED',
    targetType: 'Baseline',
    targetId: baseline.id,
    metadata: { name, count: entries.length },
  });

  return jsonSuccess(baseline, 201);
}
