/**
 * lib/jobs/github-check-job.js
 *
 * Worker job to publish GitHub Check Run results and PR comments.
 */

import { createOrUpdateCheckRun } from '../providers/github/checks.js';
import { postOrUpdatePRComment } from '../providers/github/comments.js';

/**
 * Handle GITHUB_CHECK job.
 *
 * @param {object} payload
 */
export async function executeGitHubCheckJob(payload) {
  const {
    installationId,
    owner,
    repo,
    headSha,
    pullNumber,
    findings = [],
    filesScanned = 0,
    threshold = 'LOW',
    scanId,
    projectId,
  } = payload;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const detailsUrl = `${baseUrl}/projects/${projectId}/pull-requests`;

  const results = {};

  // 1. Create/Update GitHub Check Run
  try {
    const checkRun = await createOrUpdateCheckRun({
      installationId,
      owner,
      repo,
      headSha,
      status: 'completed',
      findings,
      scanResult: { filesScanned, scanId },
      threshold,
      detailsUrl,
    });
    results.checkRun = checkRun;
  } catch (err) {
    console.error('[GitHubCheckJob] Failed to create check run:', err.message);
    results.checkRunError = err.message;
  }

  // 2. Post or update PR comment if PR number is available
  if (pullNumber) {
    try {
      const comment = await postOrUpdatePRComment({
        installationId,
        owner,
        repo,
        pullNumber,
        scanData: {
          filesScanned,
          findings,
          threshold,
          scanId,
        },
      });
      results.comment = comment;
    } catch (err) {
      console.error('[GitHubCheckJob] Failed to post PR comment:', err.message);
      results.commentError = err.message;
    }
  }

  return results;
}
