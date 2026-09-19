/**
 * lib/providers/github/comments.js
 *
 * Pull Request comment management.
 * Avoids duplicate comments by updating previous SecretShield comments.
 */

import { getInstallationAccessToken, githubAppRequest } from './app.js';

const COMMENT_MARKER = '<!-- secretshield-pr-scan-comment -->';

/**
 * Format PR comment markdown.
 * ZERO-EXPOSURE GUARANTEED.
 */
export function formatPRComment({ filesScanned = 0, findings = [], threshold = 'LOW', scanId = null }) {
  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;
  const low = findings.filter(f => f.severity === 'LOW').length;
  const total = findings.length;

  const statusBadge = total === 0
    ? '✅ **Pass**'
    : critical > 0 || high > 0
    ? '❌ **Action Required**'
    : '⚠️ **Warnings Found**';

  const lines = [
    COMMENT_MARKER,
    '## 🛡️ SecretShield Security Scan',
    '',
    `**Status**: ${statusBadge}`,
    '',
    `**Files Scanned**: ${filesScanned} | **Total Findings**: ${total}`,
    '',
    '| Severity | Count |',
    '| :--- | :--- |',
    `| 🔴 Critical | **${critical}** |`,
    `| 🟠 High | **${high}** |`,
    `| 🟡 Medium | **${medium}** |`,
    `| 🔵 Low | **${low}** |`,
    '',
  ];

  if (total > 0) {
    lines.push('### Summary of Findings:');
    lines.push('');
    findings.slice(0, 10).forEach(f => {
      lines.push(`- **${f.severity}**: \`${f.type || f.ruleId}\` in \`${f.file}:${f.line}\``);
    });
    if (findings.length > 10) {
      lines.push(`- *...and ${findings.length - 10} more findings.*`);
    }
    lines.push('');
  }

  lines.push('---', '🔒 *Protected by SecretShield zero-exposure engine. Raw secret values are never transmitted.*');
  return lines.join('\n');
}

/**
 * Post or update a SecretShield PR comment.
 *
 * @param {object} params
 * @param {string|number} params.installationId
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.pullNumber
 * @param {object} params.scanData
 */
export async function postOrUpdatePRComment({
  installationId,
  owner,
  repo,
  pullNumber,
  scanData = {},
}) {
  const token = await getInstallationAccessToken(installationId);
  const commentBody = formatPRComment(scanData);

  try {
    // List existing comments on the PR (issues endpoint handles PR comments)
    const comments = await githubAppRequest(
      `/repos/${owner}/${repo}/issues/${pullNumber}/comments?per_page=100`,
      token
    );

    const existingComment = (comments || []).find(c => c.body && c.body.includes(COMMENT_MARKER));

    if (existingComment) {
      return githubAppRequest(
        `/repos/${owner}/${repo}/issues/comments/${existingComment.id}`,
        token,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: commentBody }),
        }
      );
    }

    return githubAppRequest(
      `/repos/${owner}/${repo}/issues/${pullNumber}/comments`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      }
    );
  } catch (err) {
    console.error(`[GitHub PR Comment] Failed to post comment on PR #${pullNumber}:`, err.message);
    return null;
  }
}
