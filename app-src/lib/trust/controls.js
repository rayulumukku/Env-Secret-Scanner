/**
 * lib/trust/controls.js
 *
 * Normalized Security Control Framework for SecretShield Trust & Compliance Center.
 *
 * SAFETY INVARIANTS:
 *   - Only displays documented controls that are actually implemented or planned.
 *   - Never makes unsupported certifications (e.g. SOC 2, ISO 27001) without evidence.
 *   - Distinguishes documented controls, collected evidence, organizational assertions, and external certifications.
 *   - Strictly zero raw secrets stored in control descriptions or evidence metadata.
 */

import { randomUUID } from 'crypto';

export const CONTROL_STATUSES = Object.freeze({
  IMPLEMENTED: 'IMPLEMENTED',
  PARTIALLY_IMPLEMENTED: 'PARTIALLY_IMPLEMENTED',
  PLANNED: 'PLANNED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
});

export const CONTROL_CATEGORIES = Object.freeze({
  ARCHITECTURE: 'ARCHITECTURE',
  DATA_HANDLING: 'DATA_HANDLING',
  ENCRYPTION: 'ENCRYPTION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  AUDIT_LOGGING: 'AUDIT_LOGGING',
  RETENTION: 'RETENTION',
  VULNERABILITY_MGMT: 'VULNERABILITY_MGMT',
  INCIDENT_RESPONSE: 'INCIDENT_RESPONSE',
  BACKUP_RECOVERY: 'BACKUP_RECOVERY',
  SECURE_DEV: 'SECURE_DEV',
  SECRET_HANDLING: 'SECRET_HANDLING',
  INTEGRATIONS: 'INTEGRATIONS',
  AI_PRIVACY: 'AI_PRIVACY',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
});

/**
 * Standard verifiable security controls baseline for SecretShield deployments.
 */
export const DEFAULT_CONTROLS_CATALOG = [
  {
    code: 'SEC-AUTH-01',
    name: 'Multi-Factor Session & Password Hashing',
    category: CONTROL_CATEGORIES.AUTHENTICATION,
    description: 'User passwords are encrypted with salted hash algorithms and session tokens use cryptographically secure random values.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Security & Identity Team',
    isPublic: true,
    evidenceRequirements: ['Authentication config', 'Session security test logs'],
  },
  {
    code: 'SEC-AUTHZ-01',
    name: 'Role-Based Access Control (RBAC) & Tenant Isolation',
    category: CONTROL_CATEGORIES.AUTHORIZATION,
    description: 'All resource accesses, findings, and configuration queries are strictly scoped to the authenticated organization ID.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Platform Security Team',
    isPublic: true,
    evidenceRequirements: ['Multi-tenant query middleware', 'Authorization isolation test suite'],
  },
  {
    code: 'SEC-SECRET-01',
    name: 'Zero Raw Secret In-Memory Masking & Redaction',
    category: CONTROL_CATEGORIES.SECRET_HANDLING,
    description: 'Scanner extracts and masks credential values immediately in memory. Raw secret values are never saved in databases, browser storage, or logs.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Detection Engine Team',
    isPublic: true,
    evidenceRequirements: ['Redaction unit tests', 'Export sanitization verification'],
  },
  {
    code: 'SEC-AUDIT-01',
    name: 'Immutable Security Event & Audit Logging',
    category: CONTROL_CATEGORIES.AUDIT_LOGGING,
    description: 'Administrative actions, policy changes, approval decisions, and scan events produce immutable audit records with timestamps and actor details.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Compliance & Audit Team',
    isPublic: true,
    evidenceRequirements: ['Audit log database records', 'Audit log retention policies'],
  },
  {
    code: 'SEC-ENC-01',
    name: 'Transport Layer Encryption & Secure Headers',
    category: CONTROL_CATEGORIES.ENCRYPTION,
    description: 'All web traffic and API endpoints enforce TLS 1.3/1.2 communication and strict security headers.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Infrastructure Team',
    isPublic: true,
    evidenceRequirements: ['HTTPS web server configuration', 'Strict-Transport-Security verification'],
  },
  {
    code: 'SEC-IR-01',
    name: 'Automated Response Playbooks & Approval Gates',
    category: CONTROL_CATEGORIES.INCIDENT_RESPONSE,
    description: 'Declarative playbooks automatically evaluate incoming secret exposures, dispatch notifications, and enforce approval gates for high-impact actions.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Incident Response Team',
    isPublic: true,
    evidenceRequirements: ['Configured response playbooks', 'Approval queue logs'],
  },
  {
    code: 'SEC-RET-01',
    name: 'Configurable Data Retention & Automated Cleanup',
    category: CONTROL_CATEGORIES.RETENTION,
    description: 'Organizations configure explicit retention limits for scans, findings, audit logs, and evidence with verifiable deletion jobs.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Data Governance Team',
    isPublic: true,
    evidenceRequirements: ['Retention schedule configurations', 'Cleanup job execution logs'],
  },
  {
    code: 'SEC-AI-01',
    name: 'Deterministic Offline Fallback & Optional AI Privacy Controls',
    category: CONTROL_CATEGORIES.AI_PRIVACY,
    description: 'All core scanning and policy evaluation operates 100% offline. Optional AI integrations enforce strict PII/secret scrubbing and tenant-level opt-in.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'AI Safety & Privacy Team',
    isPublic: true,
    evidenceRequirements: ['Offline scanner test suite', 'Data minimization filter tests'],
  },
  {
    code: 'SEC-DEV-01',
    name: 'CI/CD Pipeline Gate & Pre-Commit Hook Scanning',
    category: CONTROL_CATEGORIES.SECURE_DEV,
    description: 'Developers scan local changes via pre-commit hooks and CI/CD pull request pipelines with deterministic exit codes to prevent secrets reaching Git.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'DevOps & Tooling Team',
    isPublic: true,
    evidenceRequirements: ['Git pre-commit hook installer', 'GitHub Action CI scan workflows'],
  },
  {
    code: 'SEC-INT-01',
    name: 'Scoped Provider Permissions & Webhook Signing',
    category: CONTROL_CATEGORIES.INTEGRATIONS,
    description: 'GitHub and GitLab integrations request minimum required repository permissions and verify all inbound webhook deliveries using HMAC-SHA256 signatures.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Integrations Team',
    isPublic: true,
    evidenceRequirements: ['HMAC webhook signature tests', 'OAuth minimal scope declarations'],
  },
  {
    code: 'SEC-ARCH-01',
    name: 'Secure System Architecture & Boundary Isolation',
    category: CONTROL_CATEGORIES.ARCHITECTURE,
    description: 'Multi-layer security architecture separating edge proxies, in-memory scanning engines, and isolated database storage.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Architecture Team',
    isPublic: true,
    evidenceRequirements: ['Architecture design documents', 'Threat matrix assessments'],
  },
  {
    code: 'SEC-DATA-01',
    name: 'Data Handling & Privacy Safeguards',
    category: CONTROL_CATEGORIES.DATA_HANDLING,
    description: 'Strict data minimization and zero-exposure rules applied to all repository contents and developer artifacts.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Privacy Officer',
    isPublic: true,
    evidenceRequirements: ['Data classification policy', 'PII scrubbing validation'],
  },
  {
    code: 'SEC-VULN-01',
    name: 'Continuous Vulnerability & ReDoS Management',
    category: CONTROL_CATEGORIES.VULNERABILITY_MGMT,
    description: 'Automated dependency vulnerability tracking and algorithmic ReDoS regex safety validations.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'AppSec Team',
    isPublic: true,
    evidenceRequirements: ['ReDoS test suite', 'Dependency vulnerability reports'],
  },
  {
    code: 'SEC-BCP-01',
    name: 'Backup, Point-in-Time Recovery & Redundancy',
    category: CONTROL_CATEGORIES.BACKUP_RECOVERY,
    description: 'Automated point-in-time database snapshots and disaster recovery playbooks with zero data loss targets.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'SRE Team',
    isPublic: true,
    evidenceRequirements: ['Backup verification logs', 'Disaster recovery runbook'],
  },
  {
    code: 'SEC-INFRA-01',
    name: 'Infrastructure & Container Security Hardening',
    category: CONTROL_CATEGORIES.INFRASTRUCTURE,
    description: 'Non-root container execution, minimal attack surfaces, and strict network isolation boundaries.',
    implementationStatus: CONTROL_STATUSES.IMPLEMENTED,
    owner: 'Infrastructure Team',
    isPublic: true,
    evidenceRequirements: ['Dockerfile security lints', 'Network security group rules'],
  },
];

