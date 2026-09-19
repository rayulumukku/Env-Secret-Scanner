/**
 * lib/providers/github/repositories.js
 *
 * Repository operations for GitHub App.
 */

import { getInstallationAccessToken, githubAppRequest } from './app.js';

/**
 * Get repository details via installation token.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 */
export async function getInstallationRepository(installationId, owner, repo) {
  const token = await getInstallationAccessToken(installationId);
  return githubAppRequest(`/repos/${owner}/${repo}`, token);
}

/**
 * List branches for a repository.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 */
export async function getInstallationBranches(installationId, owner, repo) {
  const token = await getInstallationAccessToken(installationId);
  return githubAppRequest(`/repos/${owner}/${repo}/branches?per_page=100`, token);
}
