export function validateScopedQuery({ organizationId, projectId = null, repositoryId = null }) {
  if (!organizationId) {
    return { allowed: false, reason: 'organizationId is required' };
  }

  if (projectId && typeof projectId !== 'string') {
    return { allowed: false, reason: 'projectId must be a string when provided' };
  }

  if (repositoryId && typeof repositoryId !== 'string') {
    return { allowed: false, reason: 'repositoryId must be a string when provided' };
  }

  return { allowed: true, reason: null };
}
