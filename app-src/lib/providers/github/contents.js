/**
 * lib/providers/github/contents.js
 *
 * File content retrieval for GitHub App.
 */

import { getInstallationAccessToken, githubAppRequest } from './app.js';

/**
 * Get raw text content of a file at a specific Git reference.
 *
 * @param {string|number} installationId
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} ref - Branch name or commit SHA
 * @returns {Promise<string|null>} File contents or null if binary/empty/not found
 */
export async function getFileContent(installationId, owner, repo, path, ref = 'HEAD') {
  try {
    const token = await getInstallationAccessToken(installationId);
    const data = await githubAppRequest(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(ref)}`,
      token
    );

    if (!data || !data.content) return null;

    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }

    return String(data.content);
  } catch (err) {
    if (err.message && err.message.includes('404')) {
      return null;
    }
    throw err;
  }
}
