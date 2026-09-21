/**
 * lib/trust/advisories.js
 *
 * Security Advisories Registry for SecretShield Product Security.
 *
 * SAFETY INVARIANTS:
 *   - Only publishes verified security advisories for SecretShield software.
 *   - Never fabricates fake CVE identifiers or misleading severities.
 */

import { randomUUID } from 'crypto';

export const ADVISORY_SEVERITIES = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
});

/**
 * Built-in baseline product security advisories for SecretShield.
 */
export const DEFAULT_SECURITY_ADVISORIES = [
  {
    advisoryId: 'SSA-2026-001',
    title: 'Strict Regex Pattern Length Bounds & ReDoS Backtracking Mitigation',
    affectedVersion: '< 1.5.0',
    fixedVersion: '1.5.0',
    severity: ADVISORY_SEVERITIES.MEDIUM,
    description: 'Community rule manifests with deeply nested quantifiers could lead to catastrophic backtracking under adversarial input.',
    impact: 'Potential scanner CPU saturation during large monorepo scans.',
    mitigation: 'Upgrade to SecretShield v1.5.0+ where linear pattern compilation and ReDoS validation guards are enforced.',
    publishedAt: '2026-06-15T00:00:00.000Z',
    references: ['https://secretshield.dev/advisories/SSA-2026-001'],
  },
];

/**
 * Construct a verifiable Security Advisory record.
 *
 * @param {object} params
 * @param {string} params.advisoryId
 * @param {string} params.title
 * @param {string} params.affectedVersion
 * @param {string} params.fixedVersion
 * @param {string} params.severity
 * @param {string} params.description
 * @param {string} params.impact
 * @param {string} params.mitigation
 * @param {string[]} [params.references=[]]
 * @returns {object} SecurityAdvisory
 */
export function createSecurityAdvisory({
  advisoryId,
  title,
  affectedVersion,
  fixedVersion,
  severity = ADVISORY_SEVERITIES.LOW,
  description,
  impact,
  mitigation,
  references = [],
}) {
  if (!advisoryId || !title || !description) {
    throw new Error('advisoryId, title, and description are required');
  }

  const validSev = Object.values(ADVISORY_SEVERITIES).includes(severity)
    ? severity
    : ADVISORY_SEVERITIES.LOW;

  return {
    id: `adv_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    advisoryId: String(advisoryId).toUpperCase().slice(0, 32),
    title: String(title).slice(0, 150),
    affectedVersion: String(affectedVersion || 'all').slice(0, 50),
    fixedVersion: String(fixedVersion || 'latest').slice(0, 50),
    severity: validSev,
    description: String(description).slice(0, 2000),
    impact: String(impact || '').slice(0, 1000),
    mitigation: String(mitigation || '').slice(0, 1000),
    publishedAt: new Date().toISOString(),
    references: Array.isArray(references) ? references : [],
  };
}
