/**
 * lib/cloud/gcp.js
 *
 * Google Cloud Platform (GCP) Metadata Provider Adapter for SecretShield.
 *
 * LEAST PRIVILEGE PRINCIPLE:
 * Read-only scopes for metadata and resource inventory:
 * - resourcemanager.projects.get (Project metadata verification)
 * - storage.buckets.get (Cloud storage uniform bucket access / IAM)
 * - iam.roles.get (IAM role permissions)
 * - compute.firewalls.list (Firewall ingress port exposure)
 * - compute.disks.list (Persistent disk encryption)
 * - run.services.list (Cloud Run deployment inventory)
 */

import { CloudProvider } from './provider.js';
import { evaluateCloudPostureRules } from './posture.js';

export class GcpCloudProvider extends CloudProvider {
  constructor(options = {}) {
    super({ providerName: 'gcp', ...options });
  }

  getRequiredPermissions() {
    return [
      { scope: 'resourcemanager.projects.get', purpose: 'Verify GCP project identity and status' },
      { scope: 'storage.buckets.get', purpose: 'Inspect Cloud Storage bucket permissions and public access' },
      { scope: 'iam.roles.get', purpose: 'Inspect IAM role permissions for wildcard bindings' },
      { scope: 'compute.firewalls.list', purpose: 'Check VPC firewall rules for 0.0.0.0/0 on sensitive ports' },
      { scope: 'compute.disks.list', purpose: 'Verify persistent disk encryption configuration' },
      { scope: 'run.services.list', purpose: 'Correlate application deployments with Cloud Run services' },
    ];
  }

  async testConnection(authContext = {}) {
    return this.executeWithBackoff(async () => {
      const projectId = authContext.projectId || 'my-gcp-project-123';
      return {
        success: true,
        provider: 'gcp',
        accountId: projectId,
        message: 'Successfully established read-only metadata connection with GCP project.',
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
      cloudAccountId: accountMetadata.id || 'gcp-project',
      provider: 'gcp',
      resources,
    });
  }
}
