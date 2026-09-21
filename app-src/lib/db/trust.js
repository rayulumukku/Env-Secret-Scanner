/**
 * lib/db/trust.js
 *
 * Database persistence layer for Enterprise Trust, Compliance & Evidence Center.
 * Supports PostgreSQL via Prisma and high-performance in-memory fallback.
 */

import { getDb, memoryDb } from './client.js';
import { DEFAULT_CONTROLS_CATALOG } from '../trust/controls.js';
import { DEFAULT_QUESTIONNAIRE_TEMPLATES } from '../trust/questionnaire.js';
import { DEFAULT_SECURITY_ADVISORIES } from '../trust/advisories.js';
import { DEFAULT_POLICY_TEMPLATES } from '../trust/policies.js';
import { randomUUID } from 'crypto';

// ── CONTROLS ─────────────────────────────────────────────────────────────────

export async function listControlsDb({ organizationId, category = null, status = null, isPublic = null }) {
  const { isPostgres, client } = await getDb();

  if (isPostgres) {
    const where = {};
    if (organizationId) where.organizationId = organizationId;
    if (category) where.category = category;
    if (status) where.implementationStatus = status;
    if (isPublic !== null) where.isPublic = isPublic;

    const controls = await client.control.findMany({
      where,
      include: { evidence: true, requirements: true },
      orderBy: { code: 'asc' },
    });

    return controls.map(c => ({
      ...c,
      evidenceRequirements: c.evidenceRequirementsJson ? JSON.parse(c.evidenceRequirementsJson) : [],
    }));
  }

  // In-memory fallback
  let controls = Array.from(memoryDb.controls.values());
  if (controls.length === 0 && organizationId) {
    // Seed default baseline controls for organization
    for (const def of DEFAULT_CONTROLS_CATALOG) {
      const record = {
        ...def,
        id: `ctrl_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        organizationId,
        version: '1.0.0',
        lastReviewedAt: new Date().toISOString(),
        nextReviewAt: new Date(Date.now() + 90 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDb.controls.set(record.id, record);
    }
    controls = Array.from(memoryDb.controls.values());
  }

  if (organizationId) controls = controls.filter(c => c.organizationId === organizationId);
  if (category) controls = controls.filter(c => c.category === category);
  if (status) controls = controls.filter(c => c.implementationStatus === status);
  if (isPublic !== null) controls = controls.filter(c => c.isPublic === isPublic);

  return controls.map(c => ({
    ...c,
    evidence: Array.from(memoryDb.controlEvidence.values()).filter(e => e.controlId === c.id),
  }));
}

export async function saveControlDb(control) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.control.create({
      data: {
        id: control.id,
        organizationId: control.organizationId,
        code: control.code,
        name: control.name,
        description: control.description,
        category: control.category,
        implementationStatus: control.implementationStatus,
        owner: control.owner,
        version: control.version,
        lastReviewedAt: new Date(control.lastReviewedAt),
        nextReviewAt: control.nextReviewAt ? new Date(control.nextReviewAt) : null,
        isPublic: control.isPublic,
        evidenceRequirementsJson: JSON.stringify(control.evidenceRequirements || []),
      },
    });
  }
  memoryDb.controls.set(control.id, control);
  return control;
}

export async function getControlByIdDb(id, organizationId) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const c = await client.control.findFirst({
      where: { id, organizationId },
      include: { evidence: true, requirements: true, versions: true },
    });
    if (!c) return null;
    return {
      ...c,
      evidenceRequirements: c.evidenceRequirementsJson ? JSON.parse(c.evidenceRequirementsJson) : [],
    };
  }

  const c = memoryDb.controls.get(id);
  if (!c || (organizationId && c.organizationId !== organizationId)) return null;
  return {
    ...c,
    evidence: Array.from(memoryDb.controlEvidence.values()).filter(e => e.controlId === id),
  };
}

// ── CONTROL EVIDENCE ─────────────────────────────────────────────────────────

export async function saveControlEvidenceDb(evidence) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.controlEvidence.create({
      data: {
        id: evidence.id,
        controlId: evidence.controlId,
        organizationId: evidence.organizationId,
        sourceType: evidence.sourceType,
        sourceId: evidence.sourceId,
        title: evidence.title,
        summary: evidence.summary,
        integrityHash: evidence.integrityHash,
        collectedAt: new Date(evidence.collectedAt),
        validUntil: evidence.validUntil ? new Date(evidence.validUntil) : null,
        isPublic: evidence.isPublic,
        metadataJson: JSON.stringify(evidence.metadata || {}),
      },
    });
  }
  memoryDb.controlEvidence.set(evidence.id, evidence);
  return evidence;
}

export async function listControlEvidenceDb({ organizationId, controlId = null, isPublic = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (controlId) where.controlId = controlId;
    if (isPublic !== null) where.isPublic = isPublic;

    const evidence = await client.controlEvidence.findMany({
      where,
      orderBy: { collectedAt: 'desc' },
    });
    return evidence.map(e => ({
      ...e,
      metadata: e.metadataJson ? JSON.parse(e.metadataJson) : {},
    }));
  }

  let evidence = Array.from(memoryDb.controlEvidence.values());
  if (organizationId) evidence = evidence.filter(e => e.organizationId === organizationId);
  if (controlId) evidence = evidence.filter(e => e.controlId === controlId);
  if (isPublic !== null) evidence = evidence.filter(e => e.isPublic === isPublic);
  return evidence;
}

// ── SECURITY QUESTIONNAIRE ───────────────────────────────────────────────────

export async function listQuestionnaireDb({ organizationId, category = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (category) where.category = category;
    const questions = await client.securityQuestionnaire.findMany({ where, orderBy: { category: 'asc' } });
    return questions.map(q => ({
      ...q,
      evidenceIds: q.evidenceIdsJson ? JSON.parse(q.evidenceIdsJson) : [],
    }));
  }

  let questions = Array.from(memoryDb.securityQuestionnaires.values());
  if (questions.length === 0 && organizationId) {
    // Seed default questions
    for (const t of DEFAULT_QUESTIONNAIRE_TEMPLATES) {
      const q = {
        id: `quest_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        organizationId,
        title: t.title,
        category: t.category,
        question: t.question,
        answer: t.defaultAnswer,
        explanation: t.explanation,
        evidenceIds: [],
        owner: 'Security Officer',
        lastReviewedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDb.securityQuestionnaires.set(q.id, q);
    }
    questions = Array.from(memoryDb.securityQuestionnaires.values());
  }

  if (organizationId) questions = questions.filter(q => q.organizationId === organizationId);
  if (category) questions = questions.filter(q => q.category === category);
  return questions;
}

export async function saveQuestionnaireDb(question) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.securityQuestionnaire.create({
      data: {
        id: question.id,
        organizationId: question.organizationId,
        title: question.title,
        category: question.category,
        question: question.question,
        answer: question.answer,
        explanation: question.explanation,
        evidenceIdsJson: JSON.stringify(question.evidenceIds || []),
        owner: question.owner,
        lastReviewedAt: new Date(question.lastReviewedAt),
      },
    });
  }
  memoryDb.securityQuestionnaires.set(question.id, question);
  return question;
}

