/**
 * lib/trust/public-trust.js
 *
 * Public Trust Center Sanitization & Publishing Engine for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Strictly filters out private findings, internal fingerprints, raw secrets, and audit logs.
 *   - Only publishes controls and evidence categories explicitly marked as isPublic: true.
 *   - Protects multi-tenant isolation and prevents unauthorized exposure.
 */

/**
 * Filter and format organization controls for public disclosure.
 *
 * @param {object} organization
 * @param {object[]} controls
 * @param {object[]} evidenceList
 * @returns {object} Public Trust Center payload
 */
export function buildPublicTrustProfile(organization, controls = [], evidenceList = []) {
  if (!organization) return null;

  // Whitelist only public controls
  const publicControls = controls
    .filter(c => c.isPublic)
    .map(c => ({
      code: c.code,
      name: c.name,
      description: c.description,
      category: c.category,
      implementationStatus: c.implementationStatus,
      lastReviewedAt: c.lastReviewedAt,
      version: c.version,
    }));

  // Whitelist only public evidence records (metadata only, zero secrets)
  const publicEvidence = evidenceList
    .filter(e => e.isPublic)
    .map(e => ({
      controlId: e.controlId,
      sourceType: e.sourceType,
      title: e.title,
      summary: e.summary,
      collectedAt: e.collectedAt,
      validUntil: e.validUntil,
    }));

  const evidenceCategories = Array.from(new Set(publicEvidence.map(e => e.sourceType)));

  return {
    organizationName: organization.name || 'Organization',
    slug: organization.slug || 'default',
    publishedAt: new Date().toISOString(),
    totalPublicControls: publicControls.length,
    controls: publicControls,
    evidenceCategories,
    publicEvidence,
    disclaimer: 'This public trust summary reflects documented organizational security controls. It is informational and does not constitute independent external certification.',
  };
}

