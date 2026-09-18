/**
 * GitHub token detection rules.
 * Detects: Personal Access Tokens (classic and fine-grained), OAuth tokens,
 * GitHub App tokens, refresh tokens.
 */

import { maskSecret } from '../masking.js';

const GITHUB_RULES = [
  {
    name: 'GitHub Personal Access Token (Classic)',
    type: 'GITHUB_PAT_CLASSIC',
    category: 'Version Control',
    pattern: /\bghp_[A-Za-z0-9]{36}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'GitHub Personal Access Token (classic) detected. Grants broad access to GitHub repositories.',
    remediation: 'Revoke at github.com/settings/tokens immediately. Audit repository access logs.',
    maskOptions: { showPrefix: 6, showSuffix: 4 },
  },
  {
    name: 'GitHub Fine-Grained Personal Access Token',
    type: 'GITHUB_PAT_FINE_GRAINED',
    category: 'Version Control',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{82}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'GitHub Fine-Grained Personal Access Token detected.',
    remediation: 'Revoke at github.com/settings/tokens. Fine-grained PATs have specific repo/org scope.',
    maskOptions: { showPrefix: 11, showSuffix: 4 },
  },
  {
    name: 'GitHub OAuth Token',
    type: 'GITHUB_OAUTH_TOKEN',
    category: 'Version Control',
    pattern: /\bgho_[A-Za-z0-9]{36}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'GitHub OAuth access token detected.',
    remediation: 'Revoke immediately via github.com/settings/applications.',
    maskOptions: { showPrefix: 5, showSuffix: 4 },
  },
  {
    name: 'GitHub App Installation Token',
    type: 'GITHUB_APP_TOKEN',
    category: 'Version Control',
    pattern: /\bghs_[A-Za-z0-9]{36}\b/g,
    severity: 'HIGH',
    confidence: 97,
    description: 'GitHub App installation access token detected. Short-lived but still sensitive.',
    remediation: 'These expire in 1 hour, but regenerate your GitHub App credentials.',
    maskOptions: { showPrefix: 5, showSuffix: 4 },
  },
  {
    name: 'GitHub App Refresh Token',
    type: 'GITHUB_APP_REFRESH_TOKEN',
    category: 'Version Control',
    pattern: /\bghr_[A-Za-z0-9]{76}\b/g,
    severity: 'HIGH',
    confidence: 97,
    description: 'GitHub App refresh token detected.',
    remediation: 'Revoke via GitHub App settings. Refresh tokens are long-lived.',
    maskOptions: { showPrefix: 5, showSuffix: 4 },
  },
];

/**
 * Detect GitHub tokens in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of GITHUB_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const rawValue = match[0];

      const upToMatch = content.slice(0, match.index);
      const line = upToMatch.split('\n').length;
      const lastNewline = upToMatch.lastIndexOf('\n');
      const column = match.index - lastNewline;

      const maskedValue = maskSecret(rawValue, rule.maskOptions);

      findings.push({
        type: rule.type,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        line,
        column,
        file: filename,
        maskedValue,
        description: rule.description,
        remediation: rule.remediation,
        lineContent: lines[line - 1] || '',
      });
    }
  }

  return findings;
}
