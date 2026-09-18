/**
 * AWS credential detection rules.
 * Detects: Access Key IDs, Secret Access Keys, Session Tokens
 */

import { maskSecret } from '../masking.js';
import { isHighEntropySecret } from '../entropy.js';

/** @type {Array<{name, pattern, severity, confidence, description, maskOptions}>} */
const AWS_RULES = [
  {
    name: 'AWS Access Key ID',
    type: 'AWS_ACCESS_KEY_ID',
    category: 'Cloud Credentials',
    // AWS access keys always start with AKIA, ABIA, ACCA, or ASIA
    pattern: /(?<![A-Z0-9])(AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}(?![A-Z0-9])/g,
    severity: 'CRITICAL',
    confidence: 98,
    description: 'AWS Access Key ID detected. This key grants programmatic access to AWS services.',
    remediation: 'Revoke this key immediately in the AWS IAM console. Rotate all keys that may have been exposed. Use IAM roles instead of long-term credentials.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'AWS Secret Access Key',
    type: 'AWS_SECRET_ACCESS_KEY',
    category: 'Cloud Credentials',
    // AWS secret access keys are 40-char base64
    pattern: /(?:aws[_\-\s]?secret[_\-\s]?(?:access[_\-\s]?)?key|aws_secret)\s*[=:]\s*["']?([A-Za-z0-9+/]{40})["']?/gi,
    severity: 'CRITICAL',
    confidence: 92,
    description: 'AWS Secret Access Key detected. Combined with an Access Key ID, this grants full API access.',
    remediation: 'Revoke immediately. Audit CloudTrail for unauthorized usage. Never commit secrets to source control.',
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    captureGroup: 1,
  },
  {
    name: 'AWS Session Token',
    type: 'AWS_SESSION_TOKEN',
    category: 'Cloud Credentials',
    pattern: /(?:aws[_\-\s]?session[_\-\s]?token)\s*[=:]\s*["']?([A-Za-z0-9+/=]{100,})["']?/gi,
    severity: 'HIGH',
    confidence: 85,
    description: 'AWS Session Token detected. Temporary credentials that still grant AWS access.',
    remediation: 'Session tokens expire, but rotate the underlying IAM credentials immediately.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    captureGroup: 1,
  },
];

/**
 * Detect AWS credentials in file content.
 *
 * @param {string} content - file content
 * @param {string} filename - file name for context
 * @returns {object[]} array of findings
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of AWS_RULES) {
    rule.pattern.lastIndex = 0; // Reset regex state

    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      const rawValue = rule.captureGroup ? match[rule.captureGroup] : match[0];
      if (!rawValue) continue;

      // Calculate line and column
      const upToMatch = content.slice(0, match.index);
      const line = upToMatch.split('\n').length;
      const lastNewline = upToMatch.lastIndexOf('\n');
      const column = match.index - lastNewline;

      // Entropy check for secret access keys
      if (rule.type === 'AWS_SECRET_ACCESS_KEY') {
        const { isHighEntropy } = isHighEntropySecret(rawValue, { threshold: 4.0 });
        if (!isHighEntropy) continue;
      }

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
