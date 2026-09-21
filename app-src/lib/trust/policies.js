/**
 * lib/trust/policies.js
 *
 * Security Policy Library & Approval Workflow Engine.
 * Provides editable organization policy templates, versioning, and auditable
 * lifecycle workflow: DRAFT -> REVIEW -> APPROVAL -> ACTIVE -> RETIRED.
 *
 * NOTE: Organization policies are informational technical baselines, not legal advice.
 */

import { randomUUID } from 'crypto';

export const POLICY_STATUSES = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVAL: 'APPROVAL',
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
};

export const POLICY_CATEGORIES = {
  SECRET_MANAGEMENT: 'SECRET_MANAGEMENT',
  ACCESS_CONTROL: 'ACCESS_CONTROL',
  INCIDENT_RESPONSE: 'INCIDENT_RESPONSE',
  SECURE_DEVELOPMENT: 'SECURE_DEVELOPMENT',
  DATA_RETENTION: 'DATA_RETENTION',
  AI_USAGE: 'AI_USAGE',
  THIRD_PARTY_INTEGRATION: 'THIRD_PARTY_INTEGRATION',
};

export const DEFAULT_POLICY_TEMPLATES = [
  {
    category: POLICY_CATEGORIES.SECRET_MANAGEMENT,
    title: 'Secret Management & Credential Protection Policy',
    summary: 'Rules and requirements for generating, storing, scanning, rotating, and revoking API keys, tokens, and cryptographic keys.',
    content: `## 1. Purpose & Scope
This policy governs the handling of all secrets, API tokens, cryptographic credentials, and access keys across all repositories, CI/CD pipelines, and cloud environments within the organization.

## 2. Hardcoding Prohibition
No raw secrets, cleartext API keys, passwords, or private keys shall be committed into version control repositories under any circumstances. All developers must utilize local pre-commit scanning hooks and designated environment managers.

## 3. Secret Rotation & Remediation
When a credential is detected in source code or pull request diffs:
1. The credential must be revoked in the upstream provider immediately.
2. A new rotated credential must be provisioned.
3. The exposure incident must be verified via the SecretShield Remediation Center.

## 4. Periodic Review
This policy is reviewed annually or following any critical exposure incident.`,
    owner: 'Security Lead',
    version: '1.0.0',
    status: POLICY_STATUSES.ACTIVE,
  },
  {
    category: POLICY_CATEGORIES.ACCESS_CONTROL,
    title: 'Access Control & Authentication Policy',
    summary: 'Guidelines for least-privilege role assignments, multi-factor authentication, and quarterly access reviews.',
    content: `## 1. Principle of Least Privilege
Access to organization resources, repositories, and scanner configurations is granted strictly based on role requirements (Owner, Admin, Member, Read-Only).

## 2. Multi-Factor Authentication
MFA is mandatory for all members with administrative or write permissions to source code repositories.

## 3. Periodic Access Governance
Access reviews must be conducted at least every 90 days. Inactive accounts or revoked role authorizations must be offboarded within 24 hours.`,
    owner: 'IT Governance',
    version: '1.0.0',
    status: POLICY_STATUSES.ACTIVE,
  },
  {
    category: POLICY_CATEGORIES.INCIDENT_RESPONSE,
    title: 'Security Incident Response & Evidence Preservation Policy',
    summary: 'Standard operating procedures for detecting, triaging, containing, remediating, and documenting security incidents.',
    content: `## 1. Incident Classification
Incidents are triaged into P0 (Immediate Critical Exposure), P1 (High Risk Secret Leaked), and P2 (Internal Token Exposed).

## 2. Response Timeline
- P0: Immediate containment and key revocation within 1 hour.
- P1: Rotation and audit log analysis within 4 hours.
- P2: Remediation within 24 hours.

## 3. Evidence Preservation
All scan results, commit metadata, and rotation verification hashes must be preserved without altering historical records. Raw secret values are strictly prohibited from being archived.`,
    owner: 'SecOps Team',
    version: '1.0.0',
    status: POLICY_STATUSES.ACTIVE,
  },
  {
    category: POLICY_CATEGORIES.SECURE_DEVELOPMENT,
    title: 'Secure Development & Code Review Policy',
    summary: 'Mandatory pre-commit scanning, branch protection rules, and automated CI/CD secret detection gates.',
    content: `## 1. Branch Protection
Main and release branches must require passing CI security checks before pull requests can be merged.

## 2. Pre-Commit Hooks
Developers are required to enable SecretShield pre-commit hooks to catch secrets locally before commit objects are written.

## 3. Dependency & Integration Reviews
All external dependencies and API integrations must be evaluated for security posture prior to production deployment.`,
    owner: 'VP of Engineering',
    version: '1.0.0',
    status: POLICY_STATUSES.ACTIVE,
  },
  {
    category: POLICY_CATEGORIES.DATA_RETENTION,
    title: 'Data Retention & Secure Cleanup Policy',
    summary: 'Retention windows and automated deletion schedules for findings, audit logs, scan results, and AI assistant history.',
    content: `## 1. Retention Windows
- Scan Runs & Raw Diffs: 90 days
- Remediation Audit Records: 365 days
- System Audit Logs: 365 days
- Assistant History & Ephemeral Sessions: 30 days

## 2. Verification of Deletion
Automated cleanup jobs run nightly. No record shall be claimed as deleted until the cleanup job confirms execution.`,
    owner: 'Compliance Officer',
    version: '1.0.0',
    status: POLICY_STATUSES.ACTIVE,
  },
  {
    category: POLICY_CATEGORIES.AI_USAGE,
    title: 'AI Usage & Code Privacy Policy',
    summary: 'Strict boundaries on AI assistance, data minimization, deterministic local fallbacks, and zero third-party code transmission.',
    content: `## 1. Optional Nature of AI
AI assistance in SecretShield is strictly optional and configurable per organization. Core secret scanning is 100% deterministic and runs without AI.

## 2. Secret Redaction Before AI
When AI triage assistance is enabled, all code snippets must be stripped and masked of credentials before any API call.

## 3. No Training on Proprietary Code
No organization source code or findings shall be utilized for training external AI models.`,
    owner: 'Chief Privacy Officer',
    version: '1.0.0',
    status: POLICY_STATUSES.ACTIVE,
  },
  {
    category: POLICY_CATEGORIES.THIRD_PARTY_INTEGRATION,
    title: 'Third-Party Integration & Webhook Security Policy',
    summary: 'Requirements for connecting external tools, scope least-privilege, webhook signature verification, and credential handling.',
    content: `## 1. Scoped Permissions
Integrations (GitHub Apps, GitLab CI, Slack, Webhooks) must request only the minimal permissions required for operation.

## 2. Webhook Signature Verification
All incoming webhooks must be verified using HMAC-SHA256 signatures before processing payloads.

## 3. Integration Auditing
Administrators must conduct quarterly reviews of all connected third-party integrations and disconnect unused connectors.`,
    owner: 'Security Lead',
    version: '1.0.0',
    status: POLICY_STATUSES.ACTIVE,
  },
];

/**
 * Validates a policy workflow transition.
 */
export function validatePolicyTransition(currentStatus, targetStatus) {
  const allowedTransitions = {
    [POLICY_STATUSES.DRAFT]: [POLICY_STATUSES.REVIEW, POLICY_STATUSES.RETIRED],
    [POLICY_STATUSES.REVIEW]: [POLICY_STATUSES.APPROVAL, POLICY_STATUSES.DRAFT, POLICY_STATUSES.RETIRED],
    [POLICY_STATUSES.APPROVAL]: [POLICY_STATUSES.ACTIVE, POLICY_STATUSES.REVIEW, POLICY_STATUSES.DRAFT],
    [POLICY_STATUSES.ACTIVE]: [POLICY_STATUSES.REVIEW, POLICY_STATUSES.RETIRED],
    [POLICY_STATUSES.RETIRED]: [POLICY_STATUSES.DRAFT],
  };

  const valid = (allowedTransitions[currentStatus] || []).includes(targetStatus);
  return {
    valid,
    message: valid
      ? `Transition from ${currentStatus} to ${targetStatus} is valid.`
      : `Cannot transition policy from ${currentStatus} to ${targetStatus}. Allowed: ${(allowedTransitions[currentStatus] || []).join(', ')}`,
  };
}
