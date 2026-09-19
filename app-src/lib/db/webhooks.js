/**
 * lib/db/webhooks.js
 *
 * Webhooks persistence and deliveries.
 */

import { randomUUID, createHash } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function createWebhook({
  organizationId,
  projectId,
  url,
  secret,
  events = ['scan.completed', 'critical.finding.created'],
}) {
  const { client, isPostgres } = await getDb();
  const secretHash = createHash('sha256').update(secret).digest('hex');
  const eventsJson = JSON.stringify(events);

  if (isPostgres) {
    return client.webhook.create({
      data: {
        organizationId,
        projectId,
        url,
        secretHash,
        eventsJson,
      },
    });
  }

  const id = `wh_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date();
  const webhook = {
    id,
    organizationId,
    projectId: projectId || null,
    url,
    secretHash,
    secret, // Kept in memory for local dispatching
    eventsJson,
    isEnabled: true,
    lastDeliveredAt: null,
    lastStatus: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryDb.webhooks.set(id, webhook);
  return webhook;
}

export async function listWebhooks(organizationId, projectId) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    const webhooks = await client.webhook.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        deliveries: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
    // Never return secretHash to UI
    return webhooks.map(w => {
      const { secretHash, ...safe } = w;
      return safe;
    });
  }

  return [...memoryDb.webhooks.values()]
    .filter(w => w.organizationId === organizationId && (!projectId || w.projectId === projectId))
    .map(w => {
      const { secretHash, secret, ...safe } = w;
      const deliveries = memoryDb.webhookDeliveries
        .filter(d => d.webhookId === w.id)
        .slice(0, 5);
      return { ...safe, deliveries };
    });
}

export async function logWebhookDelivery({ webhookId, event, payload, status, responseCode, responseBody, durationMs }) {
  const { client, isPostgres } = await getDb();
  const payloadJson = JSON.stringify(payload);

  if (isPostgres) {
    await client.webhook.update({
      where: { id: webhookId },
      data: { lastDeliveredAt: new Date(), lastStatus: responseCode || (status === 'SUCCESS' ? 200 : 500) },
    });

    return client.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payloadJson,
        status,
        responseCode,
        responseBody,
        durationMs,
      },
    });
  }

  const delivery = {
    id: `del_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    webhookId,
    event,
    payloadJson,
    status,
    responseCode,
    responseBody,
    durationMs,
    createdAt: new Date(),
  };
  memoryDb.webhookDeliveries.unshift(delivery);

  const wh = memoryDb.webhooks.get(webhookId);
  if (wh) {
    wh.lastDeliveredAt = new Date();
    wh.lastStatus = responseCode || (status === 'SUCCESS' ? 200 : 500);
    memoryDb.webhooks.set(webhookId, wh);
  }

  return delivery;
}
