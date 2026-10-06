/**
 * lib/cloud/provider.js
 *
 * Cloud Provider Interface & Least-Privilege Contract for SecretShield.
 *
 * DESIGN PRINCIPLES:
 * - Read-only metadata and configuration inspection ONLY.
 * - Explicit required permission manifests displayed prior to connection.
 * - Provider-agnostic abstraction isolating SecretShield core from vendor APIs.
 * - Robust backoff, retry, and rate limit handling.
 * - NEVER log credentials or connection tokens.
 */

import { validateCloudEndpoint } from './ssrf.js';

export class CloudProvider {
  /**
   * @param {object} options
   * @param {string} options.providerName - 'aws' | 'gcp' | 'azure' | 'generic'
   * @param {string} [options.endpoint] - Optional custom endpoint (subject to SSRF validation)
   * @param {boolean} [options.allowCustomLocalMock=false] - For test suites
   */
  constructor({ providerName, endpoint = null, allowCustomLocalMock = false } = {}) {
    this.providerName = providerName || 'generic';
    this.allowCustomLocalMock = allowCustomLocalMock;

    if (endpoint) {
      this.endpoint = validateCloudEndpoint(endpoint, { allowCustomLocalMock });
    } else {
      this.endpoint = null;
    }
  }

  /**
   * Return explicit read-only scopes/permissions required for this provider.
   *
   * @returns {Array<{ scope: string, purpose: string }>}
   */
  getRequiredPermissions() {
    throw new Error('getRequiredPermissions() must be implemented by subclass');
  }

  /**
   * Test read-only connection to cloud provider using credentials or role metadata.
   * NEVER authenticates third-party credentials found in code.
   *
   * @param {object} authContext - Sanitized credentials or IAM assume-role descriptor
   * @returns {Promise<{ success: boolean, accountId: string, message: string }>}
   */
  async testConnection(authContext) {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * List cloud resources metadata for account.
   *
   * @param {object} params
   * @param {string} params.accountId
   * @param {string[]} [params.resourceTypes]
   * @param {number} [params.limit=100]
   * @returns {Promise<{ resources: object[], hasMore: boolean }>}
   */
  async listResources({ accountId, resourceTypes, limit = 100 }) {
    throw new Error('listResources() must be implemented by subclass');
  }

  /**
   * Evaluate security posture on discovered metadata.
   *
   * @param {object} params
   * @param {object[]} params.resources
   * @param {object} [params.accountMetadata]
   * @returns {Promise<object[]>} Array of CLOUD_POSTURE findings
   */
  async evaluatePosture({ resources, accountMetadata }) {
    throw new Error('evaluatePosture() must be implemented by subclass');
  }

  /**
   * Helper for executing calls with retries, exponential backoff, and rate-limit handling.
   *
   * @param {Function} apiFn
   * @param {number} [maxRetries=2]
   * @returns {Promise<any>}
   */
  async executeWithBackoff(apiFn, maxRetries = 2) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await apiFn();
      } catch (err) {
        attempt++;
        const isRateLimit = err.status === 429 || err.code === 'ThrottlingException' || err.message?.includes('Rate exceeded');
        if (attempt > maxRetries || !isRateLimit) {
          throw err;
        }
        const delay = Math.pow(2, attempt) * 200;
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
}
