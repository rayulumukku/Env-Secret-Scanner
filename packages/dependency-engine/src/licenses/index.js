/**
 * packages/dependency-engine/src/licenses/index.js
 *
 * Deterministic Package License Detection & Risk Classification.
 * Classifies SPDX licenses into policy categories without providing legal advice.
 *
 * SECURITY INVARIANTS:
 * - Never states "This dependency is illegal."
 * - Always states factual, non-legal guidance: "License requires review."
 */

export const LICENSE_CLASSIFICATION = {
  PERMISSIVE: 'PERMISSIVE',
  COPYLEFT: 'COPYLEFT',
  WEAK_COPYLEFT: 'WEAK_COPYLEFT',
  PROPRIETARY_OR_UNKNOWN: 'PROPRIETARY_OR_UNKNOWN',
  MISSING: 'MISSING'
};

const PERMISSIVE_LICENSES = new Set([
  'MIT',
  'APACHE-2.0',
  'BSD-2-CLAUSE',
  'BSD-3-CLAUSE',
  'ISC',
  '0BSD',
  'UNLICENSE',
  'CC0-1.0',
  'WTFPL',
  'ZLIB',
  'POSTGRESQL',
  'PYTHON-2.0',
]);

const COPYLEFT_LICENSES = new Set([
  'GPL-2.0',
  'GPL-2.0-ONLY',
  'GPL-2.0-OR-LATER',
  'GPL-3.0',
  'GPL-3.0-ONLY',
  'GPL-3.0-OR-LATER',
  'AGPL-3.0',
  'AGPL-3.0-ONLY',
  'AGPL-3.0-OR-LATER',
  'EUPL-1.2',
  'OSL-3.0',
]);

const WEAK_COPYLEFT_LICENSES = new Set([
  'LGPL-2.1',
  'LGPL-2.1-ONLY',
  'LGPL-2.1-OR-LATER',
  'LGPL-3.0',
  'LGPL-3.0-ONLY',
  'LGPL-3.0-OR-LATER',
  'MPL-2.0',
  'EPL-1.0',
  'EPL-2.0',
  'CDDL-1.0',
]);

/**
 * Normalizes a raw license string to uppercase SPDX identifier.
 * @param {string|object} raw
 * @returns {string}
 */
export function normalizeLicenseIdentifier(raw) {
  if (!raw) return 'MISSING';
  if (typeof raw === 'object' && raw.type) return String(raw.type).trim().toUpperCase();
  if (typeof raw !== 'string') return 'PROPRIETARY_OR_UNKNOWN';

  const clean = raw.trim().replace(/^\(|\)$/g, '').toUpperCase();
  if (!clean || clean === 'UNLICENSED' || clean === 'NONE' || clean === 'UNKNOWN') {
    return 'MISSING';
  }
  return clean;
}

/**
 * Classifies a normalized or raw license identifier.
 * @param {string} rawLicense
 * @returns {{ license: string, classification: string, description: string }}
 */
export function classifyLicense(rawLicense) {
  const norm = normalizeLicenseIdentifier(rawLicense);

  if (norm === 'MISSING') {
    return {
      license: 'MISSING',
      classification: LICENSE_CLASSIFICATION.MISSING,
      description: 'License metadata is missing or unspecified in package manifest.'
    };
  }

  // Check against known sets
  if (PERMISSIVE_LICENSES.has(norm)) {
    return {
      license: norm,
      classification: LICENSE_CLASSIFICATION.PERMISSIVE,
      description: 'Permissive license with minimal redistribution requirements.'
    };
  }

  if (COPYLEFT_LICENSES.has(norm)) {
    return {
      license: norm,
      classification: LICENSE_CLASSIFICATION.COPYLEFT,
      description: 'Strong copyleft license requiring reciprocal source code disclosure.'
    };
  }

  if (WEAK_COPYLEFT_LICENSES.has(norm)) {
    return {
      license: norm,
      classification: LICENSE_CLASSIFICATION.WEAK_COPYLEFT,
      description: 'Weak copyleft license applying reciprocally to modified module code.'
    };
  }

  return {
    license: norm,
    classification: LICENSE_CLASSIFICATION.PROPRIETARY_OR_UNKNOWN,
    description: 'Proprietary, custom, or unrecognized license identifier.'
  };
}

/**
 * Evaluates whether a package's license conflicts with organizational policy.
 *
 * @param {string} license
 * @param {string[]} disallowedLicenses - List of disallowed license identifiers or classifications
 * @returns {{ requiresReview: boolean, reason: string|null }}
 */
export function evaluateLicensePolicy(license, disallowedLicenses = []) {
  const { classification, license: normalized } = classifyLicense(license);

  const isExplicitlyDisallowed = disallowedLicenses.some(
    d => d.toUpperCase() === normalized || d.toUpperCase() === classification
  );

  if (isExplicitlyDisallowed) {
    return {
      requiresReview: true,
      reason: `License "${normalized}" (${classification}) matches organization disallowed policy. License requires review.`
    };
  }

  if (classification === LICENSE_CLASSIFICATION.COPYLEFT) {
    return {
      requiresReview: true,
      reason: `Package uses strong copyleft license "${normalized}". License requires review.`
    };
  }

  if (classification === LICENSE_CLASSIFICATION.MISSING) {
    return {
      requiresReview: true,
      reason: 'Package does not declare a license. License requires review.'
    };
  }

  return {
    requiresReview: false,
    reason: null
  };
}
