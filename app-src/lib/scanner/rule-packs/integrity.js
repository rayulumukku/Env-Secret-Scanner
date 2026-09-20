/**
 * lib/scanner/rule-packs/integrity.js
 *
 * Cryptographic integrity and signature verification for SecretShield Rule Packs.
 */

import { createHash } from 'crypto';

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
    if (key === 'integrity' || key === 'signature') {
      continue;
    }
    result[key] = canonicalize(value[key]);
  }
  return result;
}

export function computePackIntegrity(manifest) {
  const canonicalObj = canonicalize(manifest);
  const canonicalStr = JSON.stringify(canonicalObj);
  const hash = createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
  return `sha256-${hash}`;
}

export function verifyPackIntegrity(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, error: 'Manifest must be an object' };
  }
  const declared = manifest.integrity || '';
  if (!declared.startsWith('sha256-')) {
    return { valid: false, error: 'Manifest missing or invalid integrity format (must start with sha256-)' };
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
