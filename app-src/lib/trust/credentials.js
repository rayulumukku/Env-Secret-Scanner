/**
 * lib/trust/credentials.js
 *
 * Metadata-Only Credential & Token Inventory Manager for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - NEVER stores raw credential values, passwords, or secret tokens.
 *   - Links credentials strictly by cryptographic SHA-256 fingerprint.
 *   - Tracks factual metadata: provider, location, rotation status, and last seen timestamps.
 */

import { randomUUID } from 'crypto';

export const CREDENTIAL_TYPES = Object.freeze({
  API_KEY: 'API_KEY',
  OAUTH_TOKEN: 'OAUTH_TOKEN',
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  PRIVATE_KEY: 'PRIVATE_KEY',
  WEBHOOK_SECRET: 'WEBHOOK_SECRET',
  SERVICE_ACCOUNT: 'SERVICE_ACCOUNT',
});

export const ROTATION_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  ROTATION_REQUIRED: 'ROTATION_REQUIRED',
  ROTATED: 'ROTATED',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN',
});

/**
 * Create a metadata-only credential inventory record.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.credentialType
 * @param {string} params.provider
 * @param {string} [params.owner]
 * @param {string} [params.locationMetadata]
 * @param {string} [params.fingerprint] - SHA-256 fingerprint (never raw value)
 * @param {string} [params.rotationStatus='ACTIVE']
 * @param {string} [params.expiresAt]
 * @returns {object} CredentialInventory
 */
export function createCredentialInventoryRecord({
  organizationId,
  credentialType,
  provider,
  owner = 'Service Owner',
  locationMetadata = '',
  fingerprint = null,
  rotationStatus = ROTATION_STATUSES.ACTIVE,
  expiresAt = null,
}) {
  if (!organizationId || !provider) {
    throw new Error('organizationId and provider are required');
  }

  const validStatus = Object.values(ROTATION_STATUSES).includes(rotationStatus)
    ? rotationStatus
    : ROTATION_STATUSES.ACTIVE;

  const validCat = Object.values(CREDENTIAL_TYPES).includes(credentialType)
    ? credentialType
    : CREDENTIAL_TYPES.API_KEY;

  return {
    id: `cred_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    credentialType: validCat,
    provider: String(provider).slice(0, 80),
    owner: String(owner || 'Service Owner').slice(0, 100),
    locationMetadata: String(locationMetadata || '').slice(0, 250),
    fingerprint: fingerprint ? String(fingerprint).slice(0, 64) : null,
    rotationStatus: validStatus,
    lastSeenAt: new Date().toISOString(),
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
