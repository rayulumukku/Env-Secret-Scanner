/**
 * lib/providers/github/commits.js
 *
 * Commit retrieval and diff operations for GitHub App.
 */

import { getInstallationAccessToken, githubAppRequest } from './app.js';

/**
 * Get commit diff and files for a push or commit SHA.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 * @param {string} sha
 */
export async function getInstallationCommitDiff(installationId, owner, repo, sha) {
  const token = await getInstallationAccessToken(installationId);
  return githubAppRequest(`/repos/${owner}/${repo}/commits/${sha}`, token);
}

/**
 * Compare two commits (base...head) to get all changed files and patches.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 * @param {string} base
 * @param {string} head
 */
export async function compareCommits(installationId, owner, repo, base, head) {
  const token = await getInstallationAccessToken(installationId);
  return githubAppRequest(`/repos/${owner}/${repo}/compare/${base}...${head}`, token);
}
