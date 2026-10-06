/**
 * lib/runtime/correlation.js
 *
 * Secret-to-Environment & Deployment Correlation Engine for SecretShield.
 *
 * SAFETY INVARIANTS:
 * - A finding in .env.example must NEVER be treated as production deployment configuration.
 * - Do NOT infer production impact merely from filenames containing "prod".
 * - All correlations must be evidence-backed with provenance traces.
 * - Do NOT claim "Production compromised" without authoritative deployment & execution evidence.
 */

import { ENVIRONMENT_TYPES } from './model.js';

export const FILE_CONTEXT_TYPE = Object.freeze({
  EXAMPLE_TEMPLATE: 'EXAMPLE_TEMPLATE',
  TEST_FIXTURE: 'TEST_FIXTURE',
  LOCAL_DEV: 'LOCAL_DEV',
  CI_PIPELINE: 'CI_PIPELINE',
  DEPLOYMENT_MANIFEST: 'DEPLOYMENT_MANIFEST',
  APPLICATION_CODE: 'APPLICATION_CODE',
});

/**
 * Analyze file path context to distinguish examples and test fixtures from deployment configurations.
 *
 * @param {string} filePath
 * @returns {object} File context analysis with risk multiplier and evidence
 */
export function analyzeFileContext(filePath = '') {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();

  // 1. Example / Documentation templates (.env.example, sample.env)
  if (
    norm.endsWith('.example') ||
    norm.includes('.example.') ||
    norm.endsWith('.sample') ||
    norm.includes('/sample/') ||
    norm.includes('/examples/') ||
    norm.startsWith('docs/') ||
    norm.includes('/docs/')
  ) {
    return {
      type: FILE_CONTEXT_TYPE.EXAMPLE_TEMPLATE,
      environmentCandidate: ENVIRONMENT_TYPES.DEVELOPMENT,
      isExampleOrTemplate: true,
      description: 'Example/template file; typically synthetic documentation placeholders, not deployed secrets.',
      evidence: `File pattern '${filePath}' matched example/template rule`,
    };
  }

  // 2. Test Fixtures / Mocks
  if (
    norm.includes('test/') ||
    norm.includes('tests/') ||
    norm.includes('__tests__/') ||
    norm.includes('fixtures/') ||
    norm.includes('mock/') ||
    norm.includes('spec/')
  ) {
    return {
      type: FILE_CONTEXT_TYPE.TEST_FIXTURE,
      environmentCandidate: ENVIRONMENT_TYPES.TEST,
      isExampleOrTemplate: false,
      description: 'Test suite or mock fixture file; evaluated in test harness, not deployed to live environments.',
      evidence: `File path '${filePath}' located in test or fixture directory`,
    };
  }

  // 3. Local Development files
  if (
    norm.endsWith('.env.local') ||
    norm.endsWith('.env.development') ||
    norm.endsWith('.env.dev') ||
    norm.includes('docker-compose.dev') ||
    norm.includes('dev.config')
  ) {
    return {
      type: FILE_CONTEXT_TYPE.LOCAL_DEV,
      environmentCandidate: ENVIRONMENT_TYPES.DEVELOPMENT,
      isExampleOrTemplate: false,
      description: 'Local development configuration; restricted to developer workstations.',
      evidence: `File pattern '${filePath}' matches local development configuration`,
    };
  }

  // 4. CI/CD pipeline manifests
  if (
    norm.startsWith('.github/') ||
    norm.startsWith('.gitlab-ci') ||
    norm.includes('jenkins') ||
    norm.includes('.circleci')
  ) {
    return {
      type: FILE_CONTEXT_TYPE.CI_PIPELINE,
      environmentCandidate: ENVIRONMENT_TYPES.TEST,
      isExampleOrTemplate: false,
      description: 'CI/CD pipeline workflow definition; executes inside build automation runners.',
      evidence: `File path '${filePath}' matches continuous integration workflow`,
    };
  }

  // 5. Deployment manifests (k8s, helm, terraform, cloudformation)
  if (
    norm.includes('k8s/') ||
    norm.includes('kubernetes/') ||
    norm.includes('helm/') ||
    norm.includes('terraform/') ||
    norm.includes('deploy/') ||
    norm.endsWith('docker-compose.yml') ||
    norm.endsWith('docker-compose.yaml')
  ) {
    return {
      type: FILE_CONTEXT_TYPE.DEPLOYMENT_MANIFEST,
      environmentCandidate: ENVIRONMENT_TYPES.CUSTOM,
      isExampleOrTemplate: false,
      description: 'Infrastructure or deployment orchestration manifest; may govern container or cloud deployment.',
      evidence: `File path '${filePath}' is an infrastructure or deployment manifest`,
    };
  }

  return {
    type: FILE_CONTEXT_TYPE.APPLICATION_CODE,
    environmentCandidate: ENVIRONMENT_TYPES.CUSTOM,
    isExampleOrTemplate: false,
    description: 'Application source code or standard configuration.',
    evidence: `File path '${filePath}' categorized as standard application source`,
  };
}

/**
 * Correlate finding with deployment records and environment definitions.
 *
 * @param {object} params
 * @param {object} params.finding - Secret finding
 * @param {object[]} [params.deployments=[]] - List of deployments
 * @param {object[]} [params.environments=[]] - Registered environments
 * @param {object[]} [params.cloudResources=[]] - Cloud resources
 * @returns {object} Evidence-backed correlation
 */
