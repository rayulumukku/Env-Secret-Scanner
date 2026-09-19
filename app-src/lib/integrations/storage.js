/**
 * @file lib/integrations/storage.js
 * @description Encrypted integration credentials storage helper.
 * 
 * SECURITY INVARIANT:
 *   - Encrypts all authorization tokens, private keys, and client secrets using AES-256-GCM.
 *   - Strips plaintext credentials before returning records to controllers.
 */

import { encryptSecret, decryptSecret, maskSecret } from '../security/secrets.js';

/**
 * Encrypts and sanitizes integration configuration payload for storage.
 * 
 * @param {Object} rawConfig 
 * @returns {Object} Encrypted storage record
 */
export function secureIntegrationConfig(rawConfig = {}) {
  const encryptedFields = {};
  const maskedSummary = {};

  for (const [key, val] of Object.entries(rawConfig)) {
    if (typeof val === 'string' && val.length > 0) {
      // Encrypt sensitive fields
      if (/token|key|secret|password|cert/i.test(key)) {
        encryptedFields[key] = encryptSecret(val);
        maskedSummary[key] = maskSecret(val);
      } else {
        encryptedFields[key] = val;
        maskedSummary[key] = val;
      }
    } else {
      encryptedFields[key] = val;
      maskedSummary[key] = val;
    }
  }

  return {
    encryptedPayload: JSON.stringify(encryptedFields),
    maskedSummary
  };
}

/**
 * Decrypts sensitive fields for internal server-side execution.
 * 
 * @param {string} encryptedPayloadJson 
 * @returns {Object} Plaintext config
 */
export function readSecureIntegrationConfig(encryptedPayloadJson) {
  if (!encryptedPayloadJson) return {};
  let parsed;
  try {
    parsed = typeof encryptedPayloadJson === 'string' ? JSON.parse(encryptedPayloadJson) : encryptedPayloadJson;
  } catch {
    return {};
  }

  const decrypted = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v && typeof v === 'object' && v.ciphertext && v.iv && v.authTag) {
      try {
        decrypted[k] = decryptSecret(v);
      } catch {
        decrypted[k] = null;
      }
    } else {
      decrypted[k] = v;
    }
  }

  return decrypted;
}
