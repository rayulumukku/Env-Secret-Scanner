import crypto from 'node:crypto';

import { securityContextSanitizer } from './security-context-sanitizer.js';
import { SecurityGraphService } from './security-graph.js';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value || 0)));

const sanitizeObject = (value) => {
  const cleaned = securityContextSanitizer.sanitize(value);
  if (cleaned && typeof cleaned === 'object') {
    delete cleaned.rawValue;
    delete cleaned.secretValue;
    delete cleaned.password;
    delete cleaned.token;
    delete cleaned.apiKey;
    delete cleaned.authorization;
    delete cleaned.cookie;
    delete cleaned.session;
  }
  return cleaned;
};

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const severityRank = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  MONITOR: 1,
};

export class SecurityRisk {
  constructor({
    organizationId,
    title,
    description,
    category = 'SECRET_EXPOSURE',
    inherentRisk = 0,
    residualRisk = 0,
    likelihood = 0,
    impact = 0,
    confidence = 0,
    owner,
    reviewer,
    status = 'IDENTIFIED',
    sourceType = 'FINDING',
    sourceId,
    treatment = 'MITIGATE',
    mitigation = '',
    dueDate,
    findings = [],
    assetIds = [],
    evidence = [],
  }) {
    this.riskId = createId('risk');
    this.organizationId = organizationId;
    this.title = title || 'Security Risk';
    this.description = description || '';
    this.category = category;
    this.inherentRisk = clamp(inherentRisk);
    this.residualRisk = clamp(residualRisk);
    this.likelihood = clamp(likelihood);
    this.impact = clamp(impact);
    this.confidence = clamp(confidence);
    this.owner = owner || 'security';
    this.reviewer = reviewer || 'security-lead';
    this.status = status;
    this.sourceType = sourceType;
    this.sourceId = sourceId || null;
    this.treatment = treatment;
    this.mitigation = mitigation;
    this.dueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.findings = findings;
    this.assetIds = assetIds;
    this.evidence = evidence;
  }

  attachFinding(finding) {
    const findingId = finding && (finding.findingId || finding.id || finding.fingerprint || String(finding));
    if (findingId && !this.findings.includes(findingId)) this.findings.push(findingId);
    this.updatedAt = new Date().toISOString();
    return this;
  }

  attachAsset(assetId) {
    if (assetId && !this.assetIds.includes(assetId)) this.assetIds.push(assetId);
    this.updatedAt = new Date().toISOString();
    return this;
  }

  addEvidence(record) {
    if (record && !this.evidence.some((item) => item && item.evidenceId === record.evidenceId)) {
      this.evidence.push(record);
    }
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return sanitizeObject({ ...this });
  }
}

export class SecurityRiskRegister {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.risks = new Map();
    this.graph = new SecurityGraphService({ organizationId });
  }

  createRisk(input) {
    const risk = new SecurityRisk({ organizationId: input.organizationId || this.organizationId, ...input });
    this.risks.set(risk.riskId, risk);
    this.graph.addNode({ entityType: 'RISK', entityId: risk.riskId, organizationId: risk.organizationId, label: risk.title, metadata: { title: risk.title, status: risk.status, treatment: risk.treatment } });
    if (risk.sourceId) {
      this.graph.addEdge({ sourceId: risk.sourceId, sourceType: risk.sourceType, targetId: risk.riskId, targetType: 'RISK', relationshipType: 'RISK_DERIVED_FROM', organizationId: risk.organizationId });
    }
    return risk;
  }

  list({ status, owner, sourceType, treatment, severity, sort = 'updatedAt', limit = 50 } = {}) {
    let items = Array.from(this.risks.values());
    if (status) items = items.filter((risk) => risk.status === status);
    if (owner) items = items.filter((risk) => risk.owner === owner);
    if (sourceType) items = items.filter((risk) => risk.sourceType === sourceType);
    if (treatment) items = items.filter((risk) => risk.treatment === treatment);
    if (severity) items = items.filter((risk) => risk.residualRisk >= (severity === 'CRITICAL' ? 80 : severity === 'HIGH' ? 60 : 40));
    items = items.sort((a, b) => (new Date(b[sort] || b.updatedAt).getTime() - new Date(a[sort] || a.updatedAt).getTime()));
    return items.slice(0, limit);
  }

  get(riskId) {
    return this.risks.get(riskId) || null;
  }
}