export function correlateFindingToRuntime({
  finding,
  deployments = [],
  environments = [],
  cloudResources = [],
}) {
  const filePath = finding.file || '';
  const fileContext = analyzeFileContext(filePath);
  const commitSha = finding.commitHash || null;

  // Find deployments matching this commit SHA or branch
  const matchingDeployments = commitSha
    ? deployments.filter(d => d.commitSha === commitSha || d.commitSha.startsWith(commitSha) || commitSha.startsWith(d.commitSha))
    : [];

  // Determine affected environments backed by evidence
  const affectedEnvironments = [];
  let isProductionAssociated = false;

  for (const dep of matchingDeployments) {
    // Resolve environment definition
    const matchedEnv = environments.find(e => e.name.toLowerCase() === dep.environment.toLowerCase());
    const isProd = matchedEnv ? Boolean(matchedEnv.isProduction) : (dep.environment.toLowerCase() === 'production');

    if (isProd) {
      isProductionAssociated = true;
    }

    affectedEnvironments.push({
      environmentName: dep.environment,
      environmentType: matchedEnv?.environmentType || ENVIRONMENT_TYPES.CUSTOM,
      isProduction: isProd,
      deploymentId: dep.id,
      deploymentStatus: dep.status,
      timestamp: dep.createdAt,
      evidence: `Commit ${commitSha ? commitSha.slice(0, 8) : 'HEAD'} was deployed to ${dep.environment} via deployment #${dep.id}`,
    });
  }

  // Correlate associated cloud resources if deployed to an environment linked to cloud resources
  const associatedCloudResources = [];
  if (affectedEnvironments.length > 0) {
    for (const env of affectedEnvironments) {
      const resForEnv = cloudResources.filter(r => r.environment && r.environment.toLowerCase() === env.environmentName.toLowerCase());
      for (const res of resForEnv) {
        associatedCloudResources.push({
          resourceId: res.resourceId,
          resourceType: res.resourceType,
          provider: res.provider,
          environment: res.environment,
          evidence: `Resource ${res.resourceId} (${res.provider}) is assigned to environment ${env.environmentName}`,
        });
      }
    }
  }

  // Construct factual provenance description
  let correlationStatement = '';
  if (fileContext.isExampleOrTemplate) {
    correlationStatement = `Finding in template '${filePath}' (.env.example/doc). No active runtime exposure inferred.`;
  } else if (matchingDeployments.length === 0) {
    correlationStatement = `Finding present in source commit ${commitSha ? commitSha.slice(0, 8) : 'uncommitted'}. No deployment records match this commit.`;
  } else if (isProductionAssociated) {
    correlationStatement = `Evidence confirms commit ${commitSha.slice(0, 8)} was deployed to production environment (Deployment #${matchingDeployments[0].id}).`;
  } else {
    correlationStatement = `Evidence confirms commit ${commitSha.slice(0, 8)} was deployed to non-production environment(s): ${affectedEnvironments.map(e => e.environmentName).join(', ')}.`;
  }

  return {
    findingId: finding.id,
    fingerprint: finding.fingerprint,
    fileContext,
    commitSha,
    isExampleOrTemplate: fileContext.isExampleOrTemplate,
    deploymentsCount: matchingDeployments.length,
    matchingDeployments,
    affectedEnvironments,
    isProductionAssociated,
    associatedCloudResources,
    correlationStatement,
    provenance: {
      ruleMatched: fileContext.evidence,
      deploymentEvidence: matchingDeployments.map(d => `Deployment #${d.id} [${d.environment}] on commit ${d.commitSha}`),
      evaluatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Historical Deployment Exposure Tracker.
 * Tracks when a secret was present in previously deployed commits.
 *
 * @param {object} params
 * @param {string} params.fingerprint
 * @param {object[]} params.commitHistory - List of commits where fingerprint was detected
 * @param {object[]} params.allDeployments - All deployment records
 * @returns {object} Historical deployment exposure timeline
 */
export function trackHistoricalDeploymentExposure({
  fingerprint,
  commitHistory = [],
  allDeployments = [],
}) {
  const deployedCommitsWithFinding = [];
  const commitShasWithSecret = new Set(commitHistory.map(c => c.commitSha || c.hash));

  for (const dep of allDeployments) {
    if (commitShasWithSecret.has(dep.commitSha)) {
      deployedCommitsWithFinding.push({
        id: dep.id,
        deploymentId: dep.id,
        commitSha: dep.commitSha,
        environment: dep.environment,
        provider: dep.provider,
        status: dep.status,
        deployedAt: dep.createdAt,
      });
    }
  }

  // Sort chronologically
  deployedCommitsWithFinding.sort((a, b) => new Date(a.deployedAt).getTime() - new Date(b.deployedAt).getTime());

  const firstDeployment = deployedCommitsWithFinding[0] || null;
  const lastDeployment = deployedCommitsWithFinding[deployedCommitsWithFinding.length - 1] || null;

  return {
    fingerprint,
    hasHistoricalDeploymentExposure: deployedCommitsWithFinding.length > 0,
    historicalDeploymentsCount: deployedCommitsWithFinding.length,
    firstKnownDeployment: firstDeployment,
    lastKnownDeployment: lastDeployment,
    deployedDeployments: deployedCommitsWithFinding,
  };
}
