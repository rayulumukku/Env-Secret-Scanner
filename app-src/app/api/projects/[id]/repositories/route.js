/**
 * app/api/projects/[id]/repositories/route.js
 *
 * Repositories associated with a project.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { findProjectById } from '@/lib/db/projects';
import { listRepositoriesByProject, createRepository } from '@/lib/db/repositories';
import { logAuditEvent } from '@/lib/db/audit';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const project = await findProjectById(id, auth.organization.id);
  if (!project) return jsonNotFound('Project not found');

  const repos = await listRepositoriesByProject(id);
  return jsonSuccess(repos);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'REPO_CONNECT' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const project = await findProjectById(id, auth.organization.id);
  if (!project) return jsonNotFound('Project not found');

  const body = await req.json().catch(() => ({}));
  const { name, fullName, provider = 'LOCAL', externalId, isPrivate, defaultBranch, htmlUrl, description } = body;

  if (!name) {
    return jsonError('Repository name is required.', 'INVALID_REPO', 400);
  }

  const repo = await createRepository({
    projectId: id,
    provider,
    externalId,
    name,
    fullName: fullName || name,
    isPrivate: Boolean(isPrivate),
    defaultBranch: defaultBranch || 'main',
    htmlUrl,
    description,
  });

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'REPOSITORY_CONNECTED',
    targetType: 'Repository',
    targetId: repo.id,
    metadata: { name: repo.name, provider: repo.provider },
  });

  return jsonSuccess(repo, 201);
}
