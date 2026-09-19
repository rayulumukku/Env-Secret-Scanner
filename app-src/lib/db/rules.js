/**
 * lib/db/rules.js
 *
 * Custom detection rules persistence.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function createCustomRule({
  organizationId,
  projectId,
  ruleId,
  name,
  description,
  pattern,
  severity = 'HIGH',
  category = 'Custom',
}) {
  const { client, isPostgres } = await getDb();
  const actualRuleId = ruleId || `CUSTOM_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

  if (isPostgres) {
    return client.customRule.create({
      data: {
        organizationId,
        projectId,
        ruleId: actualRuleId,
        name,
        description,
        pattern,
        severity,
        category,
      },
    });
  }

  const id = `rule_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();
  const rule = {
    id,
    organizationId,
    projectId: projectId || null,
    ruleId: actualRuleId,
    name,
    description: description || null,
    pattern,
    severity,
    category,
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
  memoryDb.customRules.set(id, rule);
  return rule;
}

export async function listCustomRules(organizationId, projectId) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.customRule.findMany({
      where: {
        organizationId,
        ...(projectId ? { OR: [{ projectId }, { projectId: null }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return [...memoryDb.customRules.values()]
    .filter(r => r.organizationId === organizationId && (!projectId || !r.projectId || r.projectId === projectId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
