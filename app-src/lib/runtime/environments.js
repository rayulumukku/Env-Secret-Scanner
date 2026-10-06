/**
 * lib/runtime/environments.js
 *
 * Environment Registry & Hierarchy Mapper for SecretShield.
 *
 * MAPPING HIERARCHY:
 * Repository -> Project -> Environment -> Deployment
 *
 * SECURITY INVARIANT:
 * - DO NOT assume an environment is production merely because its name contains "prod".
 * - Environments must have an explicit isProduction flag or authoritative configuration mapping.
 */

import { ENVIRONMENT_TYPES } from './model.js';

export const STANDARD_ENVIRONMENTS = [
  { name: 'development', type: ENVIRONMENT_TYPES.DEVELOPMENT, isProduction: false, description: 'Local and shared developer instances' },
  { name: 'test', type: ENVIRONMENT_TYPES.TEST, isProduction: false, description: 'Automated test suites and CI runners' },
  { name: 'staging', type: ENVIRONMENT_TYPES.STAGING, isProduction: false, description: 'Pre-release mirror of production' },
  { name: 'production', type: ENVIRONMENT_TYPES.PRODUCTION, isProduction: true, description: 'Live customer-facing environment' },
];

/**
 * Validate and normalize environment definition.
 *
 * @param {object} env
 * @returns {object} Normalized environment definition
 */
export function normalizeEnvironment(env = {}) {
  const name = String(env.name || env.environment || '').trim().toLowerCase();
  if (!name) {
    throw new Error('Environment name is required');
  }

  // Authoritative production check: explicitly defined in isProduction property
  // We NEVER assume isProduction: true merely because name contains "prod"
  let isProduction = false;
  if (typeof env.isProduction === 'boolean') {
    isProduction = env.isProduction;
  } else if (name === 'production') {
    isProduction = true; // Exact match only
  }

  let environmentType = ENVIRONMENT_TYPES.CUSTOM;
  if (name === 'production') environmentType = ENVIRONMENT_TYPES.PRODUCTION;
  else if (name === 'staging') environmentType = ENVIRONMENT_TYPES.STAGING;
  else if (name === 'test' || name === 'testing' || name === 'ci') environmentType = ENVIRONMENT_TYPES.TEST;
  else if (name === 'development' || name === 'dev' || name === 'local') environmentType = ENVIRONMENT_TYPES.DEVELOPMENT;
  else if (env.type && Object.values(ENVIRONMENT_TYPES).includes(env.type)) environmentType = env.type;

  return {
    id: env.id || `env_${name}`,
    organizationId: env.organizationId || 'default-org',
    name,
    environmentType,
    isProduction,
    description: env.description || `${name} environment`,
    associatedProjects: Array.isArray(env.associatedProjects) ? env.associatedProjects : [],
    associatedRepositories: Array.isArray(env.associatedRepositories) ? env.associatedRepositories : [],
  };
}

/**
 * Establish a full association chain:
 * Repository -> Project -> Environment -> Deployment
 *
 * @param {object} params
 * @returns {object} Verified association chain
 */
export function createEnvironmentAssociation({
  repository,
  project,
  environment,
  deployment,
}) {
  if (!repository || !repository.id) throw new Error('Repository is required for environment association');
  if (!project || !project.id) throw new Error('Project is required for environment association');
  if (!environment || !environment.name) throw new Error('Environment is required for environment association');

  const normEnv = normalizeEnvironment(environment);

  return {
    chainKey: `${repository.id}:${project.id}:${normEnv.name}:${deployment?.id || 'none'}`,
    repository: {
      id: repository.id,
      name: repository.name || repository.fullName || 'unknown-repo',
    },
    project: {
      id: project.id,
      name: project.name || 'default-project',
    },
    environment: {
      name: normEnv.name,
      type: normEnv.environmentType,
      isProduction: normEnv.isProduction,
    },
    deployment: deployment ? {
      id: deployment.id,
      commitSha: deployment.commitSha,
      status: deployment.status,
      timestamp: deployment.createdAt || new Date().toISOString(),
    } : null,
    provenance: {
      source: 'ORGANIZATION_REGISTRY_MAPPING',
      verifiedAt: new Date().toISOString(),
    },
  };
}
