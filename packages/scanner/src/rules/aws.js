/**
 * rules/aws.js — AWS credential detection rules.
 * Detects: Access Key IDs, Secret Access Keys, Session Tokens.
 *
 * Rule format: { id, name, type, category, severity, pattern, captureGroup?,
 *   entropyThreshold?, minLength?, isProviderRule, maskOptions, description, remediation }
 */

/** @type {object[]} */
export const RULES = [
  {
    id: 'AWS_ACCESS_KEY_ID',
    name: 'AWS Access Key ID',
    type: 'AWS_ACCESS_KEY_ID',
    category: 'Cloud Credentials',
    // AKIA, ABIA, ACCA, ASIA + 16 uppercase alphanumeric chars
    pattern: /(?<![A-Z0-9])(AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}(?![A-Z0-9])/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'AWS Access Key ID detected. Grants programmatic access to AWS services.',
    remediation: 'Revoke immediately in AWS IAM console. Rotate all exposed keys. Use IAM roles instead of long-term credentials. Run `aws iam list-access-keys` to audit.',
  },
  {
    id: 'AWS_SECRET_ACCESS_KEY',
    name: 'AWS Secret Access Key',
    type: 'AWS_SECRET_ACCESS_KEY',
    category: 'Cloud Credentials',
    pattern: /(?:aws[_\-\s]?secret[_\-\s]?(?:access[_\-\s]?)?key|aws_secret)\s*[=:]\s*["']?([A-Za-z0-9+/]{40})["']?/gi,
    captureGroup: 1,
    severity: 'CRITICAL',
    isProviderRule: true,
    entropyThreshold: 4.0,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'AWS Secret Access Key detected. Combined with an Access Key ID this grants full API access.',
    remediation: 'Revoke immediately. Audit CloudTrail for unauthorized usage. Never store secrets in source code.',
  },
  {
    id: 'AWS_SESSION_TOKEN',
    name: 'AWS Session Token',
    type: 'AWS_SESSION_TOKEN',
    category: 'Cloud Credentials',
    pattern: /(?:aws[_\-\s]?session[_\-\s]?token)\s*[=:]\s*["']?([A-Za-z0-9+/=]{100,})["']?/gi,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'AWS Session Token detected. Temporary credentials that still grant AWS access.',
    remediation: 'Session tokens expire, but rotate the underlying IAM credentials immediately.',
  },
];

export { RULES as rules };
