/**
 * lib/db/rule-packs.js
 *
 * Database persistence layer for Rule Packs, Organization Rules, and Community Submissions.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';
import { computePackIntegrity } from '../scanner/rule-packs/integrity.js';

export const SUBMISSION_STATUSES = [
  'DRAFT',
  'VALIDATING',
  'AUTOMATED_TESTS_PASSED',
  'UNDER_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
  'DEPRECATED'
];

/**
 * Create or save a Rule Pack in the database.
 */
export async function saveRulePack(packData) {
  const { client, isPostgres } = await getDb();
  const id = packData.id || `pack_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const integrity = packData.integrity || computePackIntegrity(packData);
  const now = new Date();

  const record = {
    id,
    name: packData.name,
    version: packData.version || '1.0.0',
    description: packData.description || '',
    author: packData.author || 'Anonymous',
    license: packData.license || 'Apache-2.0',
    organizationId: packData.organizationId || null,
    isPublic: Boolean(packData.isPublic),
    isBuiltin: Boolean(packData.isBuiltin),
    isEnabled: packData.isEnabled !== false,
    minimumScannerVersion: packData.minimumScannerVersion || '1.0.0',
    rules: packData.rules || [],
    integrity,
    createdAt: packData.createdAt || now,
    updatedAt: now,
  };

  if (isPostgres && client.rulePack) {
    return client.rulePack.upsert({
      where: { id },
      update: record,
      create: record,
    });
  }

  memoryDb.rulePacks.set(id, record);
  return record;
}

/**
 * List rule packs (filtered by organization or public availability).
 */
export async function listDbRulePacks(filter = {}) {
  const { client, isPostgres } = await getDb();

  if (isPostgres && client.rulePack) {
    return client.rulePack.findMany({
      where: {
        ...(filter.organizationId ? { OR: [{ organizationId: filter.organizationId }, { isPublic: true }] } : {}),
        ...(filter.isPublic !== undefined ? { isPublic: filter.isPublic } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  let list = Array.from(memoryDb.rulePacks.values());
  if (filter.organizationId) {
    list = list.filter(p => !p.organizationId || p.organizationId === filter.organizationId || p.isPublic);
  }
  if (filter.isPublic !== undefined) {
    list = list.filter(p => p.isPublic === filter.isPublic);
  }
  return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Create a Community Rule Submission.
 */
export async function createRuleSubmission({
  name,
  description,
  author,
  authorEmail,
  license = 'MIT',
  rules = [],
  notes = '',
}) {
  const { client, isPostgres } = await getDb();
  const id = `sub_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();

  const record = {
    id,
    name,
    description,
    author,
    authorEmail: authorEmail || null,
    license,
    rules,
    notes,
    status: 'UNDER_REVIEW',
    submittedAt: now,
    reviewedAt: null,
    reviewer: null,
    reviewComments: null,
    createdAt: now,
    updatedAt: now,
  };

  if (isPostgres && client.ruleSubmission) {
    return client.ruleSubmission.create({ data: record });
  }

  memoryDb.ruleSubmissions.set(id, record);
  return record;
}

/**
 * List community submissions.
 */
export async function listRuleSubmissions(filter = {}) {
  const { client, isPostgres } = await getDb();

  if (isPostgres && client.ruleSubmission) {
    return client.ruleSubmission.findMany({
      where: filter.status ? { status: filter.status } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  let list = Array.from(memoryDb.ruleSubmissions.values());
  if (filter.status) {
    list = list.filter(s => s.status === filter.status);
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Review a community submission (Approve, Publish, or Reject).
 */
export async function reviewRuleSubmission(id, { status, reviewer, comments }) {
  const { client, isPostgres } = await getDb();
  const now = new Date();

  if (isPostgres && client.ruleSubmission) {
    return client.ruleSubmission.update({
      where: { id },
      data: {
        status,
        reviewer,
        reviewComments: comments,
        reviewedAt: now,
        updatedAt: now,
      },
    });
  }

  const sub = memoryDb.ruleSubmissions.get(id);
  if (!sub) {
    throw new Error(`Submission '${id}' not found`);
  }

  sub.status = status;
  sub.reviewer = reviewer || 'admin';
  sub.reviewComments = comments || '';
  sub.reviewedAt = now;
  sub.updatedAt = now;

  // If approved and published, convert into an active rule pack
  if (status === 'PUBLISHED') {
    const pack = {
      id: `comm_${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: sub.name,
      version: '1.0.0',
      description: sub.description,
      author: sub.author,
      license: sub.license,
      isPublic: true,
      rules: sub.rules,
    };
    await saveRulePack(pack);
  }

  return sub;
}
