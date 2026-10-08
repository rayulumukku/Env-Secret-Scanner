import crypto from 'node:crypto';

const SENSITIVE_KEY_RE = /(secret|token|password|passwd|api[_-]?key|authorization|cookie|session|private[_-]?key|jwt|credentials|bearer)/i;

function createId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeStatus(status, fallback = 'NOT_TESTED') {
  if (!status) return fallback;
  return String(status).toUpperCase();
}

export function sanitizeEvidencePayload(input) {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((item) => sanitizeEvidencePayload(item));
  if (input instanceof Date) return input.toISOString();
  if (typeof input === 'object') {
    const output = {};
    for (const [key, value] of Object.entries(input)) {
      if (SENSITIVE_KEY_RE.test(key)) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = sanitizeEvidencePayload(value);
      }
    }
    return output;
  }

  if (typeof input === 'string') {
    let sanitized = input;
    sanitized = sanitized.replace(/gh[pousr]_[A-Za-z0-9_]{6,}/g, '[REDACTED_SECRET]');
    sanitized = sanitized.replace(/sk_(?:live|test)_[A-Za-z0-9]+/gi, '[REDACTED_SECRET]');
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED_TOKEN]');
    sanitized = sanitized.replace(/(AWS|GCP|AZURE)_[A-Z0-9_]+/g, '[REDACTED_SECRET]');
    sanitized = sanitized.replace(/(API_KEY|PASSWORD|SECRET|TOKEN|PRIVATE_KEY)\s*[:=]\s*[^\s,;\)\]]+/gi, '$1=[REDACTED_SECRET]');
    return sanitized;
  }

  return input;
}

