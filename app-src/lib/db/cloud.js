/**
 * lib/db/cloud.js
 *
 * Database persistence layer for Cloud Accounts, Cloud Resources, and Posture Findings.
 *
 * SAFETY INVARIANTS:
 * - Credentials encrypted at rest using AES-256-GCM (encryptSecret).
 * - NEVER returns plaintext credentials in list or get API responses.
 * - Multi-tenant isolation: all operations strictly scoped to organizationId.
 * - Categorizes findings strictly as CLOUD_POSTURE (separated from secret findings).
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';
import { logAuditEvent } from './audit.js';
import { encryptSecret } from '../security/secrets.js';
import { createCloudResource, createCloudPostureFinding } from '../cloud/model.js';

/**
 * List connected cloud accounts for an organization.
 * NEVER returns credentials.
 */
export async function listCloudAccounts(organizationId) {
  if (!organizationId) throw new Error('organizationId is required');
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const accounts = await client.cloudAccount.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map(a => ({
      id: a.id,
      organizationId: a.organizationId,
      provider: a.provider,
      accountId: a.accountId,
      name: a.name,
      status: a.status,
      permissions: a.permissionsJson ? JSON.parse(a.permissionsJson) : [],
      lastSyncedAt: a.lastSyncedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      // Omit encryptedCredentialsJson
    }));
  }

  const list = Array.from(memoryDb.cloudAccounts.values())
    .filter(a => a.organizationId === organizationId)
    .map(a => {
      const { encryptedCredentials, ...safe } = a;
      return safe;
    });

  return list;
}

/**
 * Get cloud account by ID.
 * NEVER returns plaintext credentials unless explicitly requested internally for worker sync.
 */
export async function getCloudAccount(organizationId, accountId, includeEncryptedCreds = false) {
  if (!organizationId || !accountId) return null;
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const acc = await client.cloudAccount.findFirst({
      where: { id: accountId, organizationId },
    });
    if (!acc) return null;

    const safe = {
      id: acc.id,
      organizationId: acc.organizationId,
      provider: acc.provider,
      accountId: acc.accountId,
      name: acc.name,
      status: acc.status,
      permissions: acc.permissionsJson ? JSON.parse(acc.permissionsJson) : [],
      lastSyncedAt: acc.lastSyncedAt,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    };

    if (includeEncryptedCreds && acc.encryptedCredentialsJson) {
      safe.encryptedCredentials = JSON.parse(acc.encryptedCredentialsJson);
    }
    return safe;
  }

  const acc = memoryDb.cloudAccounts.get(accountId);
  if (!acc || acc.organizationId !== organizationId) return null;

  if (includeEncryptedCreds) {
    return { ...acc };
  }

  const { encryptedCredentials, ...safe } = acc;
  return safe;
}

/**
 * Connect a cloud account with encrypted credentials at rest.
 */
