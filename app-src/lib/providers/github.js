/**
 * lib/providers/github.js
 *
 * Full GitHub provider implementation using the GitHub REST API.
 *
 * Environment variables:
 *   GITHUB_CLIENT_ID      — GitHub OAuth App client ID
 *   GITHUB_CLIENT_SECRET  — GitHub OAuth App client secret
 *   GITHUB_REDIRECT_URI   — Must match the callback URL registered in GitHub
 *
 * SECURITY:
 *   - OAuth tokens are NEVER stored client-side (not in localStorage, not in JS state)
 *   - Tokens flow server-side only via HTTP-only cookies
 *   - OAuth CSRF state is validated via cookie comparison
 *   - Raw secrets from scanned repositories are never logged or stored
 *   - Minimum required scope: "repo" (public repos only) or "read:user repo"
 */

const GITHUB_API = 'https://api.github.com';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

// ── CONFIGURATION ─────────────────────────────────────────────────────────────

export const GITHUB_PROVIDER = {
  id: 'github',
  name: 'GitHub',
  description: 'Scan GitHub repositories for exposed secrets',
};

/**
 * Whether GitHub OAuth is configured via environment variables.
 */
export function isGitHubConfigured() {
  return !!(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
  );
}

// ── OAUTH ─────────────────────────────────────────────────────────────────────

/**
 * Generate an OAuth authorization URL with a random CSRF state.
 *
 * @param {string} state - cryptographically random state for CSRF protection
 * @returns {string} authorization URL
 */
export function buildGitHubAuthUrl(state) {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
  }

  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI || getDefaultRedirectUri(),
    scope:        'repo',    // minimum scope: read access to repos
    state,
    allow_signup: 'false',
  });
  return `${GITHUB_OAUTH_URL}?${params}`;
}

function getDefaultRedirectUri() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${base}/api/providers/github/callback`;
}

/**
 * Exchange an authorization code for an access token.
 * Called server-side only. Token is never sent to the client.
 *
 * @param {string} code
 * @returns {Promise<string>} access token
 */
export async function exchangeCodeForToken(code) {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub OAuth is not configured.');
  }

  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id:     process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri:  process.env.GITHUB_REDIRECT_URI || getDefaultRedirectUri(),
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  if (!data.access_token) {
    throw new Error('No access token received from GitHub.');
  }

  // SECURITY: return token to caller — caller stores it in HTTP-only cookie only
  return data.access_token;
}

// ── AUTHENTICATED API CALLS ───────────────────────────────────────────────────

/**
 * Internal helper for GitHub API requests.
 * SECURITY: token is a server-side-only value, never exposed to client.
 */
async function githubApi(endpoint, token, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new Error('GitHub token is invalid or expired. Please reconnect.');
  }
  if (res.status === 403) {
    throw new Error('GitHub API rate limit exceeded or insufficient permissions.');
  }
  if (res.status === 404) {
    throw new Error('Repository not found or not accessible.');
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  // Some endpoints return empty bodies (e.g., rate limit checks)
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Get the authenticated user.
 * @param {string} token
 */
export async function getAuthenticatedUser(token) {
  return githubApi('/user', token);
}

/**
 * List repositories for the authenticated user.
 * @param {string} token
 * @param {object} options
 * @param {number} options.page
 * @param {number} options.perPage
 * @param {string} options.sort - "updated" | "full_name"
 * @returns {Promise<object[]>} repository list
 */
export async function getRepositories(token, options = {}) {
  const { page = 1, perPage = 30, sort = 'updated' } = options;
  const params = new URLSearchParams({
    sort,
    per_page: perPage,
    page,
    affiliation: 'owner,collaborator',
  });
  return githubApi(`/user/repos?${params}`, token);
}

/**
 * Get a single repository.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 */
export async function getRepository(token, owner, repo) {
  return githubApi(`/repos/${owner}/${repo}`, token);
}

/**
 * List branches for a repository.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 */
export async function getBranches(token, owner, repo) {
  const params = new URLSearchParams({ per_page: 100 });
  return githubApi(`/repos/${owner}/${repo}/branches?${params}`, token);
}

/**
 * Download a repository archive as a buffer.
 * Uses the tarball endpoint and follows redirects.
 *
 * SECURITY: Archive is returned as a Buffer for in-memory processing only.
 * It is never written to disk.
 *
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref - branch name or commit hash
 * @returns {Promise<{buffer: Buffer, filename: string}>}
 */
export async function getArchive(token, owner, repo, ref = 'HEAD') {
  // GitHub returns a redirect to a temporary S3 URL
  const url = `${GITHUB_API}/repos/${owner}/${repo}/zipball/${ref}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to download repository archive: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${owner}-${repo}-${ref}.zip`;

  return { buffer, filename };
}

// ── GIT HISTORY VIA GITHUB API ────────────────────────────────────────────────

/**
 * List commits for a repository branch.
 *
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {object} options
 * @param {string} options.sha - branch or commit to start from
 * @param {number} options.page
 * @param {number} options.perPage
 * @returns {Promise<object[]>} commits (without diffs)
 */
export async function listCommits(token, owner, repo, options = {}) {
  const { sha = 'HEAD', page = 1, perPage = 50 } = options;
  const params = new URLSearchParams({ sha, per_page: perPage, page });
  return githubApi(`/repos/${owner}/${repo}/commits?${params}`, token);
}

/**
 * Get a single commit with its diff (patch data).
 *
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} hash - commit hash
 * @returns {Promise<object>} commit with files[].patch
 */
export async function getCommitDiff(token, owner, repo, hash) {
  return githubApi(`/repos/${owner}/${repo}/commits/${hash}`, token);
}

/**
 * Get the rate limit status (for diagnostics).
 * @param {string} token
 */
export async function getRateLimit(token) {
  return githubApi('/rate_limit', token);
}
