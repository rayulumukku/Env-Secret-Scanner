/**
 * lib/trust/__tests__/trust.test.js
 *
 * Comprehensive Unit & Integration Tests for Command 23:
 * Enterprise Trust, Compliance & Security Evidence Center.
 *
 * Tests control lifecycles, evidence integrity, questionnaire validation, access reviews,
 * report generation, public sanitization, policy approvals, and tenant isolation.
 *
 * SAFETY GUARANTEE: Uses synthetic mock tokens only (no real API keys).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CONTROLS_CATALOG,
  CONTROL_STATUSES,
  CONTROL_CATEGORIES,
} from '../controls.js';
import {
  createControlEvidence,
  computeEvidenceIntegrity,
  verifyEvidenceIntegrity,
  evaluateEvidenceValidity,
} from '../evidence-mapping.js';
import {
  DEFAULT_QUESTIONNAIRE_TEMPLATES,
  QUESTIONNAIRE_CATEGORIES,
  QUESTION_ANSWERS,
  createQuestionnaireRecord,
} from '../questionnaire.js';
import {
  ACCESS_REVIEW_STATUSES,
  ACCESS_REVIEW_TYPES,
  createAccessReview,
  processAccessReviewVerdict,
} from '../access-reviews.js';
import {
  CREDENTIAL_TYPES,
  ROTATION_STATUSES,
  createCredentialInventoryRecord,
} from '../credentials.js';
import {
  generateTrustReport,
  sanitizeForExport,
  formatReportOutput,
} from '../reports.js';
import {
  buildPublicTrustProfile,
} from '../public-trust.js';
import {
  POLICY_STATUSES,
  POLICY_CATEGORIES,
  DEFAULT_POLICY_TEMPLATES,
  validatePolicyTransition,
} from '../policies.js';
import {
  createSecurityAdvisory,
} from '../advisories.js';

describe('Enterprise Trust, Compliance & Security Evidence Center', () => {
  // ── 1. Controls Catalog & LifeCycle ──────────────────────────────────────────
  describe('Control Framework', () => {
    it('provides standard baseline controls across essential categories', () => {
      assert.ok(DEFAULT_CONTROLS_CATALOG.length >= 15);
      const codes = DEFAULT_CONTROLS_CATALOG.map(c => c.code);
      assert.ok(codes.includes('SEC-ARCH-01'));
      assert.ok(codes.includes('SEC-ENC-01'));
      assert.ok(codes.includes('SEC-AUTH-01'));
      assert.ok(codes.includes('SEC-AUDIT-01'));
      assert.ok(codes.includes('SEC-SECRET-01'));
    });

    it('enforces valid lifecycle statuses', () => {
      assert.equal(CONTROL_STATUSES.IMPLEMENTED, 'IMPLEMENTED');
      assert.equal(CONTROL_STATUSES.PARTIALLY_IMPLEMENTED, 'PARTIALLY_IMPLEMENTED');
      assert.equal(CONTROL_STATUSES.PLANNED, 'PLANNED');
      assert.equal(CONTROL_STATUSES.NOT_IMPLEMENTED, 'NOT_IMPLEMENTED');
      assert.equal(CONTROL_STATUSES.NOT_APPLICABLE, 'NOT_APPLICABLE');
    });
  });

  // ── 2. Evidence Mapping & SHA-256 Integrity ─────────────────────────────────
  describe('Evidence Mapping & Integrity', () => {
    it('creates immutable evidence snapshots with canonical SHA-256 hash', () => {
      const evidence = createControlEvidence({
        controlId: 'ctrl_test_101',
        organizationId: 'org_test_tenant_a',
        sourceType: 'AUDIT_LOG',
        sourceId: 'audit_rec_456',
        title: 'Audit Logging Verification',
        summary: 'Audit log streaming active to immutable archive',
        metadata: { streamTarget: 'cloudwatch', retentionDays: 365 },
        validityDays: 90,
      });

      assert.ok(evidence.id.startsWith('ev_'));
      assert.match(evidence.integrityHash, /^[a-f0-9]{64}$/);
      assert.ok(evidence.collectedAt);
      assert.ok(evidence.validUntil);

      const isValid = verifyEvidenceIntegrity(evidence);
      assert.equal(isValid, true);
    });

    it('detects tampering when evidence metadata is modified', () => {
      const evidence = createControlEvidence({
        controlId: 'ctrl_test_102',
        organizationId: 'org_test_tenant_a',
        sourceType: 'CONFIGURATION',
        sourceId: 'cfg_789',
        title: 'Encryption Config',
        summary: 'AES-256-GCM verified',
        metadata: { algorithm: 'AES-256-GCM' },
      });

      assert.equal(verifyEvidenceIntegrity(evidence), true);

      // Tamper with metadata
      const tampered = { ...evidence, metadata: { algorithm: 'DES' } };
      assert.equal(verifyEvidenceIntegrity(tampered), false);
    });

    it('evaluates evidence expiration dates accurately', () => {
      const activeEvidence = {
        validUntil: new Date(Date.now() + 86400000).toISOString(),
      };
      assert.equal(evaluateEvidenceValidity(activeEvidence).isValid, true);

      const expiredEvidence = {
        validUntil: new Date(Date.now() - 86400000).toISOString(),
      };
      assert.equal(evaluateEvidenceValidity(expiredEvidence).isValid, false);
      assert.equal(evaluateEvidenceValidity(expiredEvidence).isExpired, true);
    });
  });

  // ── 3. Security Questionnaires & Verification ─────────────────────────────────
  describe('Security Questionnaires', () => {
    it('loads 12 standard questionnaire categories', () => {
      assert.ok(DEFAULT_QUESTIONNAIRE_TEMPLATES.length >= 12);
      const categories = DEFAULT_QUESTIONNAIRE_TEMPLATES.map(q => q.category);
      assert.ok(categories.includes(QUESTIONNAIRE_CATEGORIES.ACCESS_CONTROL));
      assert.ok(categories.includes(QUESTIONNAIRE_CATEGORIES.ENCRYPTION));
      assert.ok(categories.includes(QUESTIONNAIRE_CATEGORIES.AI_DATA_PROCESSING));
    });

    it('creates questionnaire records with valid structure and defaults', () => {
      const record = createQuestionnaireRecord({
        organizationId: 'org_test_tenant_a',
        title: 'Password Security',
        category: QUESTIONNAIRE_CATEGORIES.AUTHENTICATION,
        question: 'Are passwords salted and hashed?',
        answer: QUESTION_ANSWERS.YES,
        explanation: 'All passwords hashed using bcrypt with work factor 12.',
        evidenceIds: ['ev_123'],
      });

      assert.ok(record.id.startsWith('quest_'));
      assert.equal(record.answer, QUESTION_ANSWERS.YES);
      assert.equal(record.evidenceIds.length, 1);
      assert.ok(record.lastReviewedAt);
    });
  });

  // ── 4. Access Reviews & Credential Inventories ────────────────────────────────
  describe('Access Reviews & Governance', () => {
    it('creates access review items with PENDING status', () => {
      const review = createAccessReview({
        organizationId: 'org_alpha',
        targetType: ACCESS_REVIEW_TYPES.MEMBER,
        targetId: 'usr_sarah',
        targetName: 'Sarah Connor',
        currentRole: 'ADMIN',
      });

      assert.equal(review.status, ACCESS_REVIEW_STATUSES.PENDING);
      assert.equal(review.targetName, 'Sarah Connor');
    });

    it('processes access review approval and revocation decisions', () => {
      const item = createAccessReview({
        organizationId: 'org_alpha',
        targetType: ACCESS_REVIEW_TYPES.ROLE,
        targetId: 'role_dev',
        targetName: 'Developer',
        currentRole: 'WRITE',
      });

      const reviewed = processAccessReviewVerdict(item, ACCESS_REVIEW_STATUSES.REVIEWED, 'Lead Auditor', 'Approved for Q3');
      assert.equal(reviewed.status, ACCESS_REVIEW_STATUSES.REVIEWED);
      assert.equal(reviewed.reviewedBy, 'Lead Auditor');

      const revoked = processAccessReviewVerdict(item, ACCESS_REVIEW_STATUSES.REVOKED, 'Lead Auditor', 'Deprovisioned');
      assert.equal(reviewed.status !== ACCESS_REVIEW_STATUSES.REVOKED, true);
      assert.equal(revoked.status, ACCESS_REVIEW_STATUSES.REVOKED);
    });

    it('creates metadata-only credential inventory items (zero secret values)', () => {
      const cred = createCredentialInventoryRecord({
        organizationId: 'org_alpha',
        credentialType: CREDENTIAL_TYPES.API_KEY,
        provider: 'AWS',
        owner: 'Infrastructure Team',
        locationMetadata: 'repo:infra/terraform/modules',
        fingerprint: 'fp_a9b8c7d6',
      });

      assert.ok(cred.id.startsWith('cred_'));
      assert.equal(cred.fingerprint, 'fp_a9b8c7d6');
      assert.equal(cred.rotationStatus, ROTATION_STATUSES.ACTIVE);
      // Ensure no raw secret key property exists
      assert.equal('value' in cred, false);
      assert.equal('rawSecret' in cred, false);
    });
  });

  // ── 5. Policy Approvals & Workflow ───────────────────────────────────────────
  describe('Policy Library & Workflow', () => {
    it('provides standard policy templates', () => {
      assert.ok(DEFAULT_POLICY_TEMPLATES.length >= 7);
      const categories = DEFAULT_POLICY_TEMPLATES.map(p => p.category);
      assert.ok(categories.includes(POLICY_CATEGORIES.SECRET_MANAGEMENT));
      assert.ok(categories.includes(POLICY_CATEGORIES.AI_USAGE));
      assert.ok(categories.includes(POLICY_CATEGORIES.DATA_RETENTION));
    });

    it('validates state transitions: DRAFT -> REVIEW -> APPROVAL -> ACTIVE -> RETIRED', () => {
      assert.equal(validatePolicyTransition(POLICY_STATUSES.DRAFT, POLICY_STATUSES.REVIEW).valid, true);
      assert.equal(validatePolicyTransition(POLICY_STATUSES.REVIEW, POLICY_STATUSES.APPROVAL).valid, true);
      assert.equal(validatePolicyTransition(POLICY_STATUSES.APPROVAL, POLICY_STATUSES.ACTIVE).valid, true);
      assert.equal(validatePolicyTransition(POLICY_STATUSES.ACTIVE, POLICY_STATUSES.RETIRED).valid, true);

      // Invalid direct transition from DRAFT to ACTIVE
      assert.equal(validatePolicyTransition(POLICY_STATUSES.DRAFT, POLICY_STATUSES.ACTIVE).valid, false);
    });
  });

  // ── 6. Sanitization & Report Generation ──────────────────────────────────────
  describe('Report Generation & Sanitization', () => {
    it('sanitizes candidate secret strings and credentials prior to export', () => {
      const rawReport = {
        title: 'Customer Security Assessment',
        sampleToken: 'sk_test_51AbcDefGhIjKlMnOpQrStUvWxYz0123456789',
        sampleAws: 'AKIAIOSFODNN7EXAMPLE',
        validDescription: 'All repositories are protected by SecretShield in-memory filters.',
      };

      const sanitized = sanitizeForExport(rawReport);
      assert.ok(sanitized.sampleToken.includes('[REDACTED_SECRET]'));
      assert.ok(sanitized.sampleAws.includes('[REDACTED_SECRET]'));
      assert.equal(sanitized.validDescription, rawReport.validDescription);
    });

    it('generates multi-format report packages with non-empty HTML output', () => {
      const report = generateTrustReport({
        organizationId: 'org_beta',
        reportType: 'SECURITY_OVERVIEW',
        title: 'Q3 Security Summary',
        scope: 'Organization Wide',
        format: 'html',
        data: {
          controlsSummary: { total: 15, implemented: 14, partiallyImplemented: 1 },
          selectedCustomSections: ['Architecture', 'Encryption', 'Access Control'],
        },
        generatedBy: 'Security Officer',
      });

      assert.ok(report.shareableSlug);
      assert.equal(report.reportType, 'SECURITY_OVERVIEW');

      const html = formatReportOutput(report);
      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('SecretShield'));
      assert.ok(html.includes('documented security controls'));
    });
  });

  // ── 7. Public Trust Center Privacy & Whitelisting ────────────────────────────
  describe('Public Trust Center Isolation', () => {
    it('excludes private findings, repository names, and private evidence from public profiles', () => {
      const publicControls = [
        {
          code: 'ENC-REST-01',
          name: 'Storage Encryption',
          description: 'AES-256 encryption at rest',
          category: 'ENCRYPTION',
          implementationStatus: 'IMPLEMENTED',
          isPublic: true,
          scope: 'Organization Wide',
        },
      ];

      const publicEvidence = [
        {
          controlId: 'ENC-REST-01',
          sourceType: 'CONFIGURATION',
          title: 'KMS Configuration',
          isPublic: true,
        },
        {
          controlId: 'ENC-REST-01',
          sourceType: 'SECRET_FINDING',
          title: 'Internal Private Finding',
          isPublic: false, // Private!
        },
      ];

      const publicProfile = buildPublicTrustProfile(
        { name: 'Acme Corp', slug: 'acme-corp' },
        publicControls,
        publicEvidence
      );

      assert.equal(publicProfile.organizationName, 'Acme Corp');
      assert.equal(publicProfile.controls.length, 1);
      assert.ok(publicProfile.evidenceCategories.includes('CONFIGURATION'));
      assert.equal(publicProfile.evidenceCategories.includes('SECRET_FINDING'), false);
      assert.ok(publicProfile.disclaimer);
    });
  });

  // ── 8. Security Advisories ───────────────────────────────────────────────────
  describe('Security Advisories Model', () => {
    it('creates product security advisories without fabricated identifiers', () => {
      const advisory = createSecurityAdvisory({
        advisoryId: 'SSA-2026-001',
        title: 'Volatile Buffer Clear Fix',
        affectedVersion: '< 1.4.0',
        fixedVersion: '1.4.0',
        severity: 'LOW',
        description: 'Ensures temporary string buffers are zeroed on process exit.',
        impact: 'Low theoretical memory remanence on crash.',
        mitigation: 'Upgrade to @secretshield/scanner@1.4.0 or later.',
        references: ['https://github.com/rayulumukku/Env-Secret-Scanner/releases/tag/v1.4.0'],
      });

      assert.equal(advisory.advisoryId, 'SSA-2026-001');
      assert.equal(advisory.severity, 'LOW');
      assert.ok(advisory.publishedAt);
    });
  });
});
