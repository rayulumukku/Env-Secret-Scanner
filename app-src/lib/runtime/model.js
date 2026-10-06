/**
 * lib/runtime/model.js
 *
 * Normalized Runtime Asset Model & Security Invariants for SecretShield.
 *
 * SECURITY INVARIANTS:
 * - STORE METADATA ONLY.
 * - NEVER store: API keys, passwords, private keys, access tokens, session tokens.
 * - Any attempt to persist raw credentials throws an invariant validation error.
 * - Environments: DEVELOPMENT, TEST, STAGING, PRODUCTION, CUSTOM.
 * - Zero assumption of production status from arbitrary names (e.g., "prod" substring).
 */

import { randomUUID } from 'crypto';

export const ASSET_TYPES = Object.freeze({
  APPLICATION: 'APPLICATION',
  DEPLOYMENT: 'DEPLOYMENT',
  ENVIRONMENT: 'ENVIRONMENT',
  CLOUD_ACCOUNT: 'CLOUD_ACCOUNT',
  CLOUD_PROJECT: 'CLOUD_PROJECT',
  SERVICE: 'SERVICE',
  DATABASE: 'DATABASE',
  STORAGE: 'STORAGE',
  CI_CD: 'CI_CD',
  CONTAINER: 'CONTAINER',
  SERVERLESS_FUNCTION: 'SERVERLESS_FUNCTION',
  REPOSITORY: 'REPOSITORY',
});

export const ENVIRONMENT_TYPES = Object.freeze({
  DEVELOPMENT: 'DEVELOPMENT',
  TEST: 'TEST',
  STAGING: 'STAGING',
  PRODUCTION: 'PRODUCTION',
  CUSTOM: 'CUSTOM',
});

export const DEPLOYMENT_STATUS = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  IN_PROGRESS: 'IN_PROGRESS',
  ROLLED_BACK: 'ROLLED_BACK',
});

export const DEPLOYMENT_PROVIDERS = Object.freeze({
  GITHUB_ACTIONS: 'github_actions',
  GITLAB_CI: 'gitlab_ci',
  VERCEL: 'vercel',
  AWS_ECS: 'aws_ecs',
  K8S: 'k8s',
  DOCKER: 'docker',
  GENERIC: 'generic',
});

// Forbidden credential key pattern to prevent credential storage in metadata
const FORBIDDEN_CREDENTIAL_PATTERN = /^(api_?key|password|passwd|secret|private_?key|access_?token|auth_?token|session_?token|bearer_?token|cert_?key)$/i;

/**
 * Validates metadata object to guarantee ZERO raw credentials.
 * Throws if prohibited credential keys or plaintext credential values are found.
 *
 * @param {object} metadata
 * @returns {object} Clean non-sensitive metadata
 */
export function validateAndSanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return {};

  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_CREDENTIAL_PATTERN.test(key.trim())) {
      throw new Error(`SECURITY VIOLATION: Forbidden credential property '${key}' cannot be stored in runtime asset metadata.`);
    }

    if (typeof value === 'string') {
      // Reject raw private key headers or potential raw token formats
      if (value.includes('BEGIN PRIVATE KEY') || value.includes('BEGIN RSA PRIVATE KEY')) {
        throw new Error(`SECURITY VIOLATION: Private key PEM detected in metadata property '${key}'.`);
      }
      clean[key] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      clean[key] = validateAndSanitizeMetadata(value);
    } else if (Array.isArray(value)) {
      clean[key] = value.map(item => (typeof item === 'object' && item !== null ? validateAndSanitizeMetadata(item) : item));
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Create a normalized Runtime Asset record.
 *
 * @param {object} params
 * @returns {object} Normalized Runtime Asset
 */
export function createRuntimeAsset({
  id = null,
  organizationId,
  assetType,
  name,
  identifier,
  environment = ENVIRONMENT_TYPES.CUSTOM,
  repositoryId = null,
  projectId = null,
  metadata = {},
}) {
  if (!organizationId) throw new Error('organizationId is required for runtime asset');
  if (!assetType || !ASSET_TYPES[assetType]) {
    throw new Error(`Invalid assetType '${assetType}'. Must be one of: ${Object.keys(ASSET_TYPES).join(', ')}`);
  }
  if (!name || typeof name !== 'string') throw new Error('Valid asset name is required');
  if (!identifier || typeof identifier !== 'string') throw new Error('Valid asset identifier is required');

  const sanitizedMetadata = validateAndSanitizeMetadata(metadata);

  return {
    id: id || `asset_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    assetType,
    name: name.trim(),
    identifier: identifier.trim(),
    environment: Object.values(ENVIRONMENT_TYPES).includes(environment) ? environment : ENVIRONMENT_TYPES.CUSTOM,
    repositoryId: repositoryId || null,
    projectId: projectId || null,
    metadata: sanitizedMetadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a normalized Deployment record.
 *
 * @param {object} params
 * @returns {object} Normalized Deployment
 */
export function createDeployment({
  id = null,
  organizationId,
  repositoryId,
  projectId = null,
  environment,
  commitSha,
  branch = 'main',
  provider = DEPLOYMENT_PROVIDERS.GENERIC,
  status = DEPLOYMENT_STATUS.SUCCESS,
  actor = null,
  buildIdentifier = null,
  metadata = {},
}) {
  if (!organizationId) throw new Error('organizationId is required for deployment');
  if (!repositoryId) throw new Error('repositoryId is required for deployment');
  if (!environment) throw new Error('environment is required for deployment');
  if (!commitSha || typeof commitSha !== 'string') throw new Error('Valid commitSha is required for deployment');

  const sanitizedMetadata = validateAndSanitizeMetadata(metadata);

  return {
    id: id || `dep_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    repositoryId,
    projectId: projectId || null,
    environment,
    commitSha: commitSha.trim(),
    branch: branch || 'main',
    provider: provider || DEPLOYMENT_PROVIDERS.GENERIC,
    status: Object.values(DEPLOYMENT_STATUS).includes(status) ? status : DEPLOYMENT_STATUS.SUCCESS,
    actor: actor || 'CI/CD Automated Runner',
    buildIdentifier: buildIdentifier || null,
    metadata: sanitizedMetadata,
    createdAt: new Date().toISOString(),
    completedAt: status === DEPLOYMENT_STATUS.SUCCESS || status === DEPLOYMENT_STATUS.FAILED ? new Date().toISOString() : null,
  };
}

/**
 * Create a normalized Deployment Event.
 *
 * @param {object} params
 * @returns {object}
 */
export function createDeploymentEvent({
  deploymentId,
  eventType,
  summary,
  metadata = {},
}) {
  if (!deploymentId) throw new Error('deploymentId is required');
  if (!eventType) throw new Error('eventType is required');
  if (!summary) throw new Error('summary is required');

  return {
    id: `depevt_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    deploymentId,
    eventType,
    summary,
    metadata: validateAndSanitizeMetadata(metadata),
    timestamp: new Date().toISOString(),
  };
}
