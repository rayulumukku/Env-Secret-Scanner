/**
 * Google API key and credential detection rules.
 */

import { maskSecret } from '../masking.js';

const GOOGLE_RULES = [
  {
    name: 'Google API Key',
    type: 'GOOGLE_API_KEY',
    category: 'Cloud Credentials',
    pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    severity: 'HIGH',
    confidence: 97,
    description: 'Google API key detected. May grant access to Maps, Firebase, Cloud APIs, etc.',
    remediation: 'Restrict at console.cloud.google.com/apis/credentials. Regenerate if exposed.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'Google OAuth Client ID',
    type: 'GOOGLE_OAUTH_CLIENT_ID',
    category: 'Cloud Credentials',
    pattern: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g,
    severity: 'MEDIUM',
    confidence: 90,
    description: 'Google OAuth Client ID detected. Not a secret but reveals app identity.',
    remediation: 'Less sensitive, but rotate the associated client secret immediately.',
    maskOptions: { showPrefix: 10, showSuffix: 8 },
  },
  {
    name: 'Google OAuth Client Secret',
    type: 'GOOGLE_OAUTH_CLIENT_SECRET',
    category: 'Cloud Credentials',
    pattern: /(?:client[_-]?secret|GOOGLE[_-]CLIENT[_-]SECRET)\s*[=:]\s*["']?([A-Za-z0-9\-_]{24,})["']?/gi,
    severity: 'CRITICAL',
    confidence: 88,
    description: 'Google OAuth client secret detected. Allows impersonation of your OAuth app.',
    remediation: 'Regenerate at console.cloud.google.com/apis/credentials immediately.',
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    captureGroup: 1,
  },
  {
    name: 'Google Service Account JSON',
    type: 'GOOGLE_SERVICE_ACCOUNT',
    category: 'Cloud Credentials',
    // Match service account key JSON fragments
    pattern: /"type"\s*:\s*"service_account"/g,
    severity: 'CRITICAL',
    confidence: 95,
    description: 'Google Service Account JSON key detected. Grants broad access to GCP services.',
    remediation: 'Delete the key at console.cloud.google.com/iam-admin/serviceaccounts. Audit GCP audit logs.',
    maskOptions: { showPrefix: 4, showSuffix: 4 },
  },
];

/**
 * Detect Google API keys and credentials in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of GOOGLE_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const rawValue = rule.captureGroup ? match[rule.captureGroup] : match[0];
      if (!rawValue) continue;

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
