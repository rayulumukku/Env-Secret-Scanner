/**
 * app/api/webhooks/gitlab/route.js
 *
 * GitLab Webhook endpoint for Push and Merge Request events.
 */

import { verifyGitLabWebhookToken, isDuplicateGitLabDelivery } from '@/lib/providers/gitlab/webhooks.js';
import { normalizeGitLabEvent } from '@/lib/providers/common/repository-events.js';
import { enqueueJob } from '@/lib/jobs/index.js';
import { getRepositoryByFullName, createRepository } from '@/lib/db/repositories.js';
import { listProjects } from '@/lib/db/projects.js';
import { recordActivity, ActivityType } from '@/lib/db/activity.js';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const tokenHeader = req.headers.get('x-gitlab-token');
    const eventHeader = req.headers.get('x-gitlab-event');
    const eventUuid = req.headers.get('x-gitlab-event-uuid');

    // 1. Token Verification
    const isValid = verifyGitLabWebhookToken(tokenHeader);
    if (!isValid && process.env.NODE_ENV !== 'test') {
      return new Response(JSON.stringify({ error: 'Invalid GitLab webhook token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Idempotency Check
    if (eventUuid && isDuplicateGitLabDelivery(eventUuid)) {
      return new Response(JSON.stringify({ message: 'Duplicate GitLab event ignored', eventUuid }), {
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
    const normalized = normalizeGitLabEvent(eventHeader, payload);
    if (!normalized) {
      return new Response(JSON.stringify({ received: true, ignored: true, reason: 'Unsupported event type' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Match Repository & Project
    let repo = await getRepositoryByFullName(normalized.repositoryFullName);
    let projectId = repo?.projectId;
    let organizationId = 'default';

    if (!repo) {
      const allProjects = await listProjects('default');
      const defaultProject = allProjects[0];
      if (defaultProject) {
        projectId = defaultProject.id;
        organizationId = defaultProject.organizationId;
        repo = await createRepository({
          projectId,
          provider: 'GITLAB',
          externalId: normalized.repositoryId,
          name: normalized.repositoryName,
          fullName: normalized.repositoryFullName,
          defaultBranch: payload.project?.default_branch || 'main',
          htmlUrl: payload.project?.web_url,
          isPrivate: payload.project?.visibility === 'private',
        });
      }
    }

    if (!projectId || !repo) {
      return new Response(JSON.stringify({ received: true, message: 'Repository not attached to any SecretShield project' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Record activity
    await recordActivity({
      projectId,
      organizationId,
      type: ActivityType.WEBHOOK_RECEIVED,
      title: `GitLab webhook: ${eventHeader || 'push'}`,
      description: `Delivery ${eventUuid || 'unknown'} for ${normalized.repositoryFullName}`,
      actor: normalized.author || 'GitLab Webhook',
      repositoryName: normalized.repositoryFullName,
    });

    // 5. Enqueue background scan job
    const job = await enqueueJob('SCAN_EVENT', {
      event: normalized,
      projectId,
      organizationId,
      repositoryId: repo.id,
      installationId: null,
    });

    return new Response(JSON.stringify({
      received: true,
      jobId: job.id,
      event: eventHeader,
      repository: normalized.repositoryFullName,
      eventUuid,
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[GitLab Webhook Error]', err);
    return new Response(JSON.stringify({ error: 'Internal server error processing webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