export class RiskQuantificationEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.snapshots = new Map();
  }

  calculate({
    likelihood,
    impact,
    exposure,
    exploitability,
    assetCriticality,
    threatRelevance,
    controlStrength,
    remediationConfidence,
    exposureDurationDays,
    recurrence,
    attackPathDepth,
    uncertainty,
    existingResidualRisk,
  }) {
    const likelihoodScore = clamp(likelihood);
    const impactScore = clamp(impact);
    const exposureScore = clamp(exposure);
    const exploitabilityScore = clamp(exploitability);
    const assetCriticalityScore = clamp(assetCriticality);
    const threatRelevanceScore = clamp(threatRelevance);
    const controlStrengthScore = clamp(controlStrength);
    const remediationConfidenceScore = clamp(remediationConfidence);
    const exposureDuration = clamp(exposureDurationDays * 2, 0, 100);
    const recurrenceScore = clamp(recurrence * 12, 0, 100);
    const attackPathDepthScore = clamp(attackPathDepth * 10, 0, 100);
    const uncertaintyScore = clamp(uncertainty);

    const inherentRisk = clamp(
      likelihoodScore * 0.28 +
      impactScore * 0.24 +
      exposureScore * 0.16 +
      exploitabilityScore * 0.14 +
      assetCriticalityScore * 0.12 +
      threatRelevanceScore * 0.1 +
      recurrenceScore * 0.08 +
      attackPathDepthScore * 0.08
    );

    const controlReduction = controlStrengthScore * 0.58;
    const confidenceBonus = remediationConfidenceScore * 0.22;
    const uncertaintyPenalty = uncertaintyScore * 0.24;
    const residualRisk = clamp(
      inherentRisk - controlReduction + exposureDuration * 0.2 + (100 - remediationConfidenceScore) * 0.18 - confidenceBonus + uncertaintyPenalty
    );
    const projectedRisk = clamp(
      residualRisk + (100 - remediationConfidenceScore) * 0.16 + attackPathDepthScore * 0.08 + recurrenceScore * 0.1
    );
    const riskConfidence = clamp(
      threatRelevanceScore * 0.22 +
      remediationConfidenceScore * 0.2 +
      controlStrengthScore * 0.28 +
      (100 - uncertaintyScore) * 0.3
    );

    const explanation = [];
    if (controlStrengthScore >= 70) {
      explanation.push('Residual risk decreased because effective controls were verified.');
    }
    if (remediationConfidenceScore >= 80) {
      explanation.push('Remediation confidence is high, reducing projected uncertainty.');
    }
    if (exposureScore > 60) {
      explanation.push('Exposure level remains elevated due to public or internet-facing exposure.');
    }
    if (existingResidualRisk && residualRisk < existingResidualRisk) {
      explanation.push('Residual risk declined after validated control improvements and exposure reduction.');
    }
    if (explanation.length === 0) {
      explanation.push('Residual risk remains elevated because exposure, recurrence, and control coverage continue to require attention.');
    }

    const result = {
      inherentRisk: Number(inherentRisk.toFixed(1)),
      residualRisk: Number(residualRisk.toFixed(1)),
      projectedRisk: Number(projectedRisk.toFixed(1)),
      riskConfidence: Number(riskConfidence.toFixed(1)),
      explanation,
      likelihood: Number(likelihoodScore.toFixed(1)),
      impact: Number(impactScore.toFixed(1)),
      controlStrength: Number(controlStrengthScore.toFixed(1)),
      exposure: Number(exposureScore.toFixed(1)),
      exploitability: Number(exploitabilityScore.toFixed(1)),
      assetCriticality: Number(assetCriticalityScore.toFixed(1)),
      threatRelevance: Number(threatRelevanceScore.toFixed(1)),
      remediationConfidence: Number(remediationConfidenceScore.toFixed(1)),
      recurrence: Number(recurrenceScore.toFixed(1)),
      attackPathDepth: Number(attackPathDepthScore.toFixed(1)),
      uncertainty: Number(uncertaintyScore.toFixed(1)),
      calculatedAt: new Date().toISOString(),
    };

    return result;
  }

  createSnapshot({ riskId, score }) {
    const snapshot = {
      snapshotId: createId('snapshot'),
      riskId,
      score,
      createdAt: new Date().toISOString(),
    };
    const list = this.snapshots.get(riskId) || [];
    list.push(snapshot);
    this.snapshots.set(riskId, list);
    return snapshot;
  }
}