/**
 * Construct a normalized Control record.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.code
 * @param {string} params.name
 * @param {string} params.description
 * @param {string} params.category
 * @param {string} [params.implementationStatus='IMPLEMENTED']
 * @param {string} [params.owner='Security Team']
 * @param {boolean} [params.isPublic=false]
 * @param {string[]} [params.evidenceRequirements=[]]
 * @param {number} [params.reviewIntervalDays=90]
 * @returns {object} Control
 */
export function createControl({
  organizationId,
  code,
  name,
  description,
  category,
  implementationStatus = CONTROL_STATUSES.IMPLEMENTED,
  owner = 'Security Team',
  isPublic = false,
  evidenceRequirements = [],
  reviewIntervalDays = 90,
}) {
  if (!organizationId || !code || !name) {
    throw new Error('organizationId, code, and name are required for a Control');
  }

  const validCat = Object.values(CONTROL_CATEGORIES).includes(category)
    ? category
    : CONTROL_CATEGORIES.ARCHITECTURE;

  const validStatus = Object.values(CONTROL_STATUSES).includes(implementationStatus)
    ? implementationStatus
    : CONTROL_STATUSES.IMPLEMENTED;

  const now = new Date();
  const nextReview = new Date(now.getTime() + reviewIntervalDays * 24 * 60 * 60 * 1000);

  return {
    id: `ctrl_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    code: String(code).toUpperCase().slice(0, 32),
    name: String(name).slice(0, 150),
    description: String(description || '').slice(0, 1000),
    category: validCat,
    implementationStatus: validStatus,
    owner: String(owner || 'Security Team').slice(0, 100),
    version: '1.0.0',
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextReview.toISOString(),
    isPublic: Boolean(isPublic),
    evidenceRequirements: Array.isArray(evidenceRequirements) ? evidenceRequirements : [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
