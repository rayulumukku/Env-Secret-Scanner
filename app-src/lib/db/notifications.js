/**
 * lib/db/notifications.js
 *
 * In-app notification center persistence.
 */

import { randomUUID } from 'crypto';
import { getDb, memoryDb } from './client.js';

export async function createNotification({
  organizationId,
  userId,
  type = 'CRITICAL_SECRET',
  title,
  message,
  link,
}) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.notification.create({
      data: {
        organizationId,
        userId: userId || null,
        type,
        title,
        message,
        link: link || null,
      },
    });
  }

  const id = `notif_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const notification = {
    id,
    organizationId,
    userId: userId || null,
    type,
    title,
    message,
    link: link || null,
    isRead: false,
    createdAt: new Date(),
  };
  memoryDb.notifications.set(id, notification);
  return notification;
}

export async function listNotifications(organizationId, userId, { unreadOnly = false, limit = 30 } = {}) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    const where = {
      organizationId,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      ...(unreadOnly ? { isRead: false } : {}),
    };

    return client.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  let list = [...memoryDb.notifications.values()]
    .filter(n => n.organizationId === organizationId && (!userId || !n.userId || n.userId === userId));

  if (unreadOnly) {
    list = list.filter(n => !n.isRead);
  }

  return list
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export async function markNotificationRead(id) {
  const { client, isPostgres } = await getDb();

  if (isPostgres) {
    return client.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  const notif = memoryDb.notifications.get(id);
  if (notif) {
    notif.isRead = true;
    memoryDb.notifications.set(id, notif);
  }
  return notif;
}
