/**
 * lib/cloud/model.js
 *
 * Cloud Posture Finding & Resource Models for SecretShield.
 *
 * SAFETY INVARIANTS:
 * - Category is strictly CLOUD_POSTURE (separated from secret detection findings).
 * - NEVER stores raw credentials in cloud findings or resources.
 * - Read-only metadata posture checks only. Zero automated infrastructure mutation.
 */

import { randomUUID } from 'crypto';

export const CLOUD_PROVIDERS = Object.freeze({
  AWS: 'aws',
  GCP: 'gcp',
  AZURE: 'azure',
  GENERIC: 'generic',
});

export const POSTURE_SEVERITY = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
});

export const CLOUD_FINDING_STATUS = Object.freeze({
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  MUTED: 'MUTED',
});

export const RESOURCE_POSTURE_STATUS = Object.freeze({
  SECURE: 'SECURE',
  WARNING: 'WARNING',
  DEFICIENT: 'DEFICIENT',
  UNKNOWN: 'UNKNOWN',
});

/**
 * Factory for creating a normalized CLOUD_POSTURE Finding.
 *
 * @param {object} params
 * @returns {object} Normalized Cloud Posture Finding
 */
export function createCloudPostureFinding({
  id = null,
  organizationId,
  cloudAccountId,
  resourceId,
  resourceType,
  provider,
  severity = POSTURE_SEVERITY.MEDIUM,
  title,
  description,
  evidence = {},
  remediation = {},
  policyRule = null,
  status = CLOUD_FINDING_STATUS.OPEN,
}) {
  if (!organizationId) throw new Error('organizationId is required for cloud posture finding');
  if (!cloudAccountId) throw new Error('cloudAccountId is required for cloud posture finding');
  if (!resourceId) throw new Error('resourceId is required for cloud posture finding');
  if (!provider) throw new Error('provider is required for cloud posture finding');
  if (!title) throw new Error('title is required for cloud posture finding');

  return {
    id: id || `cpf_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    cloudAccountId,
    resourceId,
    resourceType: resourceType || 'unknown_resource',
    category: 'CLOUD_POSTURE', // Strictly separated from secret findings
    severity: Object.values(POSTURE_SEVERITY).includes(severity) ? severity : POSTURE_SEVERITY.MEDIUM,
    title,
    description: description || title,
    evidence: {
      source: 'READ_ONLY_METADATA_INSPECTION',
      timestamp: new Date().toISOString(),
      ...evidence,
    },
    provider,
    remediation: {
      issue: title,
      affectedResource: resourceId,
      recommendedChange: remediation.recommendedChange || 'Review resource security configuration in provider management console.',
      verificationMethod: remediation.verificationMethod || 'Re-run cloud metadata synchronization after applying configuration update.',
      automatedModificationAttempted: false, // Invariant: SecretShield never modifies cloud infrastructure
      ...remediation,
    },
    policyRule: policyRule || 'DEFAULT_CLOUD_POSTURE_BASELINE',
    status: Object.values(CLOUD_FINDING_STATUS).includes(status) ? status : CLOUD_FINDING_STATUS.OPEN,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Factory for normalized Cloud Resource record.
 *
 * @param {object} params
 * @returns {object} Normalized Cloud Resource
 */
export function createCloudResource({
  id = null,
  organizationId,
  cloudAccountId,
  provider,
  resourceType,
  resourceId,
  arnOrUri = null,
  region = 'global',
  environment = null,
  metadata = {},
  postureStatus = RESOURCE_POSTURE_STATUS.SECURE,
}) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!cloudAccountId) throw new Error('cloudAccountId is required');
  if (!provider) throw new Error('provider is required');
  if (!resourceId) throw new Error('resourceId is required');

  return {
    id: id || `cres_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    cloudAccountId,
    provider,
    resourceType: resourceType || 'generic_resource',
    resourceId,
    arnOrUri: arnOrUri || `${provider}://${region}/${resourceId}`,
    region: region || 'global',
    environment: environment || null,
    metadata,
    postureStatus: Object.values(RESOURCE_POSTURE_STATUS).includes(postureStatus) ? postureStatus : RESOURCE_POSTURE_STATUS.SECURE,
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