export class SecurityOperationsQueue {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.items = [];
    this.audit = [];
  }

  ingest(item) {
    const normalized = {
      id: item.id || createId('queue-item'),
      type: item.type || 'FINDING',
      title: item.title || 'Uncategorized security item',
      severity: (item.severity || 'MEDIUM').toUpperCase(),
      risk: clamp(item.risk || 0),
      confidence: clamp(item.confidence || 50),
      assetCriticality: clamp(item.assetCriticality || 50),
      ageHours: Number(item.ageHours || 0),
      sla: item.sla || 'ON_TRACK',
      owner: item.owner || 'security',
      status: item.status || 'OPEN',
      source: item.source || 'system',
      createdAt: item.createdAt || new Date().toISOString(),
      organizationId: item.organizationId || this.organizationId,
      metadata: item.metadata || {},
    };

    const score = (
      normalized.risk * 0.3 +
      severityRank[normalized.severity] * 12 +
      normalized.assetCriticality * 0.3 +
      normalized.confidence * 0.2 +
      Math.min(normalized.ageHours * 3, 25)
    );
    normalized.priority = Number(score.toFixed(1));
    this.items.push(normalized);
    this.audit.push({ action: 'INGEST', itemId: normalized.id, at: new Date().toISOString(), organizationId: normalized.organizationId });
    return normalized;
  }

  list() {
    return [...this.items].sort((a, b) => b.priority - a.priority);
  }

  claim(itemId, analyst) {
    const item = this.items.find((entry) => entry.id === itemId);
    if (!item) return null;
    item.status = 'CLAIMED';
    item.owner = analyst || item.owner;
    this.audit.push({ action: 'CLAIM', itemId, analyst, at: new Date().toISOString() });
    return item;
  }

  assign(itemId, owner) {
    const item = this.items.find((entry) => entry.id === itemId);
    if (!item) return null;
    item.owner = owner || item.owner;
    this.audit.push({ action: 'ASSIGN', itemId, owner, at: new Date().toISOString() });
    return item;
  }

  escalate(itemId, target) {
    const item = this.items.find((entry) => entry.id === itemId);
    if (!item) return null;
    item.status = 'ESCALATED';
    item.escalatedTo = target || 'security-manager';
    this.audit.push({ action: 'ESCALATE', itemId, target: item.escalatedTo, at: new Date().toISOString() });
    return item;
  }

  createCase(itemId) {
    const item = this.items.find((entry) => entry.id === itemId);
    if (!item) return null;
    const caseId = createId('case');
    this.audit.push({ action: 'CREATE_CASE', itemId, caseId, at: new Date().toISOString() });
    return { caseId, itemId, status: 'OPEN', owner: item.owner };
  }
}

