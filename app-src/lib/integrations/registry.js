/**
 * @file lib/integrations/registry.js
 * @description Central Integration Registry coordinating provider adapters with unified interfaces.
 * 
 * INTEGRATION ADAPTER CONTRACT:
 *   - id: string
 *   - name: string
 *   - description: string
 *   - category: IntegrationCategory
 *   - permissions: Object
 *   - connect(credentials, context): Promise<Object>
 *   - disconnect(context): Promise<boolean>
 *   - healthCheck(context): Promise<Object>
 *   - handleEvent(event, context): Promise<Object>
 */

import { INTEGRATION_MANIFESTS, getManifestById } from './manifest.js';
import { getIntegrationPermissions } from './permissions.js';
import { checkIntegrationHealth } from './health.js';
import { normalizeIntegrationEvent, eventDeduplicator } from './events.js';
import { secureIntegrationConfig } from './storage.js';

class IntegrationRegistry {
  constructor() {
    this.adapters = new Map();
    this.registerBuiltInAdapters();
  }

  registerBuiltInAdapters() {
    // GitHub Adapter
    this.registerAdapter({
      id: 'github',
      name: 'GitHub',
      category: 'Source Control',
      async connect(credentials = {}, context = {}) {
        const secured = secureIntegrationConfig(credentials);
        return {
          id: 'github',
          provider: 'GITHUB',
          status: 'CONNECTED',
          accountId: credentials.accountId || 'org_github_app',
          accountName: credentials.accountName || 'SecretShield GitHub App',
          permissions: ['contents:read', 'pull_requests:read', 'checks:write'],
          maskedSummary: secured.maskedSummary,
          connectedAt: new Date().toISOString()
        };
      },
      async disconnect(context = {}) {
        return true;
      },
      async healthCheck(connection) {
        return checkIntegrationHealth('github', connection);
      },
      async handleEvent(rawEvent, context) {
        const normalized = normalizeIntegrationEvent('github', rawEvent.type || 'push', rawEvent, context);
        if (eventDeduplicator.isDuplicate('github', normalized.id, rawEvent)) {
          return { status: 'DUPLICATE_IGNORED', event: normalized };
        }
        return { status: 'PROCESSED', event: normalized };
      }
    });

    // GitLab Adapter
    this.registerAdapter({
      id: 'gitlab',
      name: 'GitLab',
      category: 'Source Control',
      async connect(credentials = {}, context = {}) {
        const secured = secureIntegrationConfig(credentials);
        return {
          id: 'gitlab',
          provider: 'GITLAB',
          status: 'CONNECTED',
          accountId: credentials.accountId || 'gitlab_instance',
          accountName: credentials.accountName || 'GitLab CI Integration',
          maskedSummary: secured.maskedSummary,
          connectedAt: new Date().toISOString()
        };
      },
      async disconnect() {
        return true;
      },
      async healthCheck(connection) {
        return checkIntegrationHealth('gitlab', connection);
      },
      async handleEvent(rawEvent, context) {
        const normalized = normalizeIntegrationEvent('gitlab', rawEvent.type || 'Push Hook', rawEvent, context);
        if (eventDeduplicator.isDuplicate('gitlab', normalized.id, rawEvent)) {
          return { status: 'DUPLICATE_IGNORED', event: normalized };
        }
        return { status: 'PROCESSED', event: normalized };
      }
    });

    // Slack Adapter
    this.registerAdapter({
      id: 'slack',
      name: 'Slack',
      category: 'Communication',
      async connect(credentials = {}, context = {}) {
        const secured = secureIntegrationConfig(credentials);
        return {
          id: 'slack',
          provider: 'SLACK',
          status: 'CONNECTED',
          channel: credentials.channel || '#security-alerts',
          maskedSummary: secured.maskedSummary,
          connectedAt: new Date().toISOString()
        };
      },
      async disconnect() {
        return true;
      },
      async healthCheck(connection) {
        return checkIntegrationHealth('slack', connection);
      },
      async handleEvent(eventPayload) {
        return { status: 'PROCESSED', channel: '#security-alerts' };
      }
    });

    // Custom Webhooks Adapter
    this.registerAdapter({
      id: 'webhooks',
      name: 'Custom Webhooks',
      category: 'Webhooks',
      async connect(credentials = {}, context = {}) {
        return {
          id: 'webhooks',
          provider: 'WEBHOOKS',
          status: 'CONFIGURED',
          connectedAt: new Date().toISOString()
        };
      },
      async disconnect() {
        return true;
      },
      async healthCheck(connection) {
        return { status: 'HEALTHY', healthy: true, message: 'Webhook delivery engine active.' };
      },
      async handleEvent(eventPayload) {
        return { status: 'DISPATCHED' };
      }
    });
  }

  registerAdapter(adapter) {
    if (!adapter.id) throw new Error('Adapter must have an id');
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(id) {
    return this.adapters.get(id) || null;
  }

  listManifests() {
    return INTEGRATION_MANIFESTS.map(m => ({
      ...m,
      permissions: getIntegrationPermissions(m.id)
    }));
  }
}

export const integrationRegistry = new IntegrationRegistry();
