/**
 * lib/runtime/classification.js
 *
 * Exposure Classification Engine & Secret Removal Verification for SecretShield.
 *
 * EXPOSURE CLASSIFICATION STATES:
 * - SOURCE_EXPOSURE: Credential is found in current repository files.
 * - HISTORICAL_EXPOSURE: Credential was present in past commits / Git history.
 * - RUNTIME_ASSOCIATION: Credential correlates to an active runtime asset / service metadata.
 * - DEPLOYMENT_ASSOCIATION: Credential was included in a deployed commit build.
 * - ACTIVE_STATUS_UNKNOWN: Validity / activation status is unverified (DEFAULT).
 * - ACTIVE_STATUS_CONFIRMED: Authoritative metadata proves the credential is in active production service.
 *
 * REMOVAL VERIFICATION STATES:
 * - SOURCE_CLEAN: Credential removed from active source tree.
 * - HISTORY_STILL_EXPOSED: Commit history still retains credential.
 * - DEPLOYMENT_STILL_PRESENT: Previously deployed build containing credential remains active.
 * - VERIFICATION_PENDING: Remediation verification has not yet concluded.
 *
 * SECURITY INVARIANTS:
 * - NEVER validate credentials by attempting authentication against third-party systems.
 * - Only allow ACTIVE_STATUS_CONFIRMED when authoritative configuration/runtime evidence exists.
 * - Do NOT claim production impact without evidence.
 * - Do NOT claim credential is safe merely because latest source is clean.
 */

export const EXPOSURE_STATES = Object.freeze({
  SOURCE_EXPOSURE: 'SOURCE_EXPOSURE',
  HISTORICAL_EXPOSURE: 'HISTORICAL_EXPOSURE',
  RUNTIME_ASSOCIATION: 'RUNTIME_ASSOCIATION',
  DEPLOYMENT_ASSOCIATION: 'DEPLOYMENT_ASSOCIATION',
  ACTIVE_STATUS_UNKNOWN: 'ACTIVE_STATUS_UNKNOWN',
  ACTIVE_STATUS_CONFIRMED: 'ACTIVE_STATUS_CONFIRMED',
});

export const REMOVAL_VERIFICATION_STATES = Object.freeze({
  SOURCE_CLEAN: 'SOURCE_CLEAN',
  HISTORY_STILL_EXPOSED: 'HISTORY_STILL_EXPOSED',
  DEPLOYMENT_STILL_PRESENT: 'DEPLOYMENT_STILL_PRESENT',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING',
});

/**
 * Classify a secret finding based on verifiable evidence.
 *
 * @param {object} params
 * @param {object} params.finding - Finding record
 * @param {boolean} [params.isInCurrentSource=true] - Present in current working tree
 * @param {boolean} [params.isInGitHistory=false] - Present in Git commit log
 * @param {object[]} [params.deployments=[]] - Deployed commits containing this finding
 * @param {object[]} [params.runtimeAssets=[]] - Associated runtime services or containers
 * @param {boolean} [params.authoritativeActiveProof=false] - Authoritative verified runtime proof
 * @returns {object} Classified exposure states and evidence
 */
