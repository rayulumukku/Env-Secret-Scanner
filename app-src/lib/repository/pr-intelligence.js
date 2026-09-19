/**
 * @file lib/repository/pr-intelligence.js
 * @description Pull Request intelligence, lifecycle timeline, GitHub Check output, and PR finding categorization.
 * 
 * CORE RULES:
 *   1. PR Finding Categorization: INTRODUCED_BY_PR, EXISTING, RESOLVED_BY_PR.
 *   2. A PR is NOT blocked solely because of pre-existing findings in base branch.
 *   3. GitHub Check output never contains raw credentials and links back to SecretShield finding pages.
 */

import { compareBranches } from './comparison.js';

/**
 * @typedef {Object} PullRequestMetadata
 * @property {number} number
 * @property {string} title
 * @property {string} author
 * @property {string} sourceBranch
 * @property {string} targetBranch
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} commitCount
 * @property {string} [htmlUrl]
 */

/**
 * In-memory PR registry for fast lookup during development / local server runs.
 */
const pullRequestStore = new Map();

/**
 * Creates or updates safe PR metadata.
 * 
 * @param {PullRequestMetadata} data 
 * @returns {PullRequestMetadata}
 */
export function savePullRequestMetadata(data) {
  const key = `${data.repositoryId || 'repo'}_${data.number}`;
  const pr = {
    number: data.number,
    title: data.title || `PR #${data.number}`,
    author: data.author || 'Developer',
    sourceBranch: data.sourceBranch || 'feature',
    targetBranch: data.targetBranch || 'main',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    commitCount: data.commitCount || 1,
    htmlUrl: data.htmlUrl || `https://github.com/pull/${data.number}`,
    repositoryId: data.repositoryId || 'default'
  };
  pullRequestStore.set(key, pr);
  return pr;
}

/**
 * Evaluates the security status of a Pull Request.
 * 
 * @param {PullRequestMetadata} pr 
 * @param {Array<Object>} prFindings - Findings detected in PR branch
 * @param {Array<Object>} baseFindings - Findings existing in target branch
 * @param {Object} [options]
 * @returns {Object} Full PR evaluation report
 */
export function evaluatePullRequestSecurity(pr, prFindings = [], baseFindings = [], options = {}) {
  const comparison = compareBranches(baseFindings, prFindings, {
    baseBranch: pr?.targetBranch || 'main',
    compareBranch: pr?.sourceBranch || 'feature'
  });

  const introduced = comparison.newFindings;
  const existing = comparison.persistentFindings;
  const resolved = comparison.resolvedFindings;

  // Gate is FAILED only if NEW findings were introduced by this PR
  const isFailed = introduced.length > 0;
  const status = isFailed ? 'FAILED' : 'PASSED';

  // Summaries
  let summaryMessage = 'All security checks passed. No new secrets introduced.';
  if (isFailed) {
    const criticals = introduced.filter(f => f.severity === 'CRITICAL').length;
    const highs = introduced.filter(f => f.severity === 'HIGH').length;
    summaryMessage = `${introduced.length} secret finding(s) introduced by this PR (${criticals} CRITICAL, ${highs} HIGH).`;
  } else if (existing.length > 0) {
    summaryMessage = `Clean PR. Notice: ${existing.length} pre-existing finding(s) remain in base branch (not introduced by this PR).`;
  }

  return {
    prNumber: pr?.number,
    status,
    isPassed: !isFailed,
    summaryMessage,
    introducedFindings: introduced,
    existingFindings: existing,
    resolvedFindings: resolved,
    counts: {
      introduced: introduced.length,
      existing: existing.length,
      resolved: resolved.length,
      totalInBranch: prFindings.length
    },
    comparison
  };
}

/**
 * Formats a GitHub Check Run title, summary, and markdown text without revealing secrets.
 * 
 * @param {Object} evaluation - Result from evaluatePullRequestSecurity
 * @param {string} [baseUrl='https://secretshield.dev']
 * @returns {{ title: string, summary: string, text: string, conclusion: 'success'|'failure'|'neutral' }}
 */
export function formatGitHubCheckRunOutput(evaluation, baseUrl = 'https://secretshield.dev') {
  const isPassed = evaluation.isPassed;
  const conclusion = isPassed ? 'success' : 'failure';
  const title = isPassed ? 'SecretShield: Clean (No Secrets Introduced)' : `SecretShield: ${evaluation.counts.introduced} New Secret(s) Detected`;

  const lines = [
    `## 🛡️ SecretShield Security Scan`,
    ``,
    `**Status:** \`${isPassed ? 'PASSED' : 'FAILED'}\``,
    ``,
    `### Overview`,
    `- **New Findings Introduced by this PR:** \`${evaluation.counts.introduced}\``,
    `- **Pre-existing Base Findings (Not blocking):** \`${evaluation.counts.existing}\``,
    `- **Findings Resolved by this PR:** \`${evaluation.counts.resolved}\``,
    ``
  ];

  if (!isPassed && evaluation.introducedFindings.length > 0) {
    lines.push(`### ⚠️ Action Required: Newly Introduced Credentials`);
    lines.push(`The following credentials were added in this pull request and must be removed before merging:`);
    lines.push(``);
    lines.push(`| Severity | Rule | File | Location | Finding Link |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- |`);

    for (const f of evaluation.introducedFindings) {
      const link = f.id ? `[Inspect Finding](${baseUrl}/findings/${f.id})` : `[View in App](${baseUrl}/findings)`;
      lines.push(`| **${f.severity}** | \`${f.ruleName || f.ruleId}\` | \`${f.file}\` | Line ${f.line || 1} | ${link} |`);
    }

    lines.push(``);
    lines.push(`> 🔒 **Security Notice**: Raw credentials are automatically masked into safe fingerprints. Please revoke and rotate any committed keys.`);
  } else {
    lines.push(`### ✅ Security Checks Passed`);
    lines.push(`This pull request does not introduce any new secrets into the codebase.`);
    if (evaluation.counts.resolved > 0) {
      lines.push(`🎉 **Great job!** This PR resolved **${evaluation.counts.resolved}** historical finding(s).`);
    }
  }

  lines.push(``);
  lines.push(`---`);
  lines.push(`*Scanned by SecretShield • Zero-cloud deterministic security engine.*`);

  return {
    title,
    summary: evaluation.summaryMessage,
    text: lines.join('\n'),
    conclusion
  };
}

/**
 * Checks branch protection status for a GitHub repository.
 * 
 * @param {Object} [protectionData]
 * @returns {{ status: 'CONFIGURED'|'NOT_CONFIGURED'|'UNABLE_TO_DETERMINE', details: string, documentationUrl: string }}
 */
export function evaluateBranchProtectionStatus(protectionData = null) {
  if (!protectionData) {
    return {
      status: 'UNABLE_TO_DETERMINE',
      details: 'Branch protection data not available or insufficient GitHub App permissions.',
      documentationUrl: '/docs/github-protection'
    };
  }

  const contexts = protectionData.required_status_checks?.contexts || [];
  const hasSecretShieldCheck = contexts.some(c => c.toLowerCase().includes('secretshield'));

  if (hasSecretShieldCheck) {
    return {
      status: 'CONFIGURED',
      details: 'SecretShield is configured as a required status check on the default branch.',
      documentationUrl: '/docs/github-protection'
    };
  }

  return {
    status: 'NOT_CONFIGURED',
    details: 'SecretShield is not yet required for merge in GitHub branch protection rules.',
    documentationUrl: '/docs/github-protection'
  };
}