export async function updateQuestionnaireDb(id, organizationId, updates) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const data = { updatedAt: new Date() };
    if (updates.answer !== undefined) data.answer = updates.answer;
    if (updates.explanation !== undefined) data.explanation = updates.explanation;
    if (updates.evidenceIds !== undefined) data.evidenceIdsJson = JSON.stringify(updates.evidenceIds);
    if (updates.owner !== undefined) data.owner = updates.owner;
    data.lastReviewedAt = new Date();

    return await client.securityQuestionnaire.update({ where: { id }, data });
  }

  const existing = memoryDb.securityQuestionnaires.get(id);
  if (!existing || (organizationId && existing.organizationId !== organizationId)) return null;
  const updated = {
    ...existing,
    ...updates,
    lastReviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryDb.securityQuestionnaires.set(id, updated);
  return updated;
}

// ── ACCESS REVIEWS ───────────────────────────────────────────────────────────

export async function listAccessReviewsDb({ organizationId, status = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (status) where.status = status;
    return await client.accessReview.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  let reviews = Array.from(memoryDb.accessReviews.values());
  if (organizationId) reviews = reviews.filter(r => r.organizationId === organizationId);
  if (status) reviews = reviews.filter(r => r.status === status);
  return reviews;
}

export async function saveAccessReviewDb(review) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.accessReview.create({ data: review });
  }
  memoryDb.accessReviews.set(review.id, review);
  return review;
}

