/**
 * lib/db/integrations.js
 *
 * Integration health, connections, and metadata persistence.
 */

import { getPrismaClient, isDatabaseAvailable } from './client.js';

// In-memory integration store
const integrationStore = new Map();

/**
 * Get all integration statuses for an organization.
 *
 * @param {string} organizationId
 * @returns {Promise<object>} Integration health status cards
 */
export async function getIntegrationHealth(organizationId) {
  const isGithubConfigured = !!(process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY);
  const isGitlabConfigured = !!(process.env.GITLAB_CLIENT_ID || process.env.GITLAB_WEBHOOK_SECRET);
  const isSlackConfigured = !!process.env.SLACK_WEBHOOK_URL;

  // Retrieve stored connection details
  let connections = [];
  if (isDatabaseAvailable()) {
    try {
      const prisma = await getPrismaClient();
      connections = await prisma.providerConnection.findMany({
        where: { organizationId },
      });
    } catch {
      connections = [];
    }
  }

  const inMemoryConn = Array.from(integrationStore.values()).filter(c => c.organizationId === organizationId);
  const allConns = [...connections, ...inMemoryConn];

  const githubConn = allConns.find(c => c.provider === 'GITHUB');
  const gitlabConn = allConns.find(c => c.provider === 'GITLAB');
  const slackConn = allConns.find(c => c.provider === 'SLACK');

  return {
    github: {
      id: 'github',
      name: 'GitHub App',
      description: 'Automatic push and pull request scanning with GitHub Checks',
      status: githubConn ? 'CONNECTED' : isGithubConfigured ? 'READY_TO_CONNECT' : 'CONFIG_REQUIRED',
      isConnected: !!githubConn,
      accountId: githubConn?.accountId || null,
      accountName: githubConn?.accountName || null,
      lastEventAt: githubConn?.lastEventAt || null,
      lastStatus: githubConn?.lastStatus || (githubConn ? 'HEALTHY' : null),
      lastError: githubConn?.lastError || null,
      docsUrl: '/docs/github-protection',
    },
    gitlab: {
      id: 'gitlab',
      name: 'GitLab Integration',
      description: 'Webhook-driven secret scanning for GitLab pushes and merge requests',
      status: gitlabConn ? 'CONNECTED' : isGitlabConfigured ? 'READY_TO_CONNECT' : 'CONFIG_REQUIRED',
      isConnected: !!gitlabConn,
      accountId: gitlabConn?.accountId || null,
      accountName: gitlabConn?.accountName || null,
      lastEventAt: gitlabConn?.lastEventAt || null,
      lastStatus: gitlabConn?.lastStatus || (gitlabConn ? 'HEALTHY' : null),
      lastError: gitlabConn?.lastError || null,
      docsUrl: '/docs',
    },
    slack: {
      id: 'slack',
      name: 'Slack Alerts',
      description: 'Real-time incident cards in your team communication channels',
      status: slackConn ? 'CONNECTED' : isSlackConfigured ? 'READY_TO_CONNECT' : 'NOT_CONFIGURED',
      isConnected: !!slackConn || !!process.env.SLACK_WEBHOOK_URL,
      accountName: slackConn?.accountName || (process.env.SLACK_WEBHOOK_URL ? '#security-alerts' : null),
      lastEventAt: slackConn?.lastEventAt || null,
      lastStatus: slackConn?.lastStatus || (slackConn ? 'HEALTHY' : null),
      lastError: slackConn?.lastError || null,
      docsUrl: '/integrations/slack',
    },
    webhooks: {
      id: 'webhooks',
      name: 'Custom Webhooks',
      description: 'HMAC-SHA256 signed event streams for custom SIEM and SOAR pipelines',
      status: 'AVAILABLE',
      isConnected: true,
      lastEventAt: null,
      lastStatus: 'HEALTHY',
    },
    cli: {
      id: 'cli',
      name: 'Developer CLI',
      description: 'Local pre-commit and staged scanning with zero-credential transmission',
      status: 'AVAILABLE',
      isConnected: true,
      lastEventAt: null,
      lastStatus: 'HEALTHY',
    },
    cicd: {
      id: 'cicd',
      name: 'CI/CD Pipelines',
      description: 'GitHub Actions, GitLab CI, and SARIF 2.1.0 report ingestion',
      status: 'AVAILABLE',
      isConnected: true,
      lastEventAt: null,
      lastStatus: 'HEALTHY',
    },
  };
}

/**
 * Save or update an integration connection.
 *
 * @param {object} params
 */
export async function saveIntegrationConnection({
  organizationId,
  provider,
  accountId,
  accountName,
  scopes = null,
  lastStatus = 'HEALTHY',
  lastError = null,
}) {
  const now = new Date();
  const connKey = `${organizationId}_${provider}_${accountId}`;

  const record = {
    id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    organizationId,
    provider,
    accountId,
    accountName,
    scopes,
    lastStatus,
    lastError,
    lastEventAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  integrationStore.set(connKey, record);

  if (isDatabaseAvailable()) {
    try {
      const prisma = await getPrismaClient();
      return await prisma.providerConnection.upsert({
        where: {
          organizationId_provider_accountId: {
            organizationId,
            provider,
            accountId,
          },
        },
        update: {
          accountName,
          scopes,
          updatedAt: now,
        },
        create: {
          organizationId,
          provider,
          accountId,
          accountName,
          scopes,
        },
      });
    } catch {
      // Fallback
    }
  }

  return record;
}

/**
 * Record integration activity or error.
 */
export async function recordIntegrationEvent(organizationId, provider, { status = 'HEALTHY', error = null } = {}) {
  for (const [key, val] of integrationStore.entries()) {
    if (val.organizationId === organizationId && val.provider === provider) {
      val.lastEventAt = new Date().toISOString();
      val.lastStatus = status;
      val.lastError = error;
      integrationStore.set(key, val);
    }
  }
}

/**
 * Disconnect an integration.
 */
export async function removeIntegrationConnection(organizationId, provider, accountId = null) {
  for (const [key, val] of integrationStore.entries()) {
    if (val.organizationId === organizationId && val.provider === provider) {
      if (!accountId || val.accountId === accountId) {
        integrationStore.delete(key);
      }
    }
  }

  if (isDatabaseAvailable()) {
    try {
      const prisma = await getPrismaClient();
      const where = { organizationId, provider };
      if (accountId) where.accountId = accountId;
      await prisma.providerConnection.deleteMany({ where });
    } catch {
      // Fallback
    }
  }

  return true;
}
