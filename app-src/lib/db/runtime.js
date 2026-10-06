/**
 * lib/db/runtime.js
 *
 * Database persistence layer for Runtime Assets, Deployments, Environments, and Gates.
 * Supports both PostgreSQL via Prisma and high-performance in-memory fallback.
 *
 * SAFETY INVARIANTS:
 * - Multi-tenant isolation: all operations strictly scoped to organizationId.
 * - Zero raw secrets stored in asset metadata or deployment records.
 * - Audit logging on state modifications.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';
import { logAuditEvent } from './audit.js';
import { createRuntimeAsset, createDeployment } from '../runtime/model.js';
import { normalizeEnvironment } from '../runtime/environments.js';

/**
 * List runtime assets for an organization.
 */
export async function listRuntimeAssets({
  organizationId,
  assetType = null,
  environment = null,
  limit = 50,
  offset = 0,
}) {
  if (!organizationId) throw new Error('organizationId is required');
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const where = { organizationId };
    if (assetType) where.assetType = assetType;
    if (environment) where.environment = environment;

    const [assets, total] = await Promise.all([
      client.runtimeAsset.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      client.runtimeAsset.count({ where }),
    ]);

    return {
      assets: assets.map(a => ({
        ...a,
        metadata: a.metadataJson ? JSON.parse(a.metadataJson) : {},
      })),
      total,
    };
  }

  let list = Array.from(memoryDb.runtimeAssets.values()).filter(a => a.organizationId === organizationId);
  if (assetType) list = list.filter(a => a.assetType === assetType);
  if (environment) list = list.filter(a => a.environment === environment);

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);
  return { assets: paginated, total };
}

/**
 * Upsert a runtime asset.
 */
export async function upsertRuntimeAsset(assetData, actor = 'System') {
  if (!assetData.organizationId) throw new Error('organizationId is required');
  const asset = createRuntimeAsset(assetData);
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const saved = await client.runtimeAsset.upsert({
      where: { id: asset.id },
      create: {
        id: asset.id,
        organizationId: asset.organizationId,
        assetType: asset.assetType,
        name: asset.name,
        identifier: asset.identifier,
        environment: asset.environment,
        repositoryId: asset.repositoryId,
        projectId: asset.projectId,
        metadataJson: JSON.stringify(asset.metadata),
      },
      update: {
        name: asset.name,
        identifier: asset.identifier,
        environment: asset.environment,
        metadataJson: JSON.stringify(asset.metadata),
        updatedAt: new Date(),
      },
    });

    await logAuditEvent({
      organizationId: asset.organizationId,
      action: 'RUNTIME_ASSET_UPSERTED',
      targetType: 'RuntimeAsset',
      targetId: asset.id,
      metadata: { name: asset.name, assetType: asset.assetType, actor },
    });

    return { ...saved, metadata: asset.metadata };
  }

  memoryDb.runtimeAssets.set(asset.id, asset);
  await logAuditEvent({
    organizationId: asset.organizationId,
    action: 'RUNTIME_ASSET_UPSERTED',
    targetType: 'RuntimeAsset',
    targetId: asset.id,
    metadata: { name: asset.name, assetType: asset.assetType, actor },
  });

  return asset;
}

/**
 * List deployments for an organization.
 */
export async function listDeployments({
  organizationId,
  repositoryId = null,
  environment = null,
  commitSha = null,
  limit = 50,
  offset = 0,
}) {
  if (!organizationId) throw new Error('organizationId is required');
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const where = { organizationId };
    if (repositoryId) where.repositoryId = repositoryId;
    if (environment) where.environment = environment;
    if (commitSha) where.commitSha = commitSha;

    const [deployments, total] = await Promise.all([
      client.deployment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      client.deployment.count({ where }),
    ]);

    return {
      deployments: deployments.map(d => ({
        ...d,
        metadata: d.metadataJson ? JSON.parse(d.metadataJson) : {},
      })),
      total,
    };
  }

  let list = Array.from(memoryDb.deployments.values()).filter(d => d.organizationId === organizationId);
  if (repositoryId) list = list.filter(d => d.repositoryId === repositoryId);
  if (environment) list = list.filter(d => d.environment.toLowerCase() === environment.toLowerCase());
  if (commitSha) list = list.filter(d => d.commitSha === commitSha);

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);
  return { deployments: paginated, total };
}

/**
 * Create a deployment record.
 */