// ── CREDENTIAL INVENTORY ─────────────────────────────────────────────────────

export async function listCredentialInventoryDb({ organizationId, rotationStatus = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (rotationStatus) where.rotationStatus = rotationStatus;
    return await client.credentialInventory.findMany({ where, orderBy: { lastSeenAt: 'desc' } });
  }

  let creds = Array.from(memoryDb.credentialInventories.values());
  if (organizationId) creds = creds.filter(c => c.organizationId === organizationId);
  if (rotationStatus) creds = creds.filter(c => c.rotationStatus === rotationStatus);
  return creds;
}

export async function saveCredentialInventoryDb(cred) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.credentialInventory.create({ data: cred });
  }
  memoryDb.credentialInventories.set(cred.id, cred);
  return cred;
}

// ── TRUST REPORTS ────────────────────────────────────────────────────────────

export async function listTrustReportsDb({ organizationId, reportType = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (reportType) where.reportType = reportType;
    const reports = await client.trustReport.findMany({ where, orderBy: { createdAt: 'desc' } });
    return reports.map(r => ({
      ...r,
      sections: r.sectionsJson ? JSON.parse(r.sectionsJson) : [],
    }));
  }

  let reports = Array.from(memoryDb.trustReports.values());
  if (organizationId) reports = reports.filter(r => r.organizationId === organizationId);
  if (reportType) reports = reports.filter(r => r.reportType === reportType);
  return reports;
}

export async function saveTrustReportDb(report) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.trustReport.create({
      data: {
        id: report.id,
        organizationId: report.organizationId,
        reportType: report.reportType,
        title: report.title,
        scope: report.scope,
        format: report.format,
        sectionsJson: JSON.stringify(report.sections || []),
        generatedBy: report.generatedBy,
        shareableSlug: report.shareableSlug,
        isPublic: report.isPublic,
        sanitizedSummaryJson: JSON.stringify(report.content || {}),
      },
    });
  }
  memoryDb.trustReports.set(report.id, report);
  return report;
}

export async function getTrustReportBySlugDb(slug) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const r = await client.trustReport.findUnique({ where: { shareableSlug: slug } });
    if (!r) return null;
    return {
      ...r,
      sections: r.sectionsJson ? JSON.parse(r.sectionsJson) : [],
      content: r.sanitizedSummaryJson ? JSON.parse(r.sanitizedSummaryJson) : {},
    };
  }

  for (const rep of memoryDb.trustReports.values()) {
    if (rep.shareableSlug === slug) return rep;
  }
  return null;
}

// ── SECURITY ADVISORIES ──────────────────────────────────────────────────────

export async function listSecurityAdvisoriesDb() {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const advisories = await client.securityAdvisory.findMany({ orderBy: { publishedAt: 'desc' } });
    return advisories.map(a => ({
      ...a,
      references: a.referencesJson ? JSON.parse(a.referencesJson) : [],
    }));
  }

  let advisories = Array.from(memoryDb.securityAdvisories.values());
  if (advisories.length === 0) {
    for (const def of DEFAULT_SECURITY_ADVISORIES) {
      const record = { ...def, id: `adv_${randomUUID().replace(/-/g, '').slice(0, 16)}` };
      memoryDb.securityAdvisories.set(record.id, record);
    }
    advisories = Array.from(memoryDb.securityAdvisories.values());
  }
  return advisories;
}

