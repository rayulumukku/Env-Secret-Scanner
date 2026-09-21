/**
 * lib/automation/verification.js
 *
 * Remediation Verification Loop for SecretShield.
 * Validates whether secrets removed from source have actually disappeared from code,
 * and tracks credential rotation status with evidence.
 *
 * SAFETY INVARIANTS:
 *   - "Removed from source" NEVER automatically implies "rotated".
 *   - Only claims ROTATION_CONFIRMED when authoritative provider proof exists.
 *   - Creates explicit verification audit events.
 */

import { createSecurityEvent, SECURITY_EVENT_TYPES, EVENT_SOURCES } from './events.js';
import { createEvidence } from '../exposure/evidence.js';

export const REMEDIATION_STATES = Object.freeze({
  SOURCE_REMOVED: 'SOURCE_REMOVED',
  ROTATION_UNVERIFIED: 'ROTATION_UNVERIFIED',
  ROTATION_CONFIRMED: 'ROTATION_CONFIRMED',
});

/**
 * Execute remediation verification for a secret fingerprint.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.repositoryId
 * @param {string} params.fingerprint
 * @param {object[]} params.currentRepoFindings - Current active findings from rescan
 * @param {boolean} [params.hasProviderRotationEvidence=false]
 * @param {string} [params.actor='Security Engineer']
 * @returns {object} Verification outcome
 */
export function verifyRemediation({
  organizationId,
  repositoryId,
  fingerprint,
  currentRepoFindings = [],
  hasProviderRotationEvidence = false,
  actor = 'Security Engineer',
}) {
  const isPresentInLatest = currentRepoFindings.some(f => f.fingerprint === fingerprint);

  if (isPresentInLatest) {
    return {
      success: false,
      status: 'STILL_EXPOSED',
      sourceRemoved: false,
      rotationState: REMEDIATION_STATES.ROTATION_UNVERIFIED,
      message: 'Secret fingerprint was still detected in latest repository scan.',
    };
  }

  // Secret is no longer found in current source
  const rotationState = hasProviderRotationEvidence
    ? REMEDIATION_STATES.ROTATION_CONFIRMED
    : REMEDIATION_STATES.ROTATION_UNVERIFIED;

  const evidence = createEvidence({
    organizationId,
    fingerprint,
    type: 'VERIFICATION_SCAN',
    sourceId: `verification_${Date.now()}`,
    repositoryId,
    confidence: 100,
    summary: `Verified absence of secret fingerprint in latest repository scan. Rotation status: ${rotationState}.`,
    metadata: {
      sourceRemoved: true,
      rotationState,
      hasProviderRotationEvidence,
    },
  });

  const event = createSecurityEvent({
    organizationId,
    eventType: SECURITY_EVENT_TYPES.REMEDIATION_VERIFIED,
    source: EVENT_SOURCES.MANUAL_SCAN,
    repositoryId,
    actor,
    severity: 'INFO',
    category: 'REMEDIATION',
    relatedFingerprints: [fingerprint],
    evidenceIds: [evidence.evidenceId],
    metadata: {
      sourceRemoved: true,
      rotationState,
      hasProviderRotationEvidence,
      verifiedAt: new Date().toISOString(),
    },
  });

  return {
    success: true,
    status: 'VERIFIED',
    sourceRemoved: true,
    rotationState,
    evidence,
    event,
    message: hasProviderRotationEvidence
      ? 'Remediation verified: removed from source code and confirmed rotated with provider.'
      : 'Source removal verified. Credential validity / provider rotation remains unverified.',
  };
}
