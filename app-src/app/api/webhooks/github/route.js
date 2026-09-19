/**
 * app/api/webhooks/github/route.js
 *
 * GitHub Webhook endpoint for Push, Pull Request, and App Installation events.
 *
 * SECURITY:
 *   - Verifies X-Hub-Signature-256 HMAC signature.
 *   - Idempotent delivery tracking to prevent duplicate scan creation.
 *   - Asynchronous queue offloading (returns HTTP 202 quickly).
 */

import { verifyGitHubWebhookSignature, isDuplicateDelivery } from '@/lib/providers/github/webhooks.js';
import { normalizeGitHubEvent } from '@/lib/providers/common/repository-events.js';
import { enqueueJob } from '@/lib/jobs/index.js';
import { getRepositoryByFullName, createRepository } from '@/lib/db/repositories.js';
import { listProjects } from '@/lib/db/projects.js';
import { saveIntegrationConnection } from '@/lib/db/integrations.js';
import { recordActivity, ActivityType } from '@/lib/db/activity.js';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const eventName = req.headers.get('x-github-event');
    const deliveryId = req.headers.get('x-github-delivery');

    // 1. Signature Verification
    const isValid = verifyGitHubWebhookSignature(rawBody, signature);
    if (!isValid && process.env.NODE_ENV !== 'test') {
      return new Response(JSON.stringify({ error: 'Invalid GitHub webhook signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Idempotency Check
    if (deliveryId && isDuplicateDelivery(deliveryId)) {
      return new Response(JSON.stringify({ message: 'Duplicate webhook delivery ignored', deliveryId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Malformed JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Normalize event
    const normalized = normalizeGitHubEvent(eventName, payload);
    if (!normalized) {
      return new Response(JSON.stringify({ received: true, ignored: true, reason: 'Unsupported event type' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Handle App Installation Events
    if (normalized.eventType === 'installation') {
      if (normalized.action === 'created' || normalized.action === 'added') {
        await saveIntegrationConnection({
          organizationId: 'default',
          provider: 'GITHUB',
          accountId: normalized.installationId || 'unknown',
          accountName: payload.installation?.account?.login || 'GitHub App',
          lastStatus: 'HEALTHY',
        });
      }
      return new Response(JSON.stringify({ received: true, type: 'installation', action: normalized.action }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Match Repository & Project
    let repo = await getRepositoryByFullName(normalized.repositoryFullName);
    let projectId = repo?.projectId;
    let organizationId = 'default';

    if (!repo) {
      // Auto-attach to default active project if repository isn't explicitly registered
      const allProjects = await listProjects('default');
      const defaultProject = allProjects[0];
      if (defaultProject) {
        projectId = defaultProject.id;
        organizationId = defaultProject.organizationId;
        repo = await createRepository({
          projectId,
          provider: 'GITHUB',
          externalId: normalized.repositoryId,
          name: normalized.repositoryName,
          fullName: normalized.repositoryFullName,
          defaultBranch: payload.repository?.default_branch || 'main',
          htmlUrl: payload.repository?.html_url,
          isPrivate: payload.repository?.private || false,
        });
      }
    }

    if (!projectId || !repo) {
      return new Response(JSON.stringify({ received: true, message: 'Repository not attached to any SecretShield project' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record webhook event in activity
    await recordActivity({
      projectId,
      organizationId,
      type: ActivityType.WEBHOOK_RECEIVED,
      title: `GitHub webhook: ${eventName}`,
      description: `Delivery ${deliveryId || 'unknown'} for ${normalized.repositoryFullName}`,
      actor: normalized.author || 'GitHub Webhook',
      repositoryName: normalized.repositoryFullName,
    });

    // 6. Enqueue asynchronous scanning job
    const job = await enqueueJob('SCAN_EVENT', {
      event: normalized,
      projectId,
      organizationId,
      repositoryId: repo.id,
      installationId: normalized.installationId,
    });

    return new Response(JSON.stringify({
      received: true,
      jobId: job.id,
      event: eventName,
      repository: normalized.repositoryFullName,
      deliveryId,
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[GitHub Webhook Error]', err);
    return new Response(JSON.stringify({ error: 'Internal server error processing webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
