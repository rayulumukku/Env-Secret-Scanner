/**
 * lib/providers/github/checks.js
 *
 * GitHub Checks API integration for SecretShield PR scanning.
 *
 * CRITICAL ZERO-EXPOSURE INVARIANT:
 *   - Check output and annotations MUST NEVER contain raw secret values.
 *   - Uses rule description, location (file:line), confidence score, and masked strings only.
 */

import { getInstallationAccessToken, githubAppRequest } from './app.js';

const CHECK_NAME = 'SecretShield Security Scan';

/**
 * Map severity to GitHub check annotation level.
 */
function mapSeverityToAnnotationLevel(severity) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return 'failure';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
    default:
      return 'notice';
  }
}

/**
 * Determine conclusion based on findings and threshold.
 */
function evaluateConclusion(findings = [], threshold = 'LOW') {
  const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  const targetRank = rank[threshold?.toUpperCase()] || 1;

  const failingFindings = findings.filter(f => {
    const sevRank = rank[f.severity?.toUpperCase()] || 1;
    return sevRank >= targetRank;
  });

  return failingFindings.length === 0 ? 'success' : 'failure';
}

/**
 * Format Check Run markdown summary.
 * ZERO-EXPOSURE GUARANTEED.
 */
export function formatCheckSummary(scanResult, findings = [], threshold = 'LOW') {
  const totalFindings = findings.length;
  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;
  const low = findings.filter(f => f.severity === 'LOW').length;

  if (totalFindings === 0) {
    return [
      '### 🛡️ SecretShield Security Scan Passed',
      '',
      '✓ **No secrets or credentials detected** in this pull request.',
      '',
      `*Files scanned: ${scanResult?.filesScanned || 0}*`,
    ].join('\n');
  }

  const lines = [
    `### ⚠️ ${totalFindings} Secret${totalFindings === 1 ? '' : 's'} Detected`,
    '',
    `| Critical | High | Medium | Low | Threshold |`,
    `| :---: | :---: | :---: | :---: | :---: |`,
    `| **${critical}** | **${high}** | **${medium}** | **${low}** | **${threshold}** |`,
    '',
    '#### Detected Exposures:',
    '',
  ];

  findings.slice(0, 25).forEach((f, idx) => {
    lines.push(`${idx + 1}. **${f.severity}**: \`${f.type || f.ruleId}\``);
    lines.push(`   - **Location**: \`${f.file}:${f.line}\``);
    lines.push(`   - **Confidence**: ${f.confidence || 50}%`);
    if (f.description) {
      lines.push(`   - **Description**: ${f.description}`);
    }
    lines.push('');
  });

  if (findings.length > 25) {
    lines.push(`*...and ${findings.length - 25} more findings. View full scan in SecretShield.*`);
  }

  lines.push('', '---', '🔒 *Protected by SecretShield zero-exposure engine. Raw secret values are never transmitted.*');
  return lines.join('\n');
}

/**
 * Create or update a GitHub Check Run.
 *
 * @param {object} params
 * @param {string|number} params.installationId
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} params.headSha
 * @param {string} [params.checkRunId] - Optional existing check run to update
 * @param {string} params.status - "queued" | "in_progress" | "completed"
 * @param {string} [params.conclusion] - "success" | "failure" | "neutral"
 * @param {object} params.scanResult
 * @param {Array} params.findings
 * @param {string} params.threshold
 */
export async function createOrUpdateCheckRun({
  installationId,
  owner,
  repo,
  headSha,
  checkRunId = null,
  status = 'completed',
  conclusion = null,
  scanResult = {},
  findings = [],
  threshold = 'LOW',
  detailsUrl = null,
}) {
  const token = await getInstallationAccessToken(installationId);
  const calculatedConclusion = conclusion || (status === 'completed' ? evaluateConclusion(findings, threshold) : null);

  const title = findings.length === 0
    ? 'SecretShield: Clean'
    : `SecretShield: ${findings.length} secret${findings.length === 1 ? '' : 's'} detected`;

  const summary = formatCheckSummary(scanResult, findings, threshold);

  // GitHub checks API supports max 50 annotations per request
  const annotations = findings.slice(0, 50).map(f => ({
    path: f.file,
    start_line: f.line,
    end_line: f.line,
    annotation_level: mapSeverityToAnnotationLevel(f.severity),
    title: `${f.severity}: ${f.type || f.ruleId}`,
    message: `${f.description || 'Potentially hardcoded secret'}. Confidence: ${f.confidence || 50}%. Remediation: ${f.remediation || 'Revoke and rotate secret.'}`,
  }));

  const payload = {
    name: CHECK_NAME,
    head_sha: headSha,
    status,
    ...(calculatedConclusion ? { conclusion: calculatedConclusion } : {}),
    ...(status === 'completed' ? { completed_at: new Date().toISOString() } : { started_at: new Date().toISOString() }),
    output: {
      title,
      summary,
      ...(annotations.length > 0 ? { annotations } : {}),
    },
    ...(detailsUrl ? { details_url: detailsUrl } : {}),
  };

  if (checkRunId) {
    return githubAppRequest(`/repos/${owner}/${repo}/check-runs/${checkRunId}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  return githubAppRequest(`/repos/${owner}/${repo}/check-runs`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
