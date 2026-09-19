/**
 * lib/auth/password.js
 *
 * Secure password hashing using Node.js crypto.scrypt.
 *
 * Format: "scrypt$<salt_hex>$<hash_hex>"
 * Uses 16-byte random salt and 64-byte key length.
 * Verifies with timingSafeEqual to protect against timing attacks.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

/**
 * Hash a plaintext password securely.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, KEY_LEN, SCRYPT_OPTIONS);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verify a plaintext password against a stored hash.
 * @param {string} password
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const salt = parts[1];
  const expectedHash = Buffer.from(parts[2], 'hex');

  try {
    const derivedKey = scryptSync(password, salt, expectedHash.length, SCRYPT_OPTIONS);
    return timingSafeEqual(derivedKey, expectedHash);
  } catch {
    return false;
  }
}
