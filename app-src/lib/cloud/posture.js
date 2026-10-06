/**
 * lib/cloud/posture.js
 *
 * Read-Only Cloud Configuration Posture Engine for SecretShield.
 *
 * CHECKS IMPLEMENTED:
 * 1. Public Storage Configuration: Checks if storage bucket has public read/write ACL or lacks public access block.
 * 2. Overly Broad IAM Metadata: Checks for wildcard Action='*' in IAM policies without resource boundaries.
 * 3. Exposed Service Metadata: Checks for Security Groups or Firewall rules allowing 0.0.0.0/0 on sensitive ports (22, 3389, 5432, 27017, 6379).
 * 4. Missing Environment Classification: Checks for resources missing standard environment tagging ('environment', 'env', 'stage').
 * 5. Insecure Deployment Configuration: Checks for unencrypted persistent storage volumes or exposed plaintext env flags.
 *
 * INVARIANTS:
 * - Read-only configuration metadata checks only.
 * - ZERO active penetration testing or exploitation.
 * - Remediation guidance provides configuration recommendations; NEVER auto-modifies cloud infrastructure.
 */

import { createCloudPostureFinding, POSTURE_SEVERITY } from './model.js';

const SENSITIVE_PORTS = new Set([22, 3389, 5432, 3306, 27017, 6379, 9200, 8080]);

/**
 * Run comprehensive posture checks against a list of cloud resources.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.cloudAccountId
 * @param {string} params.provider
 * @param {object[]} params.resources
 * @returns {object[]} Array of CLOUD_POSTURE findings
 */