export class ResponsePlaybook {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.playbooks = new Map();
    this.executions = [];
    this._seed();
  }

  _seed() {
    const templates = [
      'Secret Exposure',
      'Production Secret Exposure',
      'Runtime Secret Exposure',
      'Cloud Credential Exposure',
      'Mass Repository Exposure',
      'Reintroduced Secret',
      'Critical Control Failure',
      'Suspicious Threat Correlation',
      'Cross-Tenant Security Event',
      'Systemic Security Failure',
    ];

    for (const name of templates) {
      this.playbooks.set(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), {
        playbookId: createId('playbook'),
        name,
        steps: ['TRIGGER', 'TRIAGE', 'CONTAINMENT', 'INVESTIGATION', 'REMEDIATION', 'VERIFICATION', 'RECOVERY', 'REVIEW'],
        conditions: [{ field: 'severity', operator: '>=', value: 'HIGH' }],
        actions: ['CREATE_CASE', 'ASSIGN_OWNER', 'REQUEST_APPROVAL', 'TRIGGER_SCAN', 'NOTIFY_TEAM'],
        approvalRequired: name.toLowerCase().includes('production') || name.toLowerCase().includes('cloud') || name.toLowerCase().includes('cross'),
        isBuiltIn: true,
      });
    }
  }

  addPlaybook(playbook) {
    const id = playbook.playbookId || createId('playbook');
    const normalized = {
      ...playbook,
      playbookId: id,
      organizationId: playbook.organizationId || this.organizationId,
      steps: playbook.steps || ['TRIGGER', 'TRIAGE', 'CONTAINMENT', 'INVESTIGATION', 'REMEDIATION', 'VERIFICATION', 'RECOVERY', 'REVIEW'],
      approvalRequired: Boolean(playbook.approvalRequired),
    };
    this.playbooks.set(id, normalized);
    return normalized;
  }

  evaluate(trigger, context = {}) {
    const matching = Array.from(this.playbooks.values()).filter((playbook) => {
      if (!context.severity && !context.type) return false;
      if (context.severity && playbook.conditions?.[0]?.value) {
        return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(String(context.severity).toUpperCase()) || trigger?.toLowerCase().includes(playbook.name.toLowerCase());
      }
      return trigger?.toLowerCase().includes(playbook.name.toLowerCase()) || playbook.name.toLowerCase().includes(String(context.type || '').toLowerCase());
    });

    return matching.map((playbook) => ({
      playbookId: playbook.playbookId,
      name: playbook.name,
      trigger,
      status: 'READY',
      approvalRequired: Boolean(playbook.approvalRequired),
    }));
  }

  run(playbookId, context = {}) {
    const playbook = this.playbooks.get(playbookId) || Array.from(this.playbooks.values()).find((item) => item.name.toLowerCase() === String(playbookId).toLowerCase().replace(/_/g, ' '));
    if (!playbook) return null;
    const execution = {
      executionId: createId('playbook-execution'),
      playbookId: playbook.playbookId,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      context: sanitizeObject(context),
      tasks: playbook.steps.map((step) => ({ step, status: 'PENDING' })),
      approvals: playbook.approvalRequired ? ['SECURITY_MANAGER_APPROVAL'] : [],
    };
    this.executions.push(execution);
    execution.status = 'COMPLETED';
    return execution;
  }

  simulate(playbookId, context = {}) {
    const playbook = this.playbooks.get(playbookId) || Array.from(this.playbooks.values()).find((item) => item.name.toLowerCase() === String(playbookId).toLowerCase().replace(/_/g, ' '));
    if (!playbook) return null;
    return {
      playbookId: playbook.playbookId,
      name: playbook.name,
      simStatus: 'SIMULATED',
      steps: playbook.steps,
      approvalRequired: playbook.approvalRequired,
      summary: `Simulation prepared for ${playbook.name} with context ${sanitizeObject(context)?.severity || 'general'}.`,
    };
  }
}

export class SecuritySLA {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.slas = [];
  }

  defaultDueHours(severity = 'HIGH') {
    const map = { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 };
    return (map[String(severity).toUpperCase()] || 24) * 60 * 60 * 1000;
  }

  createSLA({ entityType, entityId, severity = 'HIGH', owner = 'security', organizationId = this.organizationId, detectedAt = new Date().toISOString() }) {
    const detected = new Date(detectedAt).getTime();
    const dueAt = new Date(detected + this.defaultDueHours(severity)).toISOString();
    const sla = {
      slaId: createId('sla'),
      entityType,
      entityId,
      severity: String(severity).toUpperCase(),
      owner,
      organizationId,
      detectedAt,
      dueAt,
      acknowledgedAt: null,
      resolvedAt: null,
      breachedAt: null,
      pausedAt: null,
      status: 'ON_TRACK',
      elapsedTime: 0,
      remainingTime: this.defaultDueHours(severity),
    };
    this.slas.push(sla);
    return sla;
  }

  evaluate(slaId, now = Date.now()) {
    const sla = this.slas.find((entry) => entry.slaId === slaId);
    if (!sla) return null;
    const detected = new Date(sla.detectedAt).getTime();
    const due = new Date(sla.dueAt).getTime();
    const elapsedTime = Math.max(0, now - detected);
    const remainingTime = Math.max(0, due - now);
    sla.elapsedTime = elapsedTime;
    sla.remainingTime = remainingTime;
    if (sla.resolvedAt) {
      sla.status = 'RESOLVED';
      return sla;
    }
    if (now > due) {
      sla.status = 'BREACHED';
      sla.breachedAt = new Date(now).toISOString();
      return sla;
    }
    if (remainingTime < 0.25 * this.defaultDueHours(sla.severity)) {
      sla.status = 'AT_RISK';
      return sla;
    }
    sla.status = 'ON_TRACK';
    return sla;
  }

  listBreaches() {
    return this.slas.filter((sla) => sla.status === 'BREACHED');
  }
}

