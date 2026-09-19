/**
 * app/api/projects/[id]/webhooks/route.js
 *
 * Project webhook management.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listWebhooks, createWebhook } from '@/lib/db/webhooks';
import { logAuditEvent } from '@/lib/db/audit';
import { randomBytes } from 'crypto';

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'PROJECT_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const webhooks = await listWebhooks(auth.organization.id, id);
  return jsonSuccess(webhooks);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthContext(req, { requiredPermission: 'WEBHOOK_MANAGE' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { url, events = ['scan.completed', 'critical.finding.created'] } = await req.json().catch(() => ({}));
  if (!url || !url.startsWith('http')) {
    return jsonError('A valid HTTP(S) URL is required for webhooks.', 'INVALID_URL', 400);
  }

  // Generate unique HMAC secret
  const secret = `whsec_${randomBytes(24).toString('hex')}`;

  const webhook = await createWebhook({
    organizationId: auth.organization.id,
    projectId: id,
    url,
    secret,
    events,
  });

  await logAuditEvent({
    organizationId: auth.organization.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'WEBHOOK_CREATED',
    targetType: 'Webhook',
    targetId: webhook.id,
    metadata: { url, events },
  });

  // Return secret only ONCE upon creation
  return jsonSuccess({
    ...webhook,
    signingSecret: secret,
    secretWarning: 'Copy this signing secret now. It will never be shown again.',
  }, 201);
}
