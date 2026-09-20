/**
 * packages/rules/src/integrity.js
 *
 * Cryptographic integrity verification & canonical hashing for SecretShield Rule Packs.
 */

import { createHash } from 'crypto';

/**
 * Deterministically sort object keys for canonical JSON representation.
 * @param {*} value
 * @returns {*}
 */
export function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  const sortedKeys = Object.keys(value).sort();
  const result = {};
  for (const key of sortedKeys) {
    // Exclude existing signature and integrity fields from the hash input itself
    if (key === 'integrity' || key === 'signature') {
      continue;
    }
    result[key] = canonicalize(value[key]);
  }
  return result;
}

/**
 * Compute the canonical SHA-256 hash of a rule pack manifest.
 * @param {object} manifest
 * @returns {string} e.g. "sha256-a1b2c3..."
 */
export function computePackIntegrity(manifest) {
  const canonicalObj = canonicalize(manifest);
  const canonicalStr = JSON.stringify(canonicalObj);
  const hash = createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
  return `sha256-${hash}`;
}

/**
 * Verify a RulePack's declared integrity hash against its actual content.
 * @param {object} manifest
 * @returns {{ valid: boolean, calculated: string, declared: string, error?: string }}
 */
export function verifyPackIntegrity(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, calculated: '', declared: '', error: 'Manifest must be an object' };
  }

  const declared = manifest.integrity || '';
  if (!declared.startsWith('sha256-')) {
    return {
      valid: false,
      calculated: '',
      declared,
      error: 'Manifest missing or invalid integrity format (must start with sha256-)'
    };
  }

  const calculated = computePackIntegrity(manifest);
  const valid = (calculated === declared);

  return {
    valid,
    calculated,
    declared,
    error: valid ? undefined : `Integrity mismatch: declared ${declared} does not match computed ${calculated}`,
  };
}

/**
 * Sign a manifest by computing its integrity and applying publisher metadata.
 * @param {object} manifest
 * @param {object} [publisherMeta] - { publisher: 'SecretShield Team', keyId: 'core-v1' }
 * @returns {object} Signed manifest copy
 */
export function signPack(manifest, publisherMeta = {}) {
  const integrity = computePackIntegrity(manifest);
  return {
    ...manifest,
    integrity,
    signature: {
      publisher: publisherMeta.publisher || manifest.author || 'community',
      keyId: publisherMeta.keyId || 'default-ed25519',
      signedAt: new Date().toISOString(),
      algorithm: 'sha256-canonical',
      value: integrity, // Canonical hash signature
    },
  };
}
