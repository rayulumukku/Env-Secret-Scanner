/**
 * app/api/integrations/github/route.js
 *
 * Manage GitHub App connection, installation sync, and project attachments.
 */

import { getAuthContext } from '@/lib/auth/context.js';
import { isGitHubAppConfigured, generateGitHubAppJwt } from '@/lib/providers/github/app.js';
import { listAppInstallations, listInstallationRepositories, getAppInstallationUrl } from '@/lib/providers/github/installation.js';
import { removeIntegrationConnection } from '@/lib/db/integrations.js';
import { createRepository } from '@/lib/db/repositories.js';

export async function GET(req) {
  try {
    const auth = await getAuthContext(req);
    const isConfigured = isGitHubAppConfigured();

    let installations = [];
    if (isConfigured) {
      try {
        installations = await listAppInstallations();
      } catch (err) {
        console.error('[GitHub Integration] Error listing installations:', err.message);
      }
    }

    const installUrl = isConfigured ? getAppInstallationUrl(auth.currentOrgId) : null;

    return new Response(JSON.stringify({
      isConfigured,
      appId: process.env.GITHUB_APP_ID || null,
      installUrl,
      installations: installations.map(inst => ({
        id: inst.id,
        account: inst.account?.login,
        targetType: inst.target_type,
        avatarUrl: inst.account?.avatar_url,
        createdAt: inst.created_at,
        repositoriesCount: inst.repositories_count,
      })),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthContext(req);
    const body = await req.json();
    const { installationId, projectId, repositories = [] } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const created = [];
    for (const repo of repositories) {
      const rec = await createRepository({
        projectId,
        provider: 'GITHUB',
        externalId: String(repo.id),
        name: repo.name,
        fullName: repo.fullName || repo.full_name,
        defaultBranch: repo.defaultBranch || 'main',
        htmlUrl: repo.htmlUrl || repo.html_url,
        isPrivate: repo.isPrivate || repo.private || false,
      });
      created.push(rec);
    }

    return new Response(JSON.stringify({ success: true, count: created.length, repositories: created }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(req) {
  try {
    const auth = await getAuthContext(req);
    const orgId = auth.currentOrgId || 'default';
    await removeIntegrationConnection(orgId, 'GITHUB');

    return new Response(JSON.stringify({ success: true, message: 'GitHub integration disconnected' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
