/**
 * lib/providers/gitlab.js
 *
 * GitLab provider — clean interface architecture.
 *
 * Environment variables:
 *   GITLAB_CLIENT_ID
 *   GITLAB_CLIENT_SECRET
 *   GITLAB_REDIRECT_URI
 *   GITLAB_BASE_URL   (optional, defaults to https://gitlab.com for SaaS; set for self-hosted)
 *
 * Status: Provider interface is defined and ready.
 * Full OAuth integration requires the above env vars.
 * The app continues working without them.
 *
 * Interface mirrors GitHub provider for interoperability.
 */

const GITLAB_BASE    = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
const GITLAB_API     = `${GITLAB_BASE}/api/v4`;
const GITLAB_OAUTH   = `${GITLAB_BASE}/oauth/authorize`;
const GITLAB_TOKEN   = `${GITLAB_BASE}/oauth/token`;

// ── CONFIGURATION ─────────────────────────────────────────────────────────────

export const GITLAB_PROVIDER = {
  id:          'gitlab',
  name:        'GitLab',
  description: 'Scan GitLab repositories for exposed secrets',
};

export function isGitLabConfigured() {
  return !!(
    process.env.GITLAB_CLIENT_ID &&
    process.env.GITLAB_CLIENT_SECRET
  );
}

// ── OAUTH ─────────────────────────────────────────────────────────────────────

export function buildGitLabAuthUrl(state) {
  if (!isGitLabConfigured()) {
    throw new Error('GitLab OAuth is not configured. Set GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET.');
  }

  const redirectUri = process.env.GITLAB_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/providers/gitlab/callback`;

  const params = new URLSearchParams({
    client_id:    process.env.GITLAB_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type:'code',
    state,
    scope:        'read_api read_repository',
  });

  return `${GITLAB_OAUTH}?${params}`;
}

export async function exchangeCodeForToken(code) {
  if (!isGitLabConfigured()) {
    throw new Error('GitLab OAuth is not configured.');
  }

  const redirectUri = process.env.GITLAB_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/providers/gitlab/callback`;

  const res = await fetch(GITLAB_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.GITLAB_CLIENT_ID,
      client_secret: process.env.GITLAB_CLIENT_SECRET,
      code,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  });

  if (!res.ok) throw new Error(`GitLab token exchange failed: ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(`GitLab OAuth error: ${data.error_description || data.error}`);
  if (!data.access_token) throw new Error('No access token received from GitLab.');

  return data.access_token;
}

// ── AUTHENTICATED API ─────────────────────────────────────────────────────────

async function gitlabApi(endpoint, token) {
  const url = endpoint.startsWith('http') ? endpoint : `${GITLAB_API}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  if (res.status === 401) throw new Error('GitLab token is invalid or expired.');
  if (res.status === 403) throw new Error('Insufficient GitLab permissions.');
  if (res.status === 404) throw new Error('Project not found.');
  if (!res.ok) throw new Error(`GitLab API error: ${res.status}`);

  return res.json();
}

// ── PROVIDER INTERFACE ────────────────────────────────────────────────────────

/**
 * Get authenticated user.
 * @param {string} token
 */
export async function getAuthenticatedUser(token) {
  return gitlabApi('/user', token);
}

/**
 * List projects for the authenticated user.
 * @param {string} token
 * @param {object} options
 */
export async function getRepositories(token, options = {}) {
  const { page = 1, perPage = 30 } = options;
  const params = new URLSearchParams({
    membership: 'true',
    order_by:   'last_activity_at',
    per_page:   perPage,
    page,
  });
  return gitlabApi(`/projects?${params}`, token);
}

/**
 * Get a single project.
 * @param {string} token
 * @param {string|number} projectId - numeric ID or "owner%2Frepo" URL-encoded
 */
export async function getRepository(token, projectId) {
  return gitlabApi(`/projects/${encodeURIComponent(projectId)}`, token);
}

/**
 * List branches.
 * @param {string} token
 * @param {string|number} projectId
 */
export async function getBranches(token, projectId) {
  return gitlabApi(`/projects/${encodeURIComponent(projectId)}/repository/branches?per_page=100`, token);
}

/**
 * Download repository archive.
 * Returns a ZIP buffer for in-memory processing.
 *
 * @param {string} token
 * @param {string|number} projectId
 * @param {string} ref - branch or commit
 * @returns {Promise<{buffer: Buffer, filename: string}>}
 */
export async function getArchive(token, projectId, ref = 'HEAD') {
  const url = `${GITLAB_API}/projects/${encodeURIComponent(projectId)}/repository/archive.zip?sha=${ref}`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Failed to download GitLab archive: ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer:   Buffer.from(arrayBuffer),
    filename: `gitlab-${projectId}-${ref}.zip`,
  };
}

/**
 * List commits.
 * @param {string} token
 * @param {string|number} projectId
 * @param {object} options
 */
export async function listCommits(token, projectId, options = {}) {
  const { ref = 'HEAD', page = 1, perPage = 50 } = options;
  const params = new URLSearchParams({ ref_name: ref, per_page: perPage, page });
  return gitlabApi(`/projects/${encodeURIComponent(projectId)}/repository/commits?${params}`, token);
}

/**
 * Get a single commit with diff.
 * @param {string} token
 * @param {string|number} projectId
 * @param {string} sha
 */
export async function getCommitDiff(token, projectId, sha) {
  return gitlabApi(`/projects/${encodeURIComponent(projectId)}/repository/commits/${sha}/diff`, token);
}
