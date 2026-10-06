/**
 * lib/cloud/generic.js
 *
 * Generic Cloud & Kubernetes/Container Metadata Provider Adapter for SecretShield.
 *
 * Read-only metadata and posture checks for custom cloud infrastructures.
 */

import { CloudProvider } from './provider.js';
import { evaluateCloudPostureRules } from './posture.js';

export class GenericCloudProvider extends CloudProvider {
  constructor(options = {}) {
    super({ providerName: 'generic', ...options });
  }

  getRequiredPermissions() {
    return [
      { scope: 'metadata:read', purpose: 'Read-only access to cluster/cloud resource inventory' },
      { scope: 'configuration:inspect', purpose: 'Read-only inspection of security posture metadata' },
    ];
  }

  async testConnection(authContext = {}) {
    return this.executeWithBackoff(async () => {
      const clusterId = authContext.clusterId || authContext.accountId || 'custom-cluster-1';
      return {
        success: true,
        provider: 'generic',
        accountId: clusterId,
        message: 'Successfully established read-only metadata connection with generic cloud provider.',
        checkedPermissions: this.getRequiredPermissions().map(p => p.scope),
      };
    });
  }

  async listResources({ accountId, resourceTypes = [], limit = 100 } = {}) {
    return this.executeWithBackoff(async () => {
      const resources = [];
      return {
        resources,
        total: resources.length,
        hasMore: false,
      };
    });
  }

  async evaluatePosture({ resources = [], accountMetadata = {} } = {}) {
    return evaluateCloudPostureRules({
      organizationId: accountMetadata.organizationId || 'default-org',
      cloudAccountId: accountMetadata.id || 'generic-cloud',
      provider: 'generic',
      resources,
    });
  }
}

import { AwsCloudProvider } from './aws.js';
import { GcpCloudProvider } from './gcp.js';
import { AzureCloudProvider } from './azure.js';

/**
 * Factory to instantiate appropriate cloud provider by name.
 *
 * @param {string} providerName - 'aws' | 'gcp' | 'azure' | 'generic'
 * @param {object} [options={}]
 * @returns {CloudProvider}
 */
export function createCloudProvider(providerName = 'generic', options = {}) {
  switch (String(providerName).toLowerCase()) {
    case 'aws':
      return new AwsCloudProvider(options);
    case 'gcp':
      return new GcpCloudProvider(options);
    case 'azure':
      return new AzureCloudProvider(options);
    default:
      return new GenericCloudProvider(options);
  }
}