export async function connectCloudAccount({
  organizationId,
  provider,
  accountId,
  name,
  credentials = null,
  permissions = [],
  actor = 'Admin',
}) {
  if (!organizationId) throw new Error('organizationId is required');
  if (!provider) throw new Error('provider is required');
  if (!accountId) throw new Error('accountId is required');

  const id = `cacc_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  // Securely encrypt credentials envelope if provided
  let encryptedEnvelope = null;
  if (credentials) {
    const serializedCreds = typeof credentials === 'string' ? credentials : JSON.stringify(credentials);
    encryptedEnvelope = encryptSecret(serializedCreds);
  }

  const record = {
    id,
    organizationId,
    provider: provider.toLowerCase(),
    accountId: String(accountId),
    name: name || `${provider.toUpperCase()} (${accountId})`,
    status: 'CONNECTED',
    permissions: Array.isArray(permissions) ? permissions : [],
    encryptedCredentials: encryptedEnvelope,
    lastSyncedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    await client.cloudAccount.create({
      data: {
        id: record.id,
        organizationId: record.organizationId,
        provider: record.provider,
        accountId: record.accountId,
        name: record.name,
        status: record.status,
        permissionsJson: JSON.stringify(record.permissions),
        encryptedCredentialsJson: encryptedEnvelope ? JSON.stringify(encryptedEnvelope) : null,
      },
    });
  } else {
    memoryDb.cloudAccounts.set(id, record);
  }

  await logAuditEvent({
    organizationId,
    action: 'CLOUD_ACCOUNT_CONNECTED',
    targetType: 'CloudAccount',
    targetId: id,
    metadata: { provider: record.provider, accountId: record.accountId, actor },
  });

  const { encryptedCredentials: omitted, ...safeAccount } = record;
  return safeAccount;
}

/**
 * Disconnect/delete a cloud account and its resources.
 */
export async function disconnectCloudAccount(organizationId, accountId, actor = 'Admin') {
  if (!organizationId || !accountId) throw new Error('Missing organizationId or accountId');
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const existing = await client.cloudAccount.findFirst({
      where: { id: accountId, organizationId },
    });
    if (!existing) return false;

    // Delete associated resources & findings
    await client.cloudResource.deleteMany({ where: { cloudAccountId: accountId } });
    await client.cloudFinding.deleteMany({ where: { cloudAccountId: accountId } });
    await client.cloudAccount.delete({ where: { id: accountId } });
  } else {
    const existing = memoryDb.cloudAccounts.get(accountId);
    if (!existing || existing.organizationId !== organizationId) return false;

    // Clean up memory maps
    for (const [rId, res] of memoryDb.cloudResources.entries()) {
      if (res.cloudAccountId === accountId) memoryDb.cloudResources.delete(rId);
    }
    for (const [fId, find] of memoryDb.cloudFindings.entries()) {
      if (find.cloudAccountId === accountId) memoryDb.cloudFindings.delete(fId);
    }
    memoryDb.cloudAccounts.delete(accountId);
  }

  await logAuditEvent({
    organizationId,
    action: 'CLOUD_ACCOUNT_DISCONNECTED',
    targetType: 'CloudAccount',
    targetId: accountId,
    metadata: { actor },
  });

  return true;
}

/**
 * List cloud resources with filtering and pagination.
 */
export async function listCloudResources({
  organizationId,
  cloudAccountId = null,
  provider = null,
  resourceType = null,
  environment = null,
  limit = 50,
  offset = 0,
}) {
  if (!organizationId) throw new Error('organizationId is required');
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const where = { organizationId };
    if (cloudAccountId) where.cloudAccountId = cloudAccountId;
    if (provider) where.provider = provider;
    if (resourceType) where.resourceType = resourceType;
    if (environment) where.environment = environment;

    const [resources, total] = await Promise.all([
      client.cloudResource.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { lastSyncedAt: 'desc' },
      }),
      client.cloudResource.count({ where }),
    ]);

    return {
      resources: resources.map(r => ({
        ...r,
        metadata: r.metadataJson ? JSON.parse(r.metadataJson) : {},
      })),
      total,
    };
  }

  let list = Array.from(memoryDb.cloudResources.values()).filter(r => r.organizationId === organizationId);
  if (cloudAccountId) list = list.filter(r => r.cloudAccountId === cloudAccountId);
  if (provider) list = list.filter(r => r.provider.toLowerCase() === provider.toLowerCase());
  if (resourceType) list = list.filter(r => r.resourceType === resourceType);
  if (environment) list = list.filter(r => r.environment && r.environment.toLowerCase() === environment.toLowerCase());

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);
  return { resources: paginated, total };
}

/**
 * Upsert cloud resources inventory.
 */
export async function upsertCloudResources(resources = []) {
  if (!Array.isArray(resources) || resources.length === 0) return [];
  const { isPostgres, client } = await getDb();

  const results = [];
  for (const raw of resources) {
    const res = createCloudResource(raw);
    if (isPostgres) {
      await client.cloudResource.upsert({
        where: { id: res.id },
        create: {
          id: res.id,
          organizationId: res.organizationId,
          cloudAccountId: res.cloudAccountId,
          provider: res.provider,
          resourceType: res.resourceType,
          resourceId: res.resourceId,
          arnOrUri: res.arnOrUri,
          region: res.region,
          environment: res.environment,
          metadataJson: JSON.stringify(res.metadata),
          postureStatus: res.postureStatus,
          lastSyncedAt: new Date(res.lastSyncedAt),
        },
        update: {
          postureStatus: res.postureStatus,
          environment: res.environment,
          metadataJson: JSON.stringify(res.metadata),
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      memoryDb.cloudResources.set(res.id, res);
    }
    results.push(res);
  }

  return results;
}

/**
 * List CLOUD_POSTURE findings.
 */
export async function listCloudPostureFindings({
  organizationId,
  cloudAccountId = null,
  severity = null,
  status = null,
  limit = 50,
  offset = 0,
}) {
  if (!organizationId) throw new Error('organizationId is required');
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const where = { organizationId, category: 'CLOUD_POSTURE' };
    if (cloudAccountId) where.cloudAccountId = cloudAccountId;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [findings, total] = await Promise.all([
      client.cloudFinding.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      client.cloudFinding.count({ where }),
    ]);

    return {
      findings: findings.map(f => ({
        ...f,
        evidence: f.evidenceJson ? JSON.parse(f.evidenceJson) : {},
        remediation: f.remediationJson ? JSON.parse(f.remediationJson) : {},
      })),
      total,
    };
  }

  let list = Array.from(memoryDb.cloudFindings.values()).filter(f => f.organizationId === organizationId && f.category === 'CLOUD_POSTURE');
  if (cloudAccountId) list = list.filter(f => f.cloudAccountId === cloudAccountId);
  if (severity) list = list.filter(f => f.severity === severity);
  if (status) list = list.filter(f => f.status === status);

  const total = list.length;
  const paginated = list.slice(offset, offset + limit);
  return { findings: paginated, total };
}

/**
 * Save CLOUD_POSTURE findings.
 */
export async function saveCloudPostureFindings(findings = []) {
  if (!Array.isArray(findings) || findings.length === 0) return [];
  const { isPostgres, client } = await getDb();

  const saved = [];
  for (const raw of findings) {
    const item = createCloudPostureFinding(raw);
    if (isPostgres) {
      await client.cloudFinding.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          organizationId: item.organizationId,
          cloudAccountId: item.cloudAccountId,
          resourceId: item.resourceId,
          category: item.category,
          severity: item.severity,
          title: item.title,
          description: item.description,
          evidenceJson: JSON.stringify(item.evidence),
          provider: item.provider,
          remediationJson: JSON.stringify(item.remediation),
          policyRule: item.policyRule,
          status: item.status,
        },
        update: {
          status: item.status,
          updatedAt: new Date(),
        },
      });
    } else {
      memoryDb.cloudFindings.set(item.id, item);
    }
    saved.push(item);
  }

  return saved;
}
