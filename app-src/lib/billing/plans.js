/**
 * lib/billing/plans.js
 *
 * Tier definitions and capability specifications for SecretShield.
 *
 * Clean internal abstractions for Free, Team, and Enterprise tiers.
 * Note: No fake payment barriers or dark patterns. All core features are fully functional.
 */

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Open Source / Free',
    badge: 'Community',
    description: 'Essential developer secret scanning for individual engineers and open source repositories.',
    price: '$0',
    billingPeriod: 'forever',
    limits: {
      maxRepositories: 10,
      maxProjects: 5,
      maxMembers: 3,
      maxScansPerMonth: 500,
      maxCustomRules: 10,
      historyRetentionDays: 30,
      maxFileSizeMb: 10,
    },
    features: [
      '10+ core detection rule engines',
      'Local-only privacy-first scanning',
      'CLI & Git pre-commit hook support',
      'Interactive finding remediation',
      'Baseline suppressions (.secretshield-baseline)',
      'Community rules & custom regex',
      'Local scan history & export',
    ],
  },
  TEAM: {
    id: 'team',
    name: 'Team / Cloud',
    badge: 'Recommended',
    description: 'Automated CI/CD scanning, GitHub/GitLab integration, and team remediation workflows.',
    price: '$19',
    billingPeriod: 'per user / month (planned)',
    limits: {
      maxRepositories: 50,
      maxProjects: 20,
      maxMembers: 25,
      maxScansPerMonth: 5000,
      maxCustomRules: 50,
      historyRetentionDays: 180,
      maxFileSizeMb: 50,
    },
    features: [
      'Everything in Free tier',
      'GitHub App & GitLab CI integration',
      'Pull Request inline annotations',
      'Audit logging & member RBAC',
      'Slack & Webhook notifications',
      'Shared team rule libraries',
      'Automated nightly baseline checks',
    ],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise / Self-Hosted',
    badge: 'Enterprise',
    description: 'Self-hosted air-gapped deployments, custom SLAs, SAML/SSO, and compliance reporting.',
    price: 'Custom',
    billingPeriod: 'annual billing (planned)',
    limits: {
      maxRepositories: -1, // Unlimited
      maxProjects: -1,
      maxMembers: -1,
      maxScansPerMonth: -1,
      maxCustomRules: -1,
      historyRetentionDays: 365,
      maxFileSizeMb: 100,
    },
    features: [
      'Everything in Team tier',
      'Air-gapped / Self-hosted deployment',
      'SAML 2.0 / SSO & SCIM directory sync',
      'Custom regex validation & ReDoS engine',
      'SOC2 / ISO 27001 compliance export',
      'Dedicated support & SLA guarantees',
      'Unlimited organizations & members',
    ],
  },
};

/**
 * Get plan details by ID
 * @param {string} planId
 * @returns {typeof PLANS.FREE}
 */
export function getPlan(planId = 'free') {
  const normalized = (planId || '').toUpperCase();
  return PLANS[normalized] || PLANS.FREE;
}

/**
 * Get all available plans
 * @returns {Array<typeof PLANS.FREE>}
 */
export function getAllPlans() {
  return [PLANS.FREE, PLANS.TEAM, PLANS.ENTERPRISE];
}