export class SecurityVendor {
  constructor({ organizationId = 'default-org', name, category = 'INTEGRATION', criticality = 'MEDIUM', owner = 'security', status = 'ACTIVE', riskScore = 0, reviewFrequency = 'quarterly' }) {
    this.vendorId = createId('vendor');
    this.organizationId = organizationId;
    this.name = name;
    this.category = category;
    this.criticality = String(criticality).toUpperCase();
    this.owner = owner;
    this.status = status;
    this.riskScore = clamp(riskScore);
    this.reviewFrequency = reviewFrequency;
    this.nextReviewAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.createdAt = new Date().toISOString();
  }

  assess({ securityPosture, integrationExposure, incidentHistory, controlHealth, dependencyRisk, dataSensitivity, operationalCriticality }) {
    const score = clamp(
      securityPosture * 0.2 +
      integrationExposure * 0.2 +
      incidentHistory * 0.15 +
      controlHealth * 0.15 +
      dependencyRisk * 0.15 +
      dataSensitivity * 0.1 +
      operationalCriticality * 0.05
    );
    return {
      assessmentId: createId('vendor-assessment'),
      vendorId: this.vendorId,
      riskScore: Number(score.toFixed(1)),
      status: score >= 70 ? 'AT_RISK' : score >= 40 ? 'UNDER_REVIEW' : 'ACTIVE',
      assessedAt: new Date().toISOString(),
      evidence: {
        securityPosture,
        integrationExposure,
        incidentHistory,
        controlHealth,
        dependencyRisk,
        dataSensitivity,
        operationalCriticality,
      },
    };
  }
}

export class SecurityAsset {
  constructor({ organizationId = 'default-org', name, type = 'APPLICATION', environment = 'PRODUCTION', owner = 'platform', team = 'security', criticality = 'HIGH', dataClassification = 'CONFIDENTIAL', internetExposure = false, businessFunction = 'Unknown', lifecycleStatus = 'ACTIVE', tags = [] }) {
    this.assetId = createId('asset');
    this.organizationId = organizationId;
    this.name = name;
    this.type = String(type).toUpperCase();
    this.environment = String(environment).toUpperCase();
    this.owner = owner;
    this.team = team;
    this.criticality = String(criticality).toUpperCase();
    this.dataClassification = String(dataClassification).toUpperCase();
    this.internetExposure = Boolean(internetExposure);
    this.businessFunction = businessFunction;
    this.lifecycleStatus = String(lifecycleStatus).toUpperCase();
    this.tags = tags;
    this.findings = [];
    this.risks = [];
    this.relationships = [];
    this.createdAt = new Date().toISOString();
  }

  attachFinding(findingId) {
    if (!this.findings.includes(findingId)) this.findings.push(findingId);
    return this;
  }

  attachRisk(riskId) {
    if (!this.risks.includes(riskId)) this.risks.push(riskId);
    return this;
  }

  linkRelationship(type, targetId) {
    this.relationships.push({ type, targetId, createdAt: new Date().toISOString() });
    return this;
  }
}