export async function recordDeployment(deploymentData, actor = 'System') {
  if (!deploymentData.organizationId) throw new Error('organizationId is required');
  const deployment = createDeployment(deploymentData);
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const saved = await client.deployment.create({
      data: {
        id: deployment.id,
        organizationId: deployment.organizationId,
        repositoryId: deployment.repositoryId,
        projectId: deployment.projectId,
        environment: deployment.environment,
        commitSha: deployment.commitSha,
        branch: deployment.branch,
        provider: deployment.provider,
        status: deployment.status,
        actor: deployment.actor,
        buildIdentifier: deployment.buildIdentifier,
        metadataJson: JSON.stringify(deployment.metadata),
        createdAt: new Date(deployment.createdAt),
      },
    });

    await logAuditEvent({
      organizationId: deployment.organizationId,
      action: 'DEPLOYMENT_RECORDED',
      targetType: 'Deployment',
      targetId: deployment.id,
      metadata: {
        commitSha: deployment.commitSha,
        environment: deployment.environment,
        provider: deployment.provider,
        actor,
      },
    });

    return { ...saved, metadata: deployment.metadata };
  }

  memoryDb.deployments.set(deployment.id, deployment);
  await logAuditEvent({
    organizationId: deployment.organizationId,
    action: 'DEPLOYMENT_RECORDED',
    targetType: 'Deployment',
    targetId: deployment.id,
    metadata: {
      commitSha: deployment.commitSha,
      environment: deployment.environment,
      provider: deployment.provider,
      actor,
    },
  });

  return deployment;
}

/**
 * List registered environments for an organization.
 */
export async function listEnvironments(organizationId) {
  if (!organizationId) throw new Error('organizationId is required');
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    return client.deploymentEnvironment.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  return Array.from(memoryDb.deploymentEnvironments.values()).filter(e => e.organizationId === organizationId);
}

/**
 * Upsert an environment definition.
 */
export async function upsertEnvironment(envData, actor = 'System') {
  if (!envData.organizationId) throw new Error('organizationId is required');
  const norm = normalizeEnvironment(envData);
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const saved = await client.deploymentEnvironment.upsert({
      where: {
        organizationId_name: {
          organizationId: norm.organizationId,
          name: norm.name,
        },
      },
      create: {
        id: norm.id,
        organizationId: norm.organizationId,
        name: norm.name,
        environmentType: norm.environmentType,
        isProduction: norm.isProduction,
        description: norm.description,
      },
      update: {
        environmentType: norm.environmentType,
        isProduction: norm.isProduction,
        description: norm.description,
        updatedAt: new Date(),
      },
    });

    await logAuditEvent({
      organizationId: norm.organizationId,
      action: 'ENVIRONMENT_UPDATED',
      targetType: 'DeploymentEnvironment',
      targetId: norm.id,
      metadata: { name: norm.name, isProduction: norm.isProduction, actor },
    });

    return saved;
  }

  const existingKey = `${norm.organizationId}:${norm.name}`;
  memoryDb.deploymentEnvironments.set(existingKey, norm);

  await logAuditEvent({
    organizationId: norm.organizationId,
    action: 'ENVIRONMENT_UPDATED',
    targetType: 'DeploymentEnvironment',
    targetId: norm.id,
    metadata: { name: norm.name, isProduction: norm.isProduction, actor },
  });

  return norm;
}

/**
 * Record a deployment gate decision.
 */
export async function recordDeploymentGateDecision(decisionData) {
  const id = `gate_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const record = {
    id,
    ...decisionData,
    evaluatedAt: decisionData.evaluatedAt || new Date().toISOString(),
  };

  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    await client.deploymentGateDecision.create({
      data: {
        id,
        organizationId: decisionData.organizationId,
        deploymentId: decisionData.deploymentId || null,
        commitSha: decisionData.commitSha,
        environment: decisionData.environment,
        decision: decisionData.decision,
        reason: decisionData.reason,
        policyViolationsJson: JSON.stringify(decisionData.violations || []),
        evaluatedAt: new Date(record.evaluatedAt),
      },
    });
  } else {
    memoryDb.deploymentGateDecisions.unshift(record);
  }

  await logAuditEvent({
    organizationId: decisionData.organizationId,
    action: 'DEPLOYMENT_GATE_DECISION',
    targetType: 'DeploymentGate',
    targetId: id,
    metadata: {
      commitSha: decisionData.commitSha,
      environment: decisionData.environment,
      decision: decisionData.decision,
    },
  });

  return record;
}