// ── TRUST POLICIES ───────────────────────────────────────────────────────────

export async function listTrustPoliciesDb({ organizationId, category = null, status = null }) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    const where = { organizationId };
    if (category) where.category = category;
    if (status) where.status = status;
    return await client.trustPolicy.findMany({ where, orderBy: { category: 'asc' } });
  }

  let policies = Array.from(memoryDb.trustPolicies.values());
  if (policies.length === 0 && organizationId) {
    // Seed default policy templates for org
    for (const p of DEFAULT_POLICY_TEMPLATES) {
      const record = {
        ...p,
        id: `pol_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        organizationId,
        effectiveDate: new Date().toISOString(),
        reviewDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        approver: 'Security Lead',
        changeSummary: 'Initial policy baseline template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryDb.trustPolicies.set(record.id, record);
    }
    policies = Array.from(memoryDb.trustPolicies.values());
  }

  if (organizationId) policies = policies.filter(p => p.organizationId === organizationId);
  if (category) policies = policies.filter(p => p.category === category);
  if (status) policies = policies.filter(p => p.status === status);
  return policies;
}

export async function saveTrustPolicyDb(policy) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.trustPolicy.create({ data: policy });
  }
  memoryDb.trustPolicies.set(policy.id, policy);
  return policy;
}

export async function getTrustPolicyByIdDb(id, organizationId) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.trustPolicy.findFirst({ where: { id, organizationId } });
  }
  const p = memoryDb.trustPolicies.get(id);
  if (!p || (organizationId && p.organizationId !== organizationId)) return null;
  return p;
}

export async function updateTrustPolicyDb(id, organizationId, updates) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.trustPolicy.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  const existing = memoryDb.trustPolicies.get(id);
  if (!existing || (organizationId && existing.organizationId !== organizationId)) return null;
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  memoryDb.trustPolicies.set(id, updated);
  return updated;
}

// ── TRUST SETTINGS ───────────────────────────────────────────────────────────

export async function getTrustSettingDb(organizationId) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    let setting = await client.trustSetting.findUnique({ where: { organizationId } });
    if (!setting) {
      setting = await client.trustSetting.create({
        data: {
          id: `tset_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
          organizationId,
          publicCenterEnabled: false,
          organizationSlug: `org-${organizationId.slice(0, 8)}`,
          publicName: 'Organization',
          securityContactEmail: 'security@example.com',
          securityContactUrl: 'https://example.com/security',
        },
      });
    }
    return setting;
  }

  let setting = memoryDb.trustSettings.get(organizationId);
  if (!setting) {
    setting = {
      id: `tset_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      organizationId,
      publicCenterEnabled: false,
      organizationSlug: `org-${organizationId.slice(0, 8)}`,
      publicName: 'Organization',
      securityContactEmail: 'security@example.com',
      securityContactUrl: 'https://example.com/security',
      accessReviewIntervalDays: 90,
      policyReviewIntervalDays: 365,
      securityTestIntervalDays: 30,
      integrationReviewDays: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryDb.trustSettings.set(organizationId, setting);
  }
  return setting;
}

export async function saveTrustSettingDb(organizationId, updates) {
  const { isPostgres, client } = await getDb();
  if (isPostgres) {
    return await client.trustSetting.upsert({
      where: { organizationId },
      update: {
        ...updates,
        updatedAt: new Date(),
      },
      create: {
        id: `tset_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        organizationId,
        ...updates,
      },
    });
  }

  const existing = await getTrustSettingDb(organizationId);
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  memoryDb.trustSettings.set(organizationId, updated);
  return updated;
}