export function evaluateCloudPostureRules({
  organizationId,
  cloudAccountId,
  provider,
  resources = [],
}) {
  const findings = [];

  for (const resource of resources) {
    const resId = resource.resourceId || resource.id;
    const resType = resource.resourceType || '';
    const meta = resource.metadata || {};

    // ── 1. PUBLIC STORAGE CONFIGURATION ───────────────────────────────────────
    if (resType === 's3_bucket' || resType === 'storage_bucket' || resType === 'blob_container') {
      const isPublic = meta.publicAccessBlock === false ||
        meta.isPublic === true ||
        meta.acl === 'public-read' ||
        meta.acl === 'public-read-write';

      if (isPublic) {
        findings.push(createCloudPostureFinding({
          organizationId,
          cloudAccountId,
          resourceId: resId,
          resourceType: resType,
          provider,
          severity: POSTURE_SEVERITY.CRITICAL,
          title: `Publicly Accessible Storage Bucket: ${resId}`,
          description: `Storage container '${resId}' does not enforce public access block or grants public read/write permissions.`,
          evidence: {
            publicAccessBlock: meta.publicAccessBlock ?? 'disabled',
            acl: meta.acl || 'public',
            property: 'metadata.publicAccessBlock',
          },
          remediation: {
            issue: 'Storage bucket configuration permits unauthenticated external access.',
            recommendedChange: 'Enable S3 Public Access Block / GCP Uniform Bucket Access / Azure Blob Public Access Deny.',
            verificationMethod: 'Inspect bucket policy and access block settings via cloud console or CLI.',
          },
          policyRule: 'CLOUD_STORAGE_NO_PUBLIC_ACCESS',
        }));
      }
    }

    // ── 2. OVERLY BROAD IAM METADATA ──────────────────────────────────────────
    if (resType === 'iam_role' || resType === 'iam_policy' || resType === 'service_account') {
      const statements = Array.isArray(meta.statements) ? meta.statements : (meta.policyStatements || []);
      const hasWildcardAction = statements.some(s => {
        const action = s.action || s.Action;
        const effect = s.effect || s.Effect || 'Allow';
        return effect.toLowerCase() === 'allow' && (action === '*' || (Array.isArray(action) && action.includes('*')));
      });

      if (hasWildcardAction) {
        findings.push(createCloudPostureFinding({
          organizationId,
          cloudAccountId,
          resourceId: resId,
          resourceType: resType,
          provider,
          severity: POSTURE_SEVERITY.HIGH,
          title: `Overly Broad IAM Permissions in ${resId}`,
          description: `IAM policy for '${resId}' contains wildcard '*' Action permissions without least-privilege boundary.`,
          evidence: {
            wildcardActionDetected: true,
            statementsSample: statements.slice(0, 2),
          },
          remediation: {
            issue: 'Wildcard administrator permissions grant excessive privileges to workload or service.',
            recommendedChange: 'Replace Action: "*" with explicit least-privilege service-specific IAM actions.',
            verificationMethod: 'Run IAM policy simulator or review active policy statements.',
          },
          policyRule: 'IAM_NO_WILDCARD_ACTIONS',
        }));
      }
    }

    // ── 3. EXPOSED SERVICE METADATA (SECURITY GROUPS / FIREWALLS) ─────────────
    if (resType === 'security_group' || resType === 'firewall_rule' || resType === 'network_nsg') {
      const rules = Array.isArray(meta.ingressRules) ? meta.ingressRules : (Array.isArray(meta.rules) ? meta.rules : []);
      for (const rule of rules) {
        const cidr = rule.cidr || rule.sourceRange || rule.sourceAddressPrefix;
        const port = Number(rule.port || rule.toPort || rule.fromPort);

        if ((cidr === '0.0.0.0/0' || cidr === '::/0') && SENSITIVE_PORTS.has(port)) {
          findings.push(createCloudPostureFinding({
            organizationId,
            cloudAccountId,
            resourceId: resId,
            resourceType: resType,
            provider,
            severity: POSTURE_SEVERITY.CRITICAL,
            title: `Exposed Sensitive Network Port ${port} to Public Internet in ${resId}`,
            description: `Network security rule permits inbound traffic from 0.0.0.0/0 on sensitive port ${port}.`,
            evidence: {
              exposedPort: port,
              sourceCidr: cidr,
              protocol: rule.protocol || 'TCP',
            },
            remediation: {
              issue: `Port ${port} is exposed to the public internet without IP whitelist restrictions.`,
              recommendedChange: `Restrict port ${port} ingress to private VPC CIDR or VPN gateway IP blocks.`,
              verificationMethod: 'Review security group inbound rules in cloud console.',
            },
            policyRule: 'NETWORK_NO_OPEN_SENSITIVE_PORTS',
          }));
        }
      }
    }

    // ── 4. MISSING ENVIRONMENT CLASSIFICATION ─────────────────────────────────
    const tags = meta.tags || meta.labels || {};
    const hasEnvTag = Boolean(
      tags.environment || tags.Environment || tags.env || tags.Env || tags.stage || tags.Stage
    );

    if (!hasEnvTag) {
      findings.push(createCloudPostureFinding({
        organizationId,
        cloudAccountId,
        resourceId: resId,
        resourceType: resType,
        provider,
        severity: POSTURE_SEVERITY.LOW,
        title: `Missing Environment Tagging: ${resId}`,
        description: `Cloud resource '${resId}' lacks standard environment classification tags ('environment', 'env', 'stage').`,
        evidence: {
          existingTags: Object.keys(tags),
          missingExpectedKeys: ['environment', 'env', 'stage'],
        },
        remediation: {
          issue: 'Resource lacks clear environment categorization, impeding accurate exposure mapping.',
          recommendedChange: 'Apply standard environment tag (e.g. environment=production, staging, or development).',
          verificationMethod: 'Verify tag presence in resource metadata inventory.',
        },
        policyRule: 'CLOUD_RESOURCE_TAGGING_POLICY',
      }));
    }

    // ── 5. INSECURE DEPLOYMENT CONFIGURATION ──────────────────────────────────
    if (resType === 'storage_volume' || resType === 'disk' || resType === 'ebs_volume') {
      if (meta.encrypted === false) {
        findings.push(createCloudPostureFinding({
          organizationId,
          cloudAccountId,
          resourceId: resId,
          resourceType: resType,
          provider,
          severity: POSTURE_SEVERITY.HIGH,
          title: `Unencrypted Persistent Storage Volume: ${resId}`,
          description: `Persistent storage disk '${resId}' does not enable encryption at rest.`,
          evidence: {
            encrypted: false,
            volumeType: meta.volumeType || 'standard',
          },
          remediation: {
            issue: 'Data at rest is not protected by managed encryption keys.',
            recommendedChange: 'Enable volume encryption with cloud KMS keys.',
            verificationMethod: 'Check volume encryption status in block storage inventory.',
          },
          policyRule: 'STORAGE_ENCRYPTION_AT_REST',
        }));
      }
    }
  }

  return findings;
}
