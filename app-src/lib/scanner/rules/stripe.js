/**
 * rules/stripe.js — Stripe API key detection.
 */

export const RULES = [
  {
    id: 'STRIPE_SECRET_KEY_LIVE',
    name: 'Stripe Live Secret Key',
    type: 'STRIPE_SECRET_KEY_LIVE',
    category: 'Payment Processing',
    // sk_live_ prefix
    pattern: /\bsk_live_[A-Za-z0-9]{24,}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 10, showSuffix: 4 },
    description: 'Stripe live secret key. Grants full access to production payment processing.',
    remediation: 'Roll the key immediately at https://dashboard.stripe.com/apikeys. Audit Stripe logs for unauthorized charges.',
  },
  {
    id: 'STRIPE_SECRET_KEY_TEST',
    name: 'Stripe Test Secret Key',
    type: 'STRIPE_SECRET_KEY_TEST',
    category: 'Payment Processing',
    pattern: /\bsk_test_[A-Za-z0-9]{24,}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 10, showSuffix: 4 },
    description: 'Stripe test secret key. Should not be exposed even in test environments.',
    remediation: 'Roll the key at https://dashboard.stripe.com/test/apikeys. Use environment variables.',
  },
  {
    id: 'STRIPE_PUBLISHABLE_KEY_LIVE',
    name: 'Stripe Live Publishable Key',
    type: 'STRIPE_PUBLISHABLE_KEY_LIVE',
    category: 'Payment Processing',
    pattern: /\bpk_live_[A-Za-z0-9]{24,}\b/g,
    severity: 'MEDIUM',
    isProviderRule: true,
    maskOptions: { showPrefix: 10, showSuffix: 4 },
    description: 'Stripe live publishable key. Lower risk than secret keys but still sensitive.',
    remediation: 'Publishable keys are safe for client-side but confirm no secret key co-exposure.',
  },
  {
    id: 'STRIPE_WEBHOOK_SECRET',
    name: 'Stripe Webhook Secret',
    type: 'STRIPE_WEBHOOK_SECRET',
    category: 'Payment Processing',
    // whsec_ prefix
    pattern: /\bwhsec_[A-Za-z0-9]{32,}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'Stripe webhook signing secret. Allows signature verification bypass.',
    remediation: 'Rotate the webhook secret in the Stripe dashboard and update your endpoint.',
  },
  {
    id: 'STRIPE_RESTRICTED_KEY',
    name: 'Stripe Restricted Key',
    type: 'STRIPE_RESTRICTED_KEY',
    category: 'Payment Processing',
    pattern: /\brk_(?:live|test)_[A-Za-z0-9]{24,}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 10, showSuffix: 4 },
    description: 'Stripe restricted API key with limited permissions.',
    remediation: 'Roll the restricted key at https://dashboard.stripe.com/apikeys.',
  },
];

export { RULES as rules };
