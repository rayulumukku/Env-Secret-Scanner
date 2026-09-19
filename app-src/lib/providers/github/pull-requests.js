/**
 * lib/providers/github/pull-requests.js
 *
 * Pull Request interactions for GitHub App.
 */

import { getInstallationAccessToken, githubAppRequest } from './app.js';

/**
 * Get PR metadata.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 * @param {number} pullNumber
 */
export async function getPullRequest(installationId, owner, repo, pullNumber) {
  const token = await getInstallationAccessToken(installationId);
  return githubAppRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}`, token);
}

/**
 * List files modified in a Pull Request (up to 300 files).
 * Returns array of { filename, status, additions, deletions, changes, patch, raw_url, contents_url, sha }.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 * @param {number} pullNumber
 */
export async function listPullRequestFiles(installationId, owner, repo, pullNumber) {
  const token = await getInstallationAccessToken(installationId);
  const files = [];
  let page = 1;
  const perPage = 100;

  while (page <= 3) {
    const batch = await githubAppRequest(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=${perPage}&page=${page}`,
      token
    );
    if (!batch || batch.length === 0) break;
    files.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return files;
}

/**
 * List commits in a PR.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 * @param {number} pullNumber
 */
export async function listPullRequestCommits(installationId, owner, repo, pullNumber) {
  const token = await getInstallationAccessToken(installationId);
  return githubAppRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}/commits?per_page=100`, token);
}
