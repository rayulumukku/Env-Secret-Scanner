/**
 * @file lib/security/secrets.js
 * @description Enterprise-grade cryptographic envelope for sensitive credentials at rest.
 * 
 * SECURITY INVARIANTS:
 *   - Uses standard Node.js crypto primitives (AES-256-GCM).
 *   - NEVER uses custom or rolling cryptography algorithms.
 *   - Authenticated encryption (GCM) guarantees tamper detection.
 *   - Redacts sensitive keys from loggers, API responses, and diagnostics.
 */

import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SENSITIVE_KEY_PATTERN = /secret|password|token|key|cred|auth|jwt|private|cert/i;

/**
 * Derives a consistent 32-byte (256-bit) encryption key from environment secret or fallback.
 * 
 * @param {string} [providedKey]
 * @returns {Buffer}
 */
function getEncryptionKey(providedKey) {
  const secret = providedKey || process.env.SECRETSHIELD_ENCRYPTION_KEY || process.env.SECRET_KEY || 'secretshield_default_master_encryption_key_32b';
  return createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * 
 * @param {string} plaintext 
 * @param {string} [masterKey] 
 * @returns {{ ciphertext: string, iv: string, authTag: string, algorithm: string }}
 */
export function encryptSecret(plaintext, masterKey) {
  if (plaintext === null || plaintext === undefined) {
    throw new Error('Cannot encrypt null or undefined value');
  }

  const key = getEncryptionKey(masterKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(String(plaintext), 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag,
    algorithm: ALGORITHM
  };
}

/**
 * Decrypts an AES-256-GCM envelope.
 * 
 * @param {{ ciphertext: string, iv: string, authTag: string }} envelope 
 * @param {string} [masterKey] 
 * @returns {string} Plaintext
 */
export function decryptSecret(envelope, masterKey) {
  if (!envelope || !envelope.ciphertext || !envelope.iv || !envelope.authTag) {
    throw new Error('Invalid encryption envelope: missing ciphertext, iv, or authTag');
  }

  const key = getEncryptionKey(masterKey);
  const iv = Buffer.from(envelope.iv, 'hex');
  const authTag = Buffer.from(envelope.authTag, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(envelope.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Safely masks a token or secret value for UI and logs (e.g. `ghp_••••••••5678`).
 * 
 * @param {string} value 
 * @returns {string} Masked string
 */
export function maskSecret(value) {
  if (!value || typeof value !== 'string') return '••••••••';
  if (value.length <= 8) return '••••••••';

  const prefix = value.slice(0, 4);
  const suffix = value.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Recursively redacts sensitive keys from an object for logging or API output.
 * 
 * @param {any} target 
 * @returns {any} Sanitized object
 */
export function redactSensitiveKeys(target) {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    return target.map(redactSensitiveKeys);
  }

  const sanitized = {};
  for (const [k, v] of Object.entries(target)) {
    if (SENSITIVE_KEY_PATTERN.test(k) && typeof v === 'string') {
      sanitized[k] = maskSecret(v);
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = redactSensitiveKeys(v);
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}