export function classifyExposure({
  finding,
  isInCurrentSource = true,
  isInGitHistory = false,
  deployments = [],
  runtimeAssets = [],
  authoritativeActiveProof = false,
}) {
  const states = [];
  const evidenceList = [];

  // 1. Source Exposure
  if (isInCurrentSource) {
    states.push(EXPOSURE_STATES.SOURCE_EXPOSURE);
    evidenceList.push({
      type: 'CURRENT_SOURCE_EVIDENCE',
      summary: `Finding detected in active source file: ${finding.file || 'unknown'} (Line ${finding.line || 1})`,
    });
  }

  // 2. Historical Exposure
  if (isInGitHistory) {
    states.push(EXPOSURE_STATES.HISTORICAL_EXPOSURE);
    evidenceList.push({
      type: 'GIT_HISTORY_EVIDENCE',
      summary: `Finding detected in Git commit history (${finding.commitHash ? finding.commitHash.slice(0, 8) : 'historical commit'})`,
    });
  }

  // 3. Deployment Association
  if (deployments.length > 0) {
    states.push(EXPOSURE_STATES.DEPLOYMENT_ASSOCIATION);
    const depSummary = deployments.map(d => `${d.environment || 'custom'} (#${d.id || d.buildIdentifier})`).join(', ');
    evidenceList.push({
      type: 'DEPLOYMENT_RECORD_EVIDENCE',
      summary: `Associated with ${deployments.length} deployment(s): ${depSummary}`,
    });
  }

  // 4. Runtime Association
  if (runtimeAssets.length > 0) {
    states.push(EXPOSURE_STATES.RUNTIME_ASSOCIATION);
    const assetSummary = runtimeAssets.map(a => `${a.assetType}: ${a.name}`).join(', ');
    evidenceList.push({
      type: 'RUNTIME_METADATA_EVIDENCE',
      summary: `Correlated with ${runtimeAssets.length} runtime asset(s): ${assetSummary}`,
    });
  }

  // 5. Active Status (Authoritative evidence only; NEVER auth testing)
  let activeStatus = EXPOSURE_STATES.ACTIVE_STATUS_UNKNOWN;
  if (authoritativeActiveProof) {
    activeStatus = EXPOSURE_STATES.ACTIVE_STATUS_CONFIRMED;
    evidenceList.push({
      type: 'AUTHORITATIVE_RUNTIME_PROOF',
      summary: 'Authoritative configuration metadata confirmed active deployment configuration.',
    });
  }
  states.push(activeStatus);

  return {
    findingId: finding.id,
    fingerprint: finding.fingerprint,
    states,
    activeStatus,
    isConfirmedActive: activeStatus === EXPOSURE_STATES.ACTIVE_STATUS_CONFIRMED,
    hasDeploymentExposure: deployments.length > 0,
    hasRuntimeExposure: runtimeAssets.length > 0,
    evidenceList,
    validityNotice: 'SecretShield never validates credentials by attempting authentication. Active status reflects authoritative configuration metadata only.',
  };
}

/**
 * Verify secret removal status across current source, Git history, and deployments.
 *
 * @param {object} params
 * @param {object} params.finding
 * @param {boolean} params.isCleanInCurrentSource
 * @param {boolean} params.isCleanInGitHistory
 * @param {object[]} params.activeDeployments - Currently active deployments containing commit
 * @returns {object} Comprehensive removal verification result
 */
export function verifySecretRemoval({
  finding,
  isCleanInCurrentSource,
  isCleanInGitHistory,
  activeDeployments = [],
}) {
  const statuses = [];
  const details = [];

  // Source Check
  if (isCleanInCurrentSource) {
    statuses.push(REMOVAL_VERIFICATION_STATES.SOURCE_CLEAN);
    details.push('Credential removed from latest commit and active repository files.');
  } else {
    details.push('Credential is still present in active repository source files.');
  }

  // History Check
  if (!isCleanInGitHistory) {
    statuses.push(REMOVAL_VERIFICATION_STATES.HISTORY_STILL_EXPOSED);
    details.push('Git commit history still contains credential. History rewrite (e.g. git-filter-repo) required.');
  }

  // Deployment Check
  if (activeDeployments.length > 0) {
    statuses.push(REMOVAL_VERIFICATION_STATES.DEPLOYMENT_STILL_PRESENT);
    details.push(`${activeDeployments.length} running deployment(s) still serve builds containing this commit.`);
  }

  // Overall Verification Determination
  const isFullyRemediated = isCleanInCurrentSource && isCleanInGitHistory && activeDeployments.length === 0;
  if (!isFullyRemediated) {
    statuses.push(REMOVAL_VERIFICATION_STATES.VERIFICATION_PENDING);
  }

  return {
    fingerprint: finding.fingerprint,
    isFullyRemediated,
    statuses,
    summary: isFullyRemediated
      ? 'Verification complete: Secret is removed from source, Git history, and all active deployments.'
      : 'Remediation incomplete: Secret remains exposed in Git history or active deployments.',
    details,
    verifiedAt: new Date().toISOString(),
  };
}
