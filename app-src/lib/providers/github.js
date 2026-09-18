/**
 * lib/providers/github.js
 *
 * GitHub provider — architecture stub.
 *
 * Environment variables (not required for ZIP MVP):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 *   GITHUB_REDIRECT_URI
 *
 * Implementation planned for a future release.
 * The interface below mirrors local.js so the scanner can use either.
 */

export const GITHUB_PROVIDER = {
  id: 'github',
  name: 'GitHub',
  description: 'Connect your GitHub account to scan repositories',
  comingSoon: true,
};

/**
 * Check whether GitHub OAuth is configured.
 * @returns {boolean}
 */
export function isGitHubConfigured() {
  return !!(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
  );
}

/**
 * GitHub OAuth authorization URL.
 * @returns {string}
 */
export function getGitHubAuthUrl() {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub OAuth credentials are not configured.');
  }
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI || '',
    scope: 'repo read:org',
    state: crypto.randomUUID(),
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * Future interface methods — not yet implemented.
 * These will mirror the local provider interface once OAuth is complete.
 */
export async function getRepositories(/* token */) {
  throw new Error('GitHub integration coming soon. Use ZIP upload for now.');
}

export async function getBranches(/* token, owner, repo */) {
  throw new Error('GitHub integration coming soon. Use ZIP upload for now.');
}

export async function getArchive(/* token, owner, repo, ref */) {
  throw new Error('GitHub integration coming soon. Use ZIP upload for now.');
}
