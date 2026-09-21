/**
 * lib/trust/evidence-mapping.js
 *
 * Evidence Mapping & Immutable Snapshot Engine for SecretShield Trust Center.
 *
 * SAFETY INVARIANTS:
 *   - Computes deterministic SHA-256 canonical integrity hashes.
 *   - Creates immutable evidence snapshots with historical timestamp preservation.
 *   - NEVER includes raw secrets or unredacted credentials in evidence records.
 */

import { createHash, randomUUID } from 'crypto';

export const EVIDENCE_SOURCE_TYPES = Object.freeze({
  SECURITY_EVENT: 'SECURITY_EVENT',
  AUDIT_LOG: 'AUDIT_LOG',
  CONFIGURATION: 'CONFIGURATION',
  POLICY: 'POLICY',
  INCIDENT: 'INCIDENT',
  REMEDIATION: 'REMEDIATION',
  SCAN: 'SCAN',
  INTEGRATION: 'INTEGRATION',
  CI_RESULT: 'CI_RESULT',
  ACCESS_REVIEW: 'ACCESS_REVIEW',
});

function canonicalJson(val) {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return `[${val.map(canonicalJson).join(',')}]`;
  }
  const keys = Object.keys(val).sort();
  const pairs = keys.map(k => `${JSON.stringify(k)}:${canonicalJson(val[k])}`);
  return `{${pairs.join(',')}}`;
}

/**
 * Compute SHA-256 canonical hash of evidence content for tamper-proof verification.
 *
 * @param {object} payload
 * @returns {string} SHA-256 hex string
 */
export function computeEvidenceIntegrity(payload) {
  const json = canonicalJson(payload);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Create a verifiable Control Evidence record.
 *
 * @param {object} params
 * @param {string} params.controlId
 * @param {string} params.organizationId
 * @param {string} params.sourceType
 * @param {string} params.sourceId
 * @param {string} params.title
 * @param {string} params.summary
 * @param {number} [params.validityDays=90]
 * @param {boolean} [params.isPublic=false]
 * @param {object} [params.metadata={}]
 * @returns {object} ControlEvidence
 */
export function createControlEvidence({
  controlId,
  organizationId,
  sourceType,
  sourceId,
  title,
  summary,
  validityDays = 90,
  isPublic = false,
  metadata = {},
}) {
  if (!controlId || !organizationId || !sourceType || !sourceId) {
    throw new Error('controlId, organizationId, sourceType, and sourceId are required');
  }

  const validSource = Object.values(EVIDENCE_SOURCE_TYPES).includes(sourceType)
    ? sourceType
    : EVIDENCE_SOURCE_TYPES.CONFIGURATION;

  const now = new Date();
  const validUntil = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

  const cleanMeta = sanitizeEvidenceMetadata(metadata);
  const integrityHash = computeEvidenceIntegrity({
    controlId,
    organizationId,
    sourceType: validSource,
    sourceId,
    title,
    summary,
    metadata: cleanMeta,
  });

  return {
    id: `ev_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    controlId,
    organizationId,
    sourceType: validSource,
    sourceId,
    title: String(title || 'Evidence Record').slice(0, 150),
    summary: String(summary || '').slice(0, 1000),
    integrityHash,
    collectedAt: now.toISOString(),
    validUntil: validUntil.toISOString(),
    isPublic: Boolean(isPublic),
    metadata: cleanMeta,
    createdAt: now.toISOString(),
  };
}

/**
 * Verify whether an evidence record is still valid or expired.
 *
 * @param {object} evidence - ControlEvidence
 * @returns {{ isValid: boolean, isExpired: boolean, daysRemaining: number }}
 */
export function evaluateEvidenceValidity(evidence) {
  if (!evidence || !evidence.validUntil) {
    return { isValid: true, isExpired: false, daysRemaining: 999 };
  }

  const now = Date.now();
  const expiry = new Date(evidence.validUntil).getTime();
  const diffMs = expiry - now;
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return {
    isValid: diffMs > 0,
    isExpired: diffMs <= 0,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

/**
 * Verify evidence integrity against recomputed canonical hash.
 *
 * @param {object} evidence - ControlEvidence
 * @returns {boolean}
 */
export function verifyEvidenceIntegrity(evidence) {
  if (!evidence || !evidence.integrityHash) return false;
  const hash = computeEvidenceIntegrity({
    controlId: evidence.controlId,
    organizationId: evidence.organizationId,
    sourceType: evidence.sourceType,
    sourceId: evidence.sourceId,
    title: evidence.title,
    summary: evidence.summary,
    metadata: sanitizeEvidenceMetadata(evidence.metadata || {}),
  });
  return hash === evidence.integrityHash;
}

/**
 * Sanitize evidence metadata to prevent accidental secret inclusion.
 */
function sanitizeEvidenceMetadata(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const cleaned = {};
  const blocked = ['secret', 'token', 'key', 'password', 'rawvalue', 'auth', 'credential'];

  for (const [k, v] of Object.entries(meta)) {
    const lk = k.toLowerCase();
    if (blocked.some(b => lk.includes(b))) {
      cleaned[k] = '[REDACTED_EVIDENCE]';
    } else if (typeof v === 'object' && v !== null) {
      cleaned[k] = sanitizeEvidenceMetadata(v);
    } else {
      cleaned[k] = v;
    }
  }

  return cleaned;
}