export class SecurityChangeImpactEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.changes = [];
  }

  recordChange({ title, changeType, before, after, organizationId = this.organizationId, affectedEntityIds = [], riskDelta = 0 }) {
    const item = {
      changeId: createId('change'),
      title,
      changeType,
      before: sanitizeObject(before || {}),
      after: sanitizeObject(after || {}),
      organizationId,
      affectedEntityIds,
      riskDelta,
      createdAt: new Date().toISOString(),
      impact: {
        affectedControls: affectedEntityIds.length,
        affectedRequirements: Math.max(1, Math.ceil(affectedEntityIds.length / 2)),
        affectedRisks: Math.max(0, Math.ceil(riskDelta)),
        affectedAssets: Math.max(1, Math.ceil(affectedEntityIds.length / 3)),
        affectedAttackPaths: Math.max(0, Math.ceil(Math.abs(riskDelta) / 2)),
      },
    };
    this.changes.push(item);
    return item;
  }

  analyze(changeId) {
    const change = this.changes.find((entry) => entry.changeId === changeId);
    if (!change) return null;
    return {
      ...change,
      impactSummary: `Change ${change.title} affects ${change.affectedEntityIds.length} entities and increases risk by ${change.riskDelta}.`,
      riskChange: change.riskDelta,
      requiredActions: ['review controls', 'validate evidence', 'notify owners'],
    };
  }
}

export class SecurityDecisionBrief {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
  }

  generate({ risks = [], sla = [], board = {} }) {
    const topRisks = [...risks].sort((a, b) => b.residualRisk - a.residualRisk).slice(0, 5);
    const decisions = topRisks.map((risk) => ({
      decision: risk.status === 'ACCEPTED' ? 'REVIEW ACCEPTANCE' : 'EXECUTIVE APPROVAL REQUIRED',
      reason: `Residual risk ${risk.residualRisk} for ${risk.title} exceeds the organizational tolerance threshold for executive review.`,
      evidence: risk.evidence || [],
      risk: risk.residualRisk,
      expectedImpact: 'Reduced residual risk through control remediation or enforced treatment.',
      alternatives: ['Monitor current exposure', 'Accept the residual risk temporarily', 'Escalate to security board'],
      recommendedAction: risk.treatment === 'ACCEPT' ? 'Review and reauthorize' : 'Remediate and verify control coverage',
    }));

    return {
      boardId: createId('board'),
      generatedAt: new Date().toISOString(),
      decisions,
      topRisks,
      slaSummary: {
        activeBreaches: sla.filter((entry) => entry.status === 'BREACHED').length,
        onTrack: sla.filter((entry) => entry.status === 'ON_TRACK').length,
      },
      board,
    };
  }
}

export class AutomationTemplate {
  constructor({
    name,
    description,
    category = 'SECURITY',
    trigger = 'ON_FINDING',
    conditions = [],
    actions = [],
    approvalRequirements = [],
    requiredPermissions = ['SECURITY_VIEW'],
    riskLevel = 'MEDIUM',
    version = '1.0',
    author = 'system',
    status = 'DRAFT',
  }) {
    this.templateId = createId('automation-template');
    this.name = name;
    this.description = description || '';
    this.category = category;
    this.trigger = trigger;
    this.conditions = conditions;
    this.actions = actions;
    this.approvalRequirements = approvalRequirements;
    this.requiredPermissions = requiredPermissions;
    this.riskLevel = String(riskLevel).toUpperCase();
    this.version = version;
    this.author = author;
    this.status = status;
  }

  validateConfig() {
    const unsafePatterns = [/\b(?:rm\s+-rf|curl\s+.*\|\s*sh|wget\s+.*\|\s*sh|powershell\s+-enc)\b/i, /arbitrary\s+remote\s+execution/i, /credential\s+harvesting/i];
    const actionList = this.actions.join(' ');
    const disallowed = unsafePatterns.some((pattern) => pattern.test(actionList));
    if (disallowed) {
      throw new Error('Automation template contains forbidden execution patterns.');
    }
    const allowlist = ['CREATE_CASE', 'ASSIGN_OWNER', 'REQUEST_APPROVAL', 'NOTIFY_TEAM', 'TRIGGER_SCAN', 'INCREASE_SEVERITY', 'DRY_RUN'];
    const invalid = this.actions.filter((action) => !allowlist.includes(String(action).toUpperCase()));
    if (invalid.length) {
      throw new Error(`Automation template includes non-allowlisted actions: ${invalid.join(', ')}`);
    }
    return { valid: true, actions: this.actions };
  }

