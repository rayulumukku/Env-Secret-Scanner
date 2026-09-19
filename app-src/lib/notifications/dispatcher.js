/**
 * lib/notifications/dispatcher.js
 *
 * In-app and external notification dispatcher.
 */

import { createNotification } from '../db/notifications.js';

/**
 * Dispatch an alert notification.
 */
export async function sendNotification({
  organizationId,
  userId,
  type = 'CRITICAL_SECRET',
  title,
  message,
  link,
}) {
  return createNotification({
    organizationId,
    userId,
    type,
    title,
    message,
    link,
  });
}

/**
 * Provider interfaces for external notification delivery (e.g. Slack, Email).
 */
export const NOTIFICATION_PROVIDERS = {
  slack: {
    name: 'Slack Webhook',
    async send(webhookUrl, { title, message, link, type }) {
      if (!webhookUrl) return false;
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🛡️ *SecretShield Alert*: ${title}\n${message}${link ? `\n<${link}|View Finding in Dashboard>` : ''}`,
          }),
        });
        return true;
      } catch {
        return false;
      }
    },
  },
  email: {
    name: 'Email Provider Interface',
    async send(to, { title, message, link }) {
      // Pluggable provider interface (e.g. SendGrid, Resend, SMTP)
      console.log(`[SecretShield Email Alert] To: ${to} | Subject: ${title} | ${message}`);
      return true;
    },
  },
};