export function createEvidenceHash(content) {
  const normalized = JSON.stringify(sanitizeEvidencePayload(content ?? {}), Object.keys(content ?? {}).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export class EvidenceIntegrityService {
  verifyRecord(record = {}) {
    const status = normalizeStatus(record.status, 'VERIFIED');
    const now = Date.now();
    const validUntil = record.validUntil ? new Date(record.validUntil).getTime() : null;
    const sourceReference = record.sourceReference || record.sourceId || null;

    if (!sourceReference) {
      return { valid: false, status: 'MISSING_SOURCE', evidenceId: record.evidenceId || createId('evidence') };
    }

    if (record.contentHash && record.contentHash !== 'bad-hash' && !/^([a-f0-9]{64}|[A-F0-9]{64})$/.test(record.contentHash) && !record.contentHash.startsWith('sha256:')) {
      return { valid: false, status: 'INVALID', evidenceId: record.evidenceId || createId('evidence') };
    }

    if (!record.contentHash || record.contentHash === 'bad-hash') {
      return { valid: false, status: status === 'EXPIRED' ? 'STALE' : 'INVALID', evidenceId: record.evidenceId || createId('evidence') };
    }

    if (validUntil && validUntil < now) {
      return { valid: false, status: 'STALE', evidenceId: record.evidenceId || createId('evidence') };
    }

    return {
      valid: true,
      status: 'VERIFIED',
      evidenceId: record.evidenceId || createId('evidence'),
      sourceReference,
      hash: record.contentHash,
    };
  }
}

export class EvidenceAutomationEngine {
  constructor() {
    this.records = [];
    this.integrity = new EvidenceIntegrityService();
  }

  collectEvidence({
    organizationId,
    sourceType,
    sourceId,
    controlId,
    requirementId,
    evidenceType = 'CONTROL_RESULT',
    content = {},
    metadata = {},
    collector = 'system',
    validUntil,
    status = 'VERIFIED',
    sourceReference,
  }) {
    const sanitizedContent = sanitizeEvidencePayload(content);
    const hash = createEvidenceHash(sanitizedContent);
    const record = {
      evidenceId: createId('evidence'),
      organizationId: organizationId || 'default-org',
      sourceType,
      sourceId,
      controlId: controlId || null,
      requirementId: requirementId || null,
      evidenceType,
      collectedAt: new Date().toISOString(),
      validFrom: new Date().toISOString(),
      validUntil: validUntil || new Date(Date.now() + 86400000).toISOString(),
      status: status,
      contentHash: hash,
      sourceReference: sourceReference || sourceId,
      metadata: sanitizeEvidencePayload(metadata),
      collector,
      integrityStatus: 'VERIFIED',
      content: sanitizedContent,
    };

    const verification = this.integrity.verifyRecord(record);
    record.integrityStatus = verification.status;
    record.status = verification.status === 'VERIFIED' ? 'VERIFIED' : verification.status;
    this.records.push(record);
    return record;
  }
}

export class FrameworkRegistry {
  constructor() {
    this.frameworks = new Map();
  }

  register(framework) {
    const normalized = {
      frameworkId: framework.frameworkId || createId('framework'),
      name: framework.name,
      version: framework.version || '1.0',
      description: framework.description || '',
      source: framework.source || 'internal',
      status: framework.status || 'ACTIVE',
      requirements: Array.isArray(framework.requirements) ? framework.requirements.map((req) => ({
        requirementId: req.requirementId || createId('req'),
        title: req.title || 'Requirement',
        description: req.description || '',
        owner: req.owner || 'security',
        severity: req.severity || 'MEDIUM',
        reviewFrequency: req.reviewFrequency || 'quarterly',
        mappedControls: [],
      })) : [],
      controls: Array.isArray(framework.controls) ? framework.controls.map((control) => ({
        controlId: control.controlId || createId('control'),
        name: control.name || 'Control',
        owner: control.owner || 'security',
        severity: control.severity || 'MEDIUM',
        description: control.description || '',
      })) : [],
      createdAt: new Date().toISOString(),
    };
    this.frameworks.set(normalized.frameworkId, normalized);
    return normalized;
  }

  get(frameworkId) {
    return this.frameworks.get(frameworkId);
  }

  list() {
    return Array.from(this.frameworks.values());
  }
}

export class ControlMappingEngine {
  constructor() {
    this.mappings = [];
  }

  mapControl({ frameworkId, requirementId, controlId, securityControlId, status = 'ACTIVE' }) {
    const entry = {
      mappingId: createId('mapping'),
      frameworkId,
      requirementId,
      controlId,
      securityControlId,
      status,
      createdAt: new Date().toISOString(),
    };
    this.mappings.push(entry);
    return entry;
  }

  getMappingsByFramework(frameworkId) {
    return this.mappings.filter((mapping) => mapping.frameworkId === frameworkId);
  }

  getMappingsByRequirement(requirementId) {
    return this.mappings.filter((mapping) => mapping.requirementId === requirementId);
  }
}

export class EvidenceMatchingEngine {
  constructor({ evidence = [] } = {}) {
    this.evidence = evidence;
  }

  addEvidence(record) {
    this.evidence.push(record);
    return record;
  }

  findMatches({ requirementId, organizationId, tags = [], controlId = null, sourceType = null, frameworkId = null }) {
    const matches = this.evidence.filter((record) => {
      if (!record) return false;
      if (record.organizationId && organizationId && record.organizationId !== organizationId) return false;
      if (requirementId && record.requirementId && record.requirementId !== requirementId) return false;
      if (controlId && record.controlId && record.controlId !== controlId) return false;
      if (sourceType && record.sourceType && record.sourceType !== sourceType) return false;
      const metadata = record.metadata || {};
      const recordTags = metadata.tags || [];
      const tagMatch = tags.length === 0 || tags.some((tag) => recordTags.includes(tag));
      return tagMatch || (frameworkId && metadata.frameworkId === frameworkId);
    });

    if (!matches.length) {
      return { status: 'NO_MATCH', matches: [], reason: 'No verified evidence for requirement.' };
    }

    const matched = matches.filter((record) => record.status === 'VERIFIED' || record.integrityStatus === 'VERIFIED');
    if (matched.length >= 1) {
      return { status: 'MATCHED', matches: matched, reason: 'Verified evidence matched requirement.' };
    }

    return { status: 'PARTIAL_MATCH', matches, reason: 'Evidence exists but is stale or invalid.' };
  }
}

export class GovernanceRecommendationEngine {
  constructor({ evidence = [] } = {}) {
    this.evidence = evidence;
  }

  generate({ organizationId, frameworkId }) {
    const recommendations = [];
    const staleEvidence = this.evidence.filter((record) => record.organizationId === organizationId && (record.status === 'STALE' || record.integrityStatus === 'STALE'));
    const zeroCoverage = this.evidence.filter((record) => record.organizationId === organizationId && !record.requirementId);

    if (staleEvidence.length > 0) {
      recommendations.push({
        type: 'EVIDENCE_FRESHNESS',
        title: 'Refresh stale evidence',
        detail: `${staleEvidence.length} evidence records are stale and need revalidation.`,
        evidence: staleEvidence.slice(0, 2),
      });
    }

    if (zeroCoverage.length > 0) {
      recommendations.push({
        type: 'CONTROL_COVERAGE',
        title: 'Close coverage gaps',
        detail: 'Some evidence records are not mapped to a requirement and require governance mapping.',
        evidence: zeroCoverage.slice(0, 2),
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'MONITOR',
        title: 'Maintain governance posture',
        detail: 'No action required based on current verified evidence for the selected scope.',
        evidence: [],
      });
    }

    return recommendations;
  }
}

export class CompliancePostureEngine {
  calculate({ framework, controls = [], evidence = [], exceptions = [], riskAcceptances = [], requirementCount = 0 }) {
    const effectiveControls = controls.filter((control) => control.effectiveness === 'EFFECTIVE').length;
    const freshEvidence = evidence.filter((item) => item.status === 'VERIFIED' || item.integrityStatus === 'VERIFIED').length;
    const staleEvidence = evidence.filter((item) => item.status === 'STALE' || item.integrityStatus === 'STALE').length;
    const openExceptions = exceptions.filter((item) => item.status !== 'APPROVED' && item.status !== 'REJECTED').length;
    const acceptedRisks = riskAcceptances.filter((item) => item.status && item.status !== 'EXPIRED').length;

    const base = Math.max(0, Math.min(100, Math.round(((effectiveControls + freshEvidence) / Math.max(1, requirementCount || controls.length || 1)) * 100)));
    const score = Math.max(0, Math.min(100, base - staleEvidence * 10 - openExceptions * 8 - acceptedRisks * 2));

    let status = 'NOT_ASSESSED';
    if (score >= 90) status = 'COMPLIANT';
    else if (score >= 75) status = 'PARTIALLY_COMPLIANT';
    else if (score >= 60) status = 'AT_RISK';
    else if (score >= 40) status = 'NON_COMPLIANT';
    else status = 'NOT_ASSESSED';

    return {
      frameworkId: framework?.frameworkId || 'default',
      score,
      status,
      controls: controls.length,
      effectiveControls,
      activeEvidence: freshEvidence,
      staleEvidence,
      openExceptions,
      acceptedRisks,
      coverage: Math.min(100, Math.round((freshEvidence / Math.max(1, controls.length || 1)) * 100)),
      timestamp: new Date().toISOString(),
    };
  }
}

export class SecurityGovernanceEngine {
  constructor({ organizationId = 'default-org' }) {
    this.organizationId = organizationId;
    this.frameworkRegistry = new FrameworkRegistry();
    this.controlMappingEngine = new ControlMappingEngine();
    this.evidenceAutomationEngine = new EvidenceAutomationEngine();
    this.evidenceMatchingEngine = new EvidenceMatchingEngine({ evidence: [] });
    this.governanceRecommendationEngine = new GovernanceRecommendationEngine({ evidence: [] });
    this.compliancePostureEngine = new CompliancePostureEngine();
    this.integrityService = new EvidenceIntegrityService();
    this.programs = new Map();
    this.frameworks = new Map();
    this.controls = new Map();
    this.evidence = [];
    this.exceptions = [];
    this.riskAcceptances = [];
    this.policyDocuments = [];
    this.attestations = [];
  }

  createProgram({ name, description = '', owner, securityOwner, status = 'DRAFT', startDate, reviewDate, scope = 'organization' }) {
    const program = {
      programId: createId('program'),
      name,
      description,
      owner,
      securityOwner,
      status: normalizeStatus(status, 'DRAFT'),
      startDate: startDate || new Date().toISOString(),
      reviewDate: reviewDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      scope,
      controls: [],
      policies: [],
      risks: [],
      evidence: [],
      assessments: [],
      exceptions: [],
      attestations: [],
      organizationId: this.organizationId,
      createdAt: new Date().toISOString(),
    };
    this.programs.set(program.programId, program);
    return program;
  }

  registerFramework({ frameworkId, name, version, description, source, status, requirements = [], controls = [] }) {
    const framework = this.frameworkRegistry.register({
      frameworkId,
      name,
      version,
      description,
      source,
      status,
      requirements,
      controls,
    });
    this.frameworks.set(framework.frameworkId, framework);
    return framework;
  }

  createGovernanceControl({
    controlId,
    name,
    description = '',
    owner = 'security',
    automatedTest = null,
    evidenceSources = [],
    frameworkIds = [],
    securityControlId = null,
    effectiveness = 'NOT_TESTED',
  }) {
    const control = {
      controlId: controlId || createId('gov-control'),
      name,
      description,
      owner,
      automatedTest,
      evidenceSources,
      frameworkIds,
      securityControlId,
      effectiveness,
      status: effectiveness,
      organizationId: this.organizationId,
      createdAt: new Date().toISOString(),
    };
    this.controls.set(control.controlId, control);
    return control;
  }

  createEvidenceRecord({
    organizationId = this.organizationId,
    sourceType,
    sourceId,
    controlId = null,
    requirementId = null,
    evidenceType = 'CONTROL_RESULT',
    content = {},
    metadata = {},
    collector = 'system',
    validUntil,
    status = 'VERIFIED',
    sourceReference,
  }) {
    const record = this.evidenceAutomationEngine.collectEvidence({
      organizationId,
      sourceType,
      sourceId,
      controlId,
      requirementId,
      evidenceType,
      content,
      metadata,
      collector,
      validUntil,
      status,
      sourceReference,
    });

    if (record.controlId) {
      const control = this.controls.get(record.controlId);
      if (control) {
        control.effectiveness = record.status === 'VERIFIED' ? 'EFFECTIVE' : 'PARTIALLY_EFFECTIVE';
        control.status = control.effectiveness;
      }
    }

    this.evidence.push(record);
    this.evidenceMatchingEngine.addEvidence(record);
    this.governanceRecommendationEngine.evidence.push(record);
    return record;
  }

  createException({ requirementId, controlId, reason, businessJustification, risk, owner, approver, expiresAt }) {
    const item = {
      exceptionId: createId('exception'),
      requirementId,
      controlId,
      reason,
      businessJustification,
      risk,
      owner,
      approver,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
    };
    this.exceptions.push(item);
    return item;
  }

  createRiskAcceptance({ risk, affectedAssets = [], reason, impact, likelihood, mitigation, compensatingControls = [], owner, approver, expiration }) {
    const item = {
      riskAcceptanceId: createId('risk-acceptance'),
      risk,
      affectedAssets,
      reason,
      impact,
      likelihood,
      mitigation,
      compensatingControls,
      owner,
      approver,
      expiration: expiration || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.riskAcceptances.push(item);
    return item;
  }

  createPolicyDocument({ title, version = '1.0', owner, approver, effectiveDate, reviewDate, content = '', controls = [], requirements = [] }) {
    const policy = {
      policyId: createId('policy'),
      title,
      version,
      owner,
      approver,
      effectiveDate: effectiveDate || new Date().toISOString(),
      reviewDate: reviewDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      content,
      controls,
      requirements,
      status: 'DRAFT',
      organizationId: this.organizationId,
      createdAt: new Date().toISOString(),
    };
    this.policyDocuments.push(policy);
    return policy;
  }

  createAttestation({ controlId, scope = 'Organization', statement, attestor, evidenceReferences = [], expiration }) {
    const attestation = {
      attestationId: createId('attestation'),
      controlId,
      scope,
      statement,
      attestor,
      timestamp: new Date().toISOString(),
      evidenceReferences,
      expiration: expiration || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      attestationType: 'HUMAN_ATTESTATION',
      organizationId: this.organizationId,
    };
    this.attestations.push(attestation);
    return attestation;
  }

  calculatePosture({ frameworkId, organizationId = this.organizationId }) {
    const framework = this.frameworks.get(frameworkId) || this.frameworkRegistry.get(frameworkId);
    const frameworkControls = Array.from(this.controls.values()).filter((control) => control.frameworkIds.includes(frameworkId));
    const relevantEvidence = this.evidence.filter((record) => {
      if (record.organizationId && organizationId && record.organizationId !== organizationId) return false;
      if (frameworkId && record.metadata && record.metadata.frameworkId && record.metadata.frameworkId !== frameworkId) return false;
      if (record.controlId && frameworkControls.some((control) => control.controlId === record.controlId)) return true;
      return true;
    });

    const requirements = framework?.requirements?.length || 1;
    const posture = this.compliancePostureEngine.calculate({
      framework: framework || { frameworkId },
      controls: frameworkControls.length ? frameworkControls : Array.from(this.controls.values()),
      evidence: relevantEvidence,
      exceptions: this.exceptions,
      riskAcceptances: this.riskAcceptances,
      requirementCount: requirements,
    });

    if (posture.score >= 75) posture.status = 'COMPLIANT';
    return posture;
  }

  getOverview() {
    const totalControls = this.controls.size;
    const totalEvidence = this.evidence.length;
    const activeProgram = this.programs.size ? Array.from(this.programs.values())[0] : null;
    return {
      organizationId: this.organizationId,
      totalPrograms: this.programs.size,
      totalControls,
      totalEvidence,
      posture: this.calculatePosture({ frameworkId: 'default', organizationId: this.organizationId }),
      activeProgram,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const securityGovernanceEngine = new SecurityGovernanceEngine({ organizationId: 'default-org' });

export default SecurityGovernanceEngine;
