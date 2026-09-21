/**
 * lib/automation/incidents.js
 *
 * Security Incident Bundling & Investigation Notes Manager for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Bundles related security events around exposure clusters without claiming compromise.
 *   - Uses neutral statuses (OPEN, INVESTIGATING, REMEDIATION, VERIFYING, CLOSED).
 *   - Sanitizes and masks accidental secret values pasted into incident notes before saving.
 */

import { randomUUID } from 'crypto';

export const INCIDENT_STATUS = Object.freeze({
  OPEN: 'OPEN',
  INVESTIGATING: 'INVESTIGATING',
  REMEDIATION: 'REMEDIATION',
  VERIFYING: 'VERIFYING',
  CLOSED: 'CLOSED',
});

const SENSITIVE_PATTERNS = [
  /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
  /ghp_[A-Za-z0-9_]{36}/g,
  /glpat-[0-9a-zA-Z_-]{20}/g,
  /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
  /npm_[A-Za-z0-9]{36}/g,
  /sk_live_[0-9a-zA-Z]{24}/g,
  /(?:postgres|mongodb|mysql|redis):\/\/[^\s"']+/gi,
];

/**
 * Sanitize user notes before persistence to prevent accidental secret leakage.
 *
 * @param {string} text
 * @returns {{ sanitizedText: string, detectedCount: number }}
 */
export function sanitizeIncidentNote(text) {
  if (!text || typeof text !== 'string') return { sanitizedText: '', detectedCount: 0 };

  let sanitized = text;
  let detectedCount = 0;

  for (const regex of SENSITIVE_PATTERNS) {
    const matches = sanitized.match(regex);
    if (matches && matches.length > 0) {
      detectedCount += matches.length;
      sanitized = sanitized.replace(regex, '[REDACTED_CREDENTIAL]');
    }
  }

  return {
    sanitizedText: sanitized,
    detectedCount,
  };
}

/**
 * Bundle related exposure events and findings into a Security Incident.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.title
 * @param {string} [params.severity='HIGH']
 * @param {string[]} [params.relatedFingerprints=[]]
 * @param {string[]} [params.relatedFindingIds=[]]
 * @param {string} [params.assignedToId]
 * @returns {object} SecurityIncident
 */
export function createSecurityIncident({
  organizationId,
  title,
  severity = 'HIGH',
  relatedFingerprints = [],
  relatedFindingIds = [],
  assignedToId = null,
}) {
  if (!organizationId || !title) {
    throw new Error('organizationId and title are required for a SecurityIncident');
  }

  return {
    id: `inc_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    title: String(title).slice(0, 200),
    status: INCIDENT_STATUS.OPEN,
    severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(severity?.toUpperCase()) ? severity.toUpperCase() : 'HIGH',
    assignedToId,
    relatedFingerprints: Array.isArray(relatedFingerprints) ? relatedFingerprints : [],
    relatedFindingIds: Array.isArray(relatedFindingIds) ? relatedFindingIds : [],
    clustersCount: Math.max(1, (relatedFingerprints || []).length),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
  };
}

/**
 * Create a sanitized Incident Note.
 *
 * @param {object} params
 * @param {string} params.incidentId
 * @param {string} params.organizationId
 * @param {string} params.authorId
 * @param {string} params.authorName
 * @param {string} params.content
 * @returns {{ note: object, warning: string|null }}
 */
export function createIncidentNote({
  incidentId,
  organizationId,
  authorId,
  authorName,
  content,
}) {
  if (!incidentId || !organizationId || !content) {
    throw new Error('incidentId, organizationId, and content are required');
  }

  const { sanitizedText, detectedCount } = sanitizeIncidentNote(content);

  const note = {
    id: `note_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    incidentId,
    organizationId,
    authorId: String(authorId || 'System'),
    authorName: String(authorName || 'Analyst'),
    content: sanitizedText,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const warning = detectedCount > 0
    ? `Notice: ${detectedCount} potential credential(s) detected and automatically redacted from your note.`
    : null;

  return { note, warning };
}
