/**
 * lib/providers/github/installation.js
 *
 * Manage GitHub App installations and repository synchronization.
 */

import { generateGitHubAppJwt, getInstallationAccessToken, githubAppRequest } from './app.js';

/**
 * List all installations for the GitHub App.
 * Called using the App JWT.
 */
export async function listAppInstallations() {
  const jwt = generateGitHubAppJwt();
  const res = await githubAppRequest('/app/installations', jwt);
  return res || [];
}

/**
 * Get details for a specific installation ID.
 *
 * @param {string|number} installationId
 */
export async function getAppInstallation(installationId) {
  const jwt = generateGitHubAppJwt();
  return githubAppRequest(`/app/installations/${installationId}`, jwt);
}

/**
 * List accessible repositories for an installation.
 *
 * @param {string|number} installationId
 * @param {object} options
 */
export async function listInstallationRepositories(installationId, options = {}) {
  const { page = 1, perPage = 100 } = options;
  const token = await getInstallationAccessToken(installationId);
  const data = await githubAppRequest(`/installation/repositories?per_page=${perPage}&page=${page}`, token);
  return data?.repositories || [];
}

/**
 * Build URL to initiate GitHub App installation on GitHub.
 *
 * @param {string} state - Random CSRF state
 * @returns {string}
 */
export function getAppInstallationUrl(state) {
  const appSlug = process.env.GITHUB_APP_SLUG || 'secretshield-security';
  const baseUrl = `https://github.com/apps/${appSlug}/installations/new`;
  return state ? `${baseUrl}?state=${encodeURIComponent(state)}` : baseUrl;
}
