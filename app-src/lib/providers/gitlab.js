/**
 * lib/providers/gitlab.js
 *
 * GitLab provider — architecture stub.
 *
 * Environment variables (not required for ZIP MVP):
 *   GITLAB_CLIENT_ID
 *   GITLAB_CLIENT_SECRET
 *   GITLAB_REDIRECT_URI
 *   GITLAB_BASE_URL (default: https://gitlab.com)
 *
 * Implementation planned for a future release.
 */

export const GITLAB_PROVIDER = {
  id: 'gitlab',
  name: 'GitLab',
  description: 'Connect your GitLab account to scan repositories',
  comingSoon: true,
};

export function isGitLabConfigured() {
  return !!(
    process.env.GITLAB_CLIENT_ID &&
    process.env.GITLAB_CLIENT_SECRET
  );
}

export function getGitLabAuthUrl() {
  if (!isGitLabConfigured()) {
    throw new Error('GitLab OAuth credentials are not configured.');
  }
  const base = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
  const params = new URLSearchParams({
    client_id: process.env.GITLAB_CLIENT_ID,
    redirect_uri: process.env.GITLAB_REDIRECT_URI || '',
    response_type: 'code',
    scope: 'read_api read_repository',
    state: crypto.randomUUID(),
  });
  return `${base}/oauth/authorize?${params}`;
}

export async function getRepositories(/* token */) {
  throw new Error('GitLab integration coming soon. Use ZIP upload for now.');
}

export async function getBranches(/* token, projectId */) {
  throw new Error('GitLab integration coming soon. Use ZIP upload for now.');
}

export async function getArchive(/* token, projectId, ref */) {
  throw new Error('GitLab integration coming soon. Use ZIP upload for now.');
}