  simulate() {
    return {
      templateId: this.templateId,
      dryRun: true,
      status: 'DRY_RUN',
      actions: this.actions,
      requiredPermissions: this.requiredPermissions,
      approvalRequirements: this.approvalRequirements,
    };
  }

  enable() {
    this.status = 'ACTIVE';
    return this;
  }

  disable() {
    this.status = 'DISABLED';
    return this;
  }
}

export class EnterpriseSecurityOperationsPlatform {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.riskRegister = new SecurityRiskRegister({ organizationId });
    this.quantification = new RiskQuantificationEngine({ organizationId });
    this.queue = new SecurityOperationsQueue({ organizationId });
    this.playbooks = new ResponsePlaybook({ organizationId });
    this.sla = new SecuritySLA({ organizationId });
    this.assets = new Map();
    this.vendors = new Map();
    this.changes = new SecurityChangeImpactEngine({ organizationId });
    this.decisions = new SecurityDecisionBrief({ organizationId });
    this.automationTemplates = new Map();
    this.graph = this.riskRegister.graph;
  }

  createRisk(input) {
    const risk = this.riskRegister.createRisk(input);
    const score = this.quantification.calculate({
      likelihood: risk.likelihood || 70,
      impact: risk.impact || 80,
      exposure: 80,
      exploitability: 70,
      assetCriticality: 90,
      threatRelevance: 85,
      controlStrength: 40,
      remediationConfidence: 65,
      exposureDurationDays: 12,
      recurrence: 2,
      attackPathDepth: 4,
      uncertainty: 20,
      existingResidualRisk: risk.residualRisk || 0,
    });
    risk.inherentRisk = score.inherentRisk;
    risk.residualRisk = score.residualRisk;
    risk.confidence = score.riskConfidence;
    risk.updatedAt = new Date().toISOString();
    this.quantification.createSnapshot({ riskId: risk.riskId, score });
    return risk;
  }

  addAsset(input) {
    const asset = new SecurityAsset({ organizationId: input.organizationId || this.organizationId, ...input });
    this.assets.set(asset.assetId, asset);
    this.graph.addNode({ entityType: 'ASSET', entityId: asset.assetId, organizationId: asset.organizationId, label: asset.name, metadata: { type: asset.type, criticality: asset.criticality } });
    return asset;
  }

  addVendor(input) {
    const vendor = new SecurityVendor({ organizationId: input.organizationId || this.organizationId, ...input });
    this.vendors.set(vendor.vendorId, vendor);
    this.graph.addNode({ entityType: 'VENDOR', entityId: vendor.vendorId, organizationId: vendor.organizationId, label: vendor.name, metadata: { category: vendor.category, riskScore: vendor.riskScore } });
    return vendor;
  }

  toOperationsQueue(item) {
    return this.queue.ingest(item);
  }

  createPlaybook(playbook) {
    return this.playbooks.addPlaybook(playbook);
  }

  createSLA(input) {
    return this.sla.createSLA(input);
  }

  createAutomationTemplate(template) {
    const item = new AutomationTemplate(template);
    item.validateConfig();
    this.automationTemplates.set(item.templateId, item);
    return item;
  }

  createDecisionBrief(risks = []) {
    return this.decisions.generate({ risks, sla: this.sla.slas });
  }

  summarize() {
    return {
      organizationId: this.organizationId,
      totalRisks: this.riskRegister.risks.size,
      totalAssets: this.assets.size,
      totalVendors: this.vendors.size,
      queueItems: this.queue.items.length,
      totalPlaybooks: this.playbooks.playbooks.size,
      totalSLA: this.sla.slas.length,
      automationTemplates: this.automationTemplates.size,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const enterpriseSecurityOperationsPlatform = new EnterpriseSecurityOperationsPlatform({ organizationId: 'default-org' });

export default EnterpriseSecurityOperationsPlatform;
