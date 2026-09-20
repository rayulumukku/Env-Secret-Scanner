/**
 * lib/exposure/evidence.js
 *
 * Evidence Abstraction & Proof Engine for SecretShield Exposure Intelligence.
 *
 * SECURITY INVARIANTS:
 * - NO raw secret content copied into evidence objects.
 * - Every intelligence claim, graph edge, and lifecycle event references verifiable evidence.
 */

import { randomUUID } from 'crypto';

export const EVIDENCE_TYPES = {
  SCANNER_RESULT: 'SCANNER_RESULT',
  GIT_COMMIT: 'GIT_COMMIT',
  GIT_DIFF: 'GIT_DIFF',
  REPO_METADATA: 'REPO_METADATA',
  PR_EVENT: 'PR_EVENT',
  REMEDIATION_EVENT: 'REMEDIATION_EVENT',
  VERIFICATION_SCAN: 'VERIFICATION_SCAN',
  POLICY_EVALUATION: 'POLICY_EVALUATION',
};

/**
 * Construct a verifiable Evidence record.
 *
 * @param {object} params
 * @param {string} params.type - One of EVIDENCE_TYPES
 * @param {string} params.sourceId - ID of finding, commit hash, scanId, PR number, or policy violation
 * @param {string} [params.fingerprint] - Associated secret fingerprint
 * @param {string} [params.repositoryId] - Target repository context
 * @param {string} [params.repositoryName] - Human-readable repository name
 * @param {string} [params.commitHash] - Associated Git commit SHA
 * @param {string} [params.branch] - Git branch
 * @param {string} [params.file] - File path
 * @param {number} [params.confidence=100] - Factual confidence percentage (0-100)
 * @param {string} params.summary - Factual, non-sensitive summary description of the evidence
 * @param {object} [params.metadata={}] - Structured non-sensitive metadata (author, lines, tags)
 * @returns {object} Normalized evidence object
 */
export function createEvidence({
  type,
  sourceId,
  fingerprint = null,
  repositoryId = null,
  repositoryName = null,
  commitHash = null,
  branch = null,
  file = null,
  confidence = 100,
  summary,
  metadata = {},
}) {
  if (!type || !EVIDENCE_TYPES[type]) {
    throw new Error(`Invalid evidence type: ${type}`);
  }
  if (!sourceId) {
    throw new Error('sourceId is required for evidence creation');
  }
  if (!summary || typeof summary !== 'string') {
    throw new Error('summary is required for evidence creation');
  }

  return {
    evidenceId: `ev_${randomUUID().slice(0, 8)}`,
    type,
    sourceId: String(sourceId),
    fingerprint,
    repositoryId,
    repositoryName,
    commitHash,
    branch,
    file,
    confidence: Math.min(100, Math.max(0, Number(confidence) || 100)),
    summary,
    metadata,
    timestamp: metadata.timestamp || new Date().toISOString(),
  };
}

/**
 * Validate that an evidence object meets security invariants.
 * @param {object} evidence
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    return { valid: false, error: 'Evidence must be an object' };
  }
  if (!evidence.evidenceId || !evidence.type || !evidence.sourceId || !evidence.summary) {
    return { valid: false, error: 'Missing required evidence properties' };
  }
  if (!EVIDENCE_TYPES[evidence.type]) {
    return { valid: false, error: `Unrecognized evidence type: ${evidence.type}` };
  }
  return { valid: true };
}
