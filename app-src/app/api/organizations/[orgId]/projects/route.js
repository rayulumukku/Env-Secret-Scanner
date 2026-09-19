/**
 * app/api/organizations/[orgId]/projects/route.js
 *
 * List and create projects within an organization.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listProjects, createProject } from '@/lib/db/projects';
import { logAuditEvent } from '@/lib/db/audit';

export async function GET(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId, requiredPermission: 'PROJECT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const projects = await listProjects(orgId);
  return jsonSuccess(projects);
}

export async function POST(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId, requiredPermission: 'PROJECT_CREATE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { name, description, severityThreshold } = await req.json().catch(() => ({}));
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return jsonError('Project name is required.', 'INVALID_NAME', 400);
  }

  const project = await createProject({
    organizationId: orgId,
    name: name.trim(),
    description,
    severityThreshold: severityThreshold || 'LOW',
  });

  await logAuditEvent({
    organizationId: orgId,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'PROJECT_CREATED',
    targetType: 'Project',
    targetId: project.id,
    metadata: { name: project.name, slug: project.slug },
  });

  return jsonSuccess(project, 201);
}
