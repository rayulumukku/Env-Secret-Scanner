/**
 * Stripe API key detection rules.
 */

import { maskSecret } from '../masking.js';

const STRIPE_RULES = [
  {
    name: 'Stripe Live Secret Key',
    type: 'STRIPE_SECRET_KEY_LIVE',
    category: 'Payment Processing',
    pattern: /\bsk_live_[A-Za-z0-9]{24,99}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'Stripe LIVE secret key detected. Can make real charges and access customer data.',
    remediation: 'Roll key immediately at dashboard.stripe.com/apikeys. Check for unauthorized charges.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'Stripe Live Publishable Key',
    type: 'STRIPE_PUBLISHABLE_KEY_LIVE',
    category: 'Payment Processing',
    pattern: /\bpk_live_[A-Za-z0-9]{24,99}\b/g,
    severity: 'MEDIUM',
    confidence: 95,
    description: 'Stripe LIVE publishable key detected. Lower risk than secret key but still sensitive.',
    remediation: 'Publishable keys are meant to be public, but still verify this exposure is intentional.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'Stripe Test Secret Key',
    type: 'STRIPE_SECRET_KEY_TEST',
    category: 'Payment Processing',
    pattern: /\bsk_test_[A-Za-z0-9]{24,99}\b/g,
    severity: 'HIGH',
    confidence: 97,
    description: 'Stripe TEST secret key detected. Cannot make real charges but reveals API structure.',
    remediation: 'Still revoke and rotate. Test keys should not be committed to source control.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'Stripe Test Publishable Key',
    type: 'STRIPE_PUBLISHABLE_KEY_TEST',
    category: 'Payment Processing',
    pattern: /\bpk_test_[A-Za-z0-9]{24,99}\b/g,
    severity: 'LOW',
    confidence: 90,
    description: 'Stripe TEST publishable key detected. Low risk but indicates insecure practices.',
    remediation: 'Move to environment variables even for test keys.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
  {
    name: 'Stripe Restricted Key',
    type: 'STRIPE_RESTRICTED_KEY',
    category: 'Payment Processing',
    pattern: /\brk_live_[A-Za-z0-9]{24,99}\b/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'Stripe restricted key detected. Has limited scope but still grants API access.',
    remediation: 'Roll key immediately at dashboard.stripe.com/apikeys.',
    maskOptions: { showPrefix: 8, showSuffix: 4 },
  },
];

/**
 * Detect Stripe API keys in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of STRIPE_RULES) {
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
