/**
 * lib/remediation/engine.js
 *
 * Remediation Guide Engine, SLA calculator, and input secret scanner.
 *
 * SECURITY INVARIANT:
 *   - validateNoteOrComment enforces that no raw secrets can be submitted in notes/comments.
 *   - Never claims external revocation occurred without direct provider verification.
 */

import { getProviderForFinding } from './providers.js';
import { buildInitialChecklist } from './templates.js';
import { scanString } from '../scanner/engine.js';

/**
 * Generate a complete remediation plan for a finding.
 *
 * @param {object} finding
 * @returns {object} Remediation plan
 */
export function generateRemediationGuide(finding = {}) {
  const provider = getProviderForFinding(finding);
  const checklist = buildInitialChecklist();

  return {
    providerName: provider.name,
    category: provider.category,
    remediationType: provider.remediationType,
    documentationUrl: provider.documentationUrl,
    consoleUrl: provider.consoleUrl,
    steps: provider.bestPractices,
    checklist,
    disclaimer: 'SecretShield verifies that secrets are absent from source control code. Revocation and rotation must be performed directly in the provider dashboard.',
  };
}

/**
 * Calculate SLA status for a finding.
 *
 * @param {object} finding
 * @param {object} [slaConfig] - Optional SLA hours per severity: { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 }
 * @returns {{ status: 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE', dueAt: string, hoursRemaining: number }}
 */
export function calculateSlaStatus(finding = {}, slaConfig = {}) {
  const severity = (finding.severity || 'HIGH').toUpperCase();
  const defaultHours = { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 };
  const targetHours = slaConfig[severity] || defaultHours[severity] || 24;

  const createdAt = new Date(finding.createdAt || Date.now()).getTime();
  const dueTime = createdAt + (targetHours * 60 * 60 * 1000);
  const now = Date.now();

  const msRemaining = dueTime - now;
  const hoursRemaining = Math.max(0, Math.round(msRemaining / (1000 * 60 * 60)));

  let status = 'ON_TRACK';
  if (msRemaining < 0) {
    status = 'OVERDUE';
  } else if (hoursRemaining <= Math.max(1, Math.round(targetHours * 0.25)) && hoursRemaining < targetHours) {
    status = 'DUE_SOON';
  }

  return {
    status,
    dueAt: new Date(dueTime).toISOString(),
    hoursRemaining: Math.round(msRemaining / (1000 * 60 * 60)),
    targetHours,
  };
}

/**
 * Validate that user-submitted text (comments, notes) does NOT contain raw credentials.
 * If credentials are detected, throws an error describing the policy violation.
 *
 * @param {string} text
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateNoteOrComment(text = '') {
  if (!text || typeof text !== 'string') {
    return { valid: true };
  }

  // Scan text snippet
  const scanResult = scanString(text, 'user-input.txt');
  if (scanResult.findings && scanResult.findings.length > 0) {
    return {
      valid: false,
      error: 'Security Policy Violation: Do not paste raw API keys, tokens, passwords, or credentials into notes or comments. The secret has been blocked.',
    };
  }

  return { valid: true };
}
