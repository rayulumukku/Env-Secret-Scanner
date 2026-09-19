/**
 * app/api/projects/[id]/route.js
 *
 * Single project details, update, and deletion.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { findProjectById, updateProject, deleteProject } from '@/lib/db/projects';
import { logAuditEvent } from '@/lib/db/audit';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const project = await findProjectById(id, auth.organization.id);
  if (!project) return jsonNotFound('Project not found in this organization');

  return jsonSuccess(project);
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_UPDATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const body = await req.json().catch(() => ({}));
  const { name, description, severityThreshold } = body;

  const updated = await updateProject(id, auth.organization.id, {
    ...(name ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(severityThreshold ? { severityThreshold } : {}),
  });

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'PROJECT_UPDATED',
    targetType: 'Project',
    targetId: id,
    metadata: { name, description, severityThreshold },
  });

  return jsonSuccess(updated);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_DELETE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const deleted = await deleteProject(id, auth.organization.id);
  if (!deleted) return jsonNotFound('Project not found or already deleted');

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'PROJECT_DELETED',
    targetType: 'Project',
    targetId: id,
  });

  return jsonSuccess({ message: 'Project deleted successfully' });
}
