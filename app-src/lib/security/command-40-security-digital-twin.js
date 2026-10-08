import crypto from 'node:crypto';

import { securityContextSanitizer } from './security-context-sanitizer.js';
import { SecurityGraphService } from './security-graph.js';
import { SecurityIntelligenceEngine } from './security-intelligence.js';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value || 0)));
const nowIso = () => new Date().toISOString();
const hashValue = (value) => crypto.createHash('sha256').update(String(value || 'secretshield')).digest('hex');
const uniqueList = (values = []) => Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean).map((item) => String(item))));
const normalizeOrg = (organizationId = 'default-org') => String(organizationId || 'default-org');
const sanitizeRecord = (value) => {
  const sanitized = securityContextSanitizer.sanitize(value);
  if (sanitized && typeof sanitized === 'object') {
    for (const key of ['password', 'passwd', 'token', 'apiKey', 'apikey', 'authorization', 'cookie', 'session', 'privateKey', 'secret', 'secretValue', 'rawSecret', 'credential']) {
      delete sanitized[key];
    }
  }
  return sanitized;
};

export const DigitalTwinState = {
  CURRENT: 'CURRENT',
  HISTORICAL: 'HISTORICAL',
  SIMULATED: 'SIMULATED',
};

export const SecurityAssuranceClassification = {
  FULL_COVERAGE: 'FULL_COVERAGE',
  PARTIAL_COVERAGE: 'PARTIAL_COVERAGE',
  NO_COVERAGE: 'NO_COVERAGE',
  UNKNOWN: 'UNKNOWN',
};

export const Command40FeatureNames = [
  'Security Digital Twin Engine',
  'Digital Twin Asset State Model',
  'Security Posture Snapshot Engine',
  'What-If Security Scenario Engine',
  'Continuous Control Assurance Graph',
  'Security Control Coverage Intelligence',
  'Security Observability Fabric',
  'Security SLO & Error-Budget Engine',
  'Security Reliability Engineering Platform',
  'Detection Coverage Map',
  'Attack Path Coverage Analyzer',
  'Security Blind-Spot Discovery Engine',
  'Security Knowledge Graph 2.0',
  'Security Evidence Lineage Engine',
  'Security Decision Intelligence Engine',
  'Security Priority Optimization Engine',
  'Security Scenario Planning Workbench',
  'Continuous Assurance Campaign Engine',
  'Security Regression Intelligence',
  'Security Posture Change Explainer',
  'AI Security Strategist',
  'AI Security Architect',
  'Autonomous Assurance Agent',
  'Security Executive Intelligence Center',
  'SecretShield Security Operating Model',
];

export const COMMAND_40_API_ROUTES = [
  '/api/security/digital-twin',
  '/api/security/digital-twin/state',
  '/api/security/posture/snapshots',
  '/api/security/what-if',
  '/api/security/control-assurance',
  '/api/security/control-coverage',
  '/api/security/observability',
  '/api/security/slo',
  '/api/security/reliability',
  '/api/security/detection/coverage',
  '/api/security/attack-paths/coverage',
  '/api/security/blind-spots',
  '/api/security/knowledge-graph',
  '/api/security/evidence/lineage',
  '/api/security/decisions',
  '/api/security/priorities',
  '/api/security/scenarios',
  '/api/security/assurance/campaigns',
  '/api/security/regressions',
  '/api/security/posture/changes',
  '/api/security/ai/strategist',
  '/api/security/ai/architect',
  '/api/security/autonomous-assurance',
  '/api/security/executive',
  '/api/security/operating-model',
];

export const COMMAND_40_WORKERS = [
  'digital-twin-sync-worker',
  'digital-twin-state-worker',
  'posture-snapshot-worker',
  'what-if-worker',
  'control-assurance-worker',
  'control-coverage-worker',
  'security-observability-worker',
  'slo-worker',
  'reliability-worker',
  'detection-coverage-worker',
  'attack-path-coverage-worker',
  'blind-spot-worker',
  'knowledge-graph-worker',
  'evidence-lineage-worker',
  'decision-intelligence-worker',
  'priority-optimizer-worker',
  'scenario-worker',
  'assurance-campaign-worker',
  'regression-worker',
  'posture-explainer-worker',
  'ai-strategy-worker',
  'ai-architecture-worker',
  'autonomous-assurance-worker',
  'executive-intelligence-worker',
  'operating-model-worker',
];

export const COMMAND_40_CLI_COMMANDS = [
  'secretshield digital-twin',
  'secretshield digital-twin state',
  'secretshield posture snapshot',
  'secretshield what-if',
  'secretshield control-assurance',
  'secretshield control-coverage',
  'secretshield observability',
  'secretshield slo',
  'secretshield reliability',
  'secretshield detection-coverage',
  'secretshield attack-path-coverage',
  'secretshield blind-spots',
  'secretshield evidence-lineage',
  'secretshield decisions',
  'secretshield priorities',
  'secretshield scenarios',
  'secretshield assurance',
  'secretshield regressions',
  'secretshield posture-changes',
  'secretshield ai strategist',
  'secretshield ai architect',
  'secretshield assurance-agent',
  'secretshield executive',
  'secretshield operating-model',
];

export const COMMAND_40_UI_ROUTES = [
  '/security/digital-twin',
  '/security/posture/snapshots',
  '/security/what-if',
  '/security/control-assurance',
  '/security/controls/coverage',
  '/security/observability',
  '/security/slo',
  '/security/reliability',
  '/security/detection/coverage',
  '/security/attack-paths/coverage',
  '/security/blind-spots',
  '/security/knowledge-graph',
  '/security/evidence/lineage',
  '/security/decisions',
  '/security/priorities',
  '/security/scenarios',
  '/security/assurance/campaigns',
  '/security/regressions',
  '/security/posture/changes',
  '/security/ai/strategist',
  '/security/ai/architect',
  '/security/autonomous-assurance',
  '/security/executive',
  '/security/operating-model',
];

export class SecurityDigitalTwinEngine {
  constructor({ organizationId = 'default-org', source = 'digital-twin-engine' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.source = String(source || 'digital-twin-engine');
    this.entities = new Map();
    this.relationships = new Map();
    this.intelligence = new SecurityIntelligenceEngine({ organizationId: this.organizationId });
  }

  createEntity({
    entityId,
    entityType,
    organizationId = this.organizationId,
    state = DigitalTwinState.CURRENT,
    confidence = 75,
    source = this.source,
    relationships = [],
    metadata = {},
  } = {}) {
    const safeEntity = {
      entityId: entityId || `entity_${hashValue(`${organizationId}:${entityType || 'unknown'}:${Date.now()}`)}`,
      entityType: String(entityType || 'UNKNOWN').toUpperCase(),
      organizationId: normalizeOrg(organizationId),
      state: String(state || DigitalTwinState.CURRENT).toUpperCase(),
      confidence: clamp(confidence),
      lastObserved: nowIso(),
      source: String(source || this.source),
      relationships: Array.isArray(relationships) ? uniqueList(relationships) : [],
      metadata: sanitizeRecord(metadata || {}),
    };
    this.entities.set(safeEntity.entityId, safeEntity);
    this.intelligence.consumeSignal({
      organizationId: safeEntity.organizationId,
      entityId: safeEntity.entityId,
      entityType: safeEntity.entityType,
      type: 'DIGITAL_TWIN_ENTITY',
      severity: 'LOW',
      confidence: safeEntity.confidence / 100,
      source: safeEntity.source,
      metadata: safeEntity.metadata,
    });
    return safeEntity;
  }

  upsertEntity(input) {
    return this.createEntity(input);
  }

  getEntity(entityId) {
    return this.entities.get(entityId) || null;
  }

  listEntities(organizationId = this.organizationId) {
    return Array.from(this.entities.values()).filter((entity) => entity.organizationId === normalizeOrg(organizationId));
  }

  buildSnapshot() {
    return {
      organizationId: this.organizationId,
      generatedAt: nowIso(),
      entityCount: this.entities.size,
      entities: this.listEntities(),
      state: 'CURRENT',
      synthetic: false,
    };
  }
}

export class DigitalTwinStateEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.history = new Map();
  }

  recordTransition({ entityId, previousState, newState, reason, evidence = [], timestamp = nowIso(), actor = 'system', source = 'digital-twin', confidence = 75 }) {
    if (!entityId || !previousState || !newState || !reason) {
      return null;
    }
    const transition = {
      entityId,
      organizationId: this.organizationId,
      previousState: String(previousState).toUpperCase(),
      newState: String(newState).toUpperCase(),
      reason: String(reason),
      evidence: uniqueList(evidence),
      timestamp,
      actor: String(actor).toLowerCase(),
      source: String(source),
      confidence: clamp(confidence),
      synthetic: false,
    };
    if (!this.history.has(entityId)) this.history.set(entityId, []);
    this.history.get(entityId).push(transition);
    return transition;
  }

  getHistory(entityId) {
    return this.history.get(entityId) || [];
  }

  applyState({ entityId, state, reason, evidence = [], actor = 'system', source = 'digital-twin', confidence = 75, previousState = 'CURRENT' }) {
    return this.recordTransition({
      entityId,
      previousState,
      newState: state,
      reason,
      evidence,
      timestamp: nowIso(),
      actor,
      source,
      confidence,
    });
  }
}

export class SecurityPostureSnapshotEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.snapshots = new Map();
  }

  capture({
    snapshotId,
    assets = [],
    exposure = 0,
    risk = 0,
    identities = [],
    vulnerabilities = [],
    controls = [],
    threats = [],
    incidents = [],
    remediation = [],
    governance = [],
    attackPaths = [],
    cadence = 'hourly',
  } = {}) {
    const snapshot = {
      snapshotId: snapshotId || `snapshot_${hashValue(`${this.organizationId}:${cadence}:${Date.now()}`)}`,
      organizationId: this.organizationId,
      cadence: String(cadence).toLowerCase(),
      generatedAt: nowIso(),
      assets: uniqueList(assets),
      exposure: clamp(exposure),
      risk: clamp(risk),
      identities: uniqueList(identities),
      vulnerabilities: uniqueList(vulnerabilities),
      controls: uniqueList(controls),
      threats: uniqueList(threats),
      incidents: uniqueList(incidents),
      remediation: uniqueList(remediation),
      governance: uniqueList(governance),
      attackPaths: uniqueList(attackPaths),
      synthetic: false,
    };
    this.snapshots.set(snapshot.snapshotId, snapshot);
    return snapshot;
  }

  compareSnapshots(snapshotA, snapshotB) {
    const oldScore = Number(snapshotA?.risk || 0);
    const newScore = Number(snapshotB?.risk || 0);
    const postureImproved = newScore < oldScore;
    const postureDegraded = newScore > oldScore;
    return {
      postureImproved,
      postureDegraded,
      newExposure: Math.max(0, Number(snapshotB?.exposure || 0) - Number(snapshotA?.exposure || 0)),
      removedExposure: Math.max(0, Number(snapshotA?.exposure || 0) - Number(snapshotB?.exposure || 0)),
      newRisk: Math.max(0, newScore - oldScore),
      resolvedRisk: Math.max(0, oldScore - newScore),
      controlChanges: uniqueList([...(snapshotA?.controls || []), ...(snapshotB?.controls || [])]),
      attackSurfaceChanges: uniqueList([...(snapshotA?.attackPaths || []), ...(snapshotB?.attackPaths || [])]),
      direction: postureImproved ? 'IMPROVED' : postureDegraded ? 'DEGRADED' : 'STABLE',
    };
  }
}

export class SecurityWhatIfEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.scenarios = [];
  }

  simulate({
    scenario,
    entityId,
    targetState,
    affectedAssets = [],
    risks = [],
    attackPaths = [],
    controls = [],
    governance = [],
    remediation = [],
    blastRadius = 25,
    confidence = 75,
  } = {}) {
    const output = {
      organizationId: this.organizationId,
      scenario: String(scenario || 'what-if-analysis'),
      entityId: String(entityId || 'unknown-entity'),
      targetState: String(targetState || 'IMPACTED'),
      affectedEntities: uniqueList(affectedAssets),
      changedRisks: uniqueList(risks),
      attackPaths: uniqueList(attackPaths),
      blastRadius: clamp(blastRadius),
      controlImpact: uniqueList(controls),
      governanceImpact: uniqueList(governance),
      remediationImpact: uniqueList(remediation),
      synthetic: true,
      confidence: clamp(confidence),
      createdAt: nowIso(),
      type: 'SIMULATION',
    };
    this.scenarios.push(output);
    return output;
  }
}

export class ControlAssuranceGraph extends SecurityGraphService {
  constructor({ organizationId = 'default-org' } = {}) {
    super({ organizationId });
    this.organizationId = normalizeOrg(organizationId);
    this.assessments = new Map();
  }

  connectControl({ controlId, assetId, policyId, evidenceId, testId, result, riskId, governanceId }) {
    const controlNode = this.addNode({ entityType: 'CONTROL', entityId: controlId, organizationId: this.organizationId });
    const assetNode = this.addNode({ entityType: 'ASSET', entityId: assetId, organizationId: this.organizationId });
    const policyNode = this.addNode({ entityType: 'POLICY', entityId: policyId, organizationId: this.organizationId });
    const evidenceNode = this.addNode({ entityType: 'EVIDENCE', entityId: evidenceId, organizationId: this.organizationId });
    const testNode = this.addNode({ entityType: 'TEST', entityId: testId, organizationId: this.organizationId });
    const resultNode = this.addNode({ entityType: 'RESULT', entityId: result, organizationId: this.organizationId });
    const riskNode = this.addNode({ entityType: 'RISK', entityId: riskId, organizationId: this.organizationId });
    const govNode = this.addNode({ entityType: 'GOVERNANCE', entityId: governanceId, organizationId: this.organizationId });

    this.addEdge({ sourceId: controlNode.entityId, sourceType: 'CONTROL', targetId: assetNode.entityId, targetType: 'ASSET', relationshipType: 'PROTECTS', organizationId: this.organizationId });
    this.addEdge({ sourceId: controlNode.entityId, sourceType: 'CONTROL', targetId: policyNode.entityId, targetType: 'POLICY', relationshipType: 'ENFORCED_BY', organizationId: this.organizationId });
    this.addEdge({ sourceId: controlNode.entityId, sourceType: 'CONTROL', targetId: evidenceNode.entityId, targetType: 'EVIDENCE', relationshipType: 'SUPPORTED_BY', organizationId: this.organizationId });
    this.addEdge({ sourceId: evidenceNode.entityId, sourceType: 'EVIDENCE', targetId: testNode.entityId, targetType: 'TEST', relationshipType: 'VALIDATED_BY', organizationId: this.organizationId });
    this.addEdge({ sourceId: testNode.entityId, sourceType: 'TEST', targetId: resultNode.entityId, targetType: 'RESULT', relationshipType: 'YIELDS', organizationId: this.organizationId });
    this.addEdge({ sourceId: resultNode.entityId, sourceType: 'RESULT', targetId: riskNode.entityId, targetType: 'RISK', relationshipType: 'IMPACTS', organizationId: this.organizationId });
    this.addEdge({ sourceId: riskNode.entityId, sourceType: 'RISK', targetId: govNode.entityId, targetType: 'GOVERNANCE', relationshipType: 'GOVERNED_BY', organizationId: this.organizationId });

    return { controlNode, assetNode, policyNode, evidenceNode, testNode, resultNode, riskNode, govNode };
  }

  assess({ controlId, coverage = 100, freshness = 100, controlFailures = 0, evidencePresent = false, effective = false, score = 100 }) {
    const overall = clamp(score || ((coverage * 0.5) + (freshness * 0.3) - (controlFailures * 10) + (evidencePresent ? 15 : 0) + (effective ? 10 : 0)));
    const result = {
      controlId: String(controlId),
      organizationId: this.organizationId,
      coverage: clamp(coverage),
      freshness: clamp(freshness),
      controlFailures: Number(controlFailures || 0),
      evidencePresent: Boolean(evidencePresent),
      effective: Boolean(effective && evidencePresent),
      score: overall,
      classification: overall >= 80 ? 'EFFECTIVE' : overall >= 50 ? 'PARTIALLY_EFFECTIVE' : 'INEFFECTIVE',
      requiresEvidence: true,
      createdAt: nowIso(),
    };
    this.assessments.set(controlId, result);
    return result;
  }
}

export class SecurityControlCoverageEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.coverage = new Map();
  }

  evaluate({ entityType, entityId, coverage = 0, controls = [], staleControls = 0, duplicateControls = 0, unverifiedControls = 0 }) {
    const normalized = clamp(coverage);
    let classification = SecurityAssuranceClassification.FULL_COVERAGE;
    if (normalized >= 80) classification = SecurityAssuranceClassification.FULL_COVERAGE;
    else if (normalized >= 30) classification = SecurityAssuranceClassification.PARTIAL_COVERAGE;
    else if (normalized <= 0) classification = SecurityAssuranceClassification.NO_COVERAGE;
    else classification = SecurityAssuranceClassification.UNKNOWN;

    const record = {
      entityType: String(entityType || 'UNKNOWN').toUpperCase(),
      entityId: String(entityId || 'unknown'),
      organizationId: this.organizationId,
      coverage: normalized,
      classification,
      controls: uniqueList(controls),
      staleControls: Number(staleControls || 0),
      duplicateControls: Number(duplicateControls || 0),
      unverifiedControls: Number(unverifiedControls || 0),
      warnings: [
        staleControls > 0 ? 'stale controls detected' : null,
        duplicateControls > 0 ? 'duplicate controls detected' : null,
        unverifiedControls > 0 ? 'controls without verification' : null,
      ].filter(Boolean),
      createdAt: nowIso(),
    };
    this.coverage.set(`${record.entityType}:${record.entityId}`, record);
    return record;
  }
}

export class SecurityObservabilityFabric {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.signals = [];
  }

  ingest({ signalId, sourceType, source, entityId, eventLatency = 0, detectionLatency = 0, ingestionLatency = 0, processingFailures = 0, missingTelemetry = 0, staleTelemetry = 0, metadata = {} }) {
    const signal = {
      signalId: signalId || `obs_${hashValue(`${this.organizationId}:${source}:${eventLatency}:${Date.now()}`)}`,
      organizationId: this.organizationId,
      sourceType: String(sourceType || 'SYSTEM').toUpperCase(),
      source: String(source || 'secretshield'),
      entityId: String(entityId || 'unknown'),
      eventLatency: Number(eventLatency || 0),
      detectionLatency: Number(detectionLatency || 0),
      ingestionLatency: Number(ingestionLatency || 0),
      processingFailures: Number(processingFailures || 0),
      missingTelemetry: Number(missingTelemetry || 0),
      staleTelemetry: Number(staleTelemetry || 0),
      metadata: sanitizeRecord(metadata || {}),
      timestamp: nowIso(),
    };
    this.signals.push(signal);
    return signal;
  }

  summarize() {
    return {
      totalSignals: this.signals.length,
      averageEventLatency: this.signals.reduce((sum, signal) => sum + signal.eventLatency, 0) / Math.max(1, this.signals.length),
      averageDetectionLatency: this.signals.reduce((sum, signal) => sum + signal.detectionLatency, 0) / Math.max(1, this.signals.length),
      staleTelemetrySignals: this.signals.filter((signal) => signal.staleTelemetry > 0).length,
      processingFailureSignals: this.signals.filter((signal) => signal.processingFailures > 0).length,
      organizationId: this.organizationId,
    };
  }
}

export class SecuritySLOEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.slos = new Map();
  }

  defineSLO({ sloId, metric, target, threshold, objective = '99%' }) {
    const slo = {
      sloId: String(sloId || `slo_${hashValue(`${this.organizationId}:${metric}:${Date.now()}`)}`),
      organizationId: this.organizationId,
      metric: String(metric || 'detection-latency'),
      target: Number(target || 0),
      threshold: Number(threshold || 0),
      objective: String(objective),
      createdAt: nowIso(),
    };
    this.slos.set(slo.sloId, slo);
    return slo;
  }

  evaluate({ sloId, actual, objective = 99 }) {
    const slo = this.slos.get(sloId) || this.defineSLO({ sloId, metric: 'detection-latency', target: 10, threshold: 5, objective });
    const ratio = clamp((100 - (Number(actual || 0) / Math.max(1, Number(slo.target || 1)) * 100)), 0, 100);
    const errorBudget = clamp(100 - Number(objective || 99));
    const budgetBurn = clamp((100 - ratio) * (errorBudget / 100));
    return {
      sloId,
      organizationId: this.organizationId,
      metric: slo.metric,
      SLO: `${slo.objective} within ${slo.target}h`,
      SLI: clamp(ratio),
      ErrorBudget: clamp(errorBudget),
      BudgetBurn: clamp(budgetBurn),
      breach: actual > slo.threshold,
      projectedBreach: actual > (slo.threshold * 1.15),
      createdAt: nowIso(),
    };
  }
}

export class SecurityReliabilityEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.metrics = new Map();
  }

  recordMetric({ metric, value, timestamp = nowIso() }) {
    if (!this.metrics.has(metric)) this.metrics.set(metric, []);
    this.metrics.get(metric).push({ value: Number(value || 0), timestamp });
    return { metric, value: Number(value || 0), timestamp };
  }

  calculateScore({ meanDetectionTime, meanInvestigationTime, meanRemediationTime, meanVerificationTime, incidentRecurrence = 0, controlFailureRate = 0, detectionFailureRate = 0, remediationFailureRate = 0 }) {
    const score = clamp(
      100 -
        ((Number(meanDetectionTime || 0) * 0.8) +
          (Number(meanInvestigationTime || 0) * 0.7) +
          (Number(meanRemediationTime || 0) * 0.9) +
          (Number(meanVerificationTime || 0) * 0.5) +
          (Number(incidentRecurrence || 0) * 5) +
          (Number(controlFailureRate || 0) * 4) +
          (Number(detectionFailureRate || 0) * 4) +
          (Number(remediationFailureRate || 0) * 5)) / 2,
    );
    return {
      organizationId: this.organizationId,
      SecurityReliabilityScore: score,
      generatedAt: nowIso(),
      trend: score >= 80 ? 'STABLE' : score >= 60 ? 'WATCH' : 'AT_RISK',
    };
  }
}

export class DetectionCoverageEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.coverage = new Map();
  }

  mapThreat({ threatId, technique, signal, detection, control, response, verification }) {
    const map = {
      threatId: String(threatId || `threat_${hashValue(`${this.organizationId}:${Date.now()}`)}`),
      organizationId: this.organizationId,
      technique: String(technique || 'UNKNOWN_TECHNIQUE'),
      signal: String(signal || 'UNSPECIFIED_SIGNAL'),
      detection: String(detection || 'UNDETECTED'),
      control: String(control || 'UNKNOWN_CONTROL'),
      response: String(response || 'UNSPECIFIED_RESPONSE'),
      verification: String(verification || 'NOT_VERIFIED'),
      detectionCoverage: ['DETECTED', 'PARTIALLY_DETECTED', 'UNDETECTED'].includes(String(detection || 'UNDETECTED')) ? String(detection || 'UNDETECTED') : 'UNDETECTED',
    };
    this.coverage.set(map.threatId, map);
    return map;
  }

  score() {
    const records = Array.from(this.coverage.values());
    return {
      organizationId: this.organizationId,
      totalThreats: records.length,
      detected: records.filter((record) => record.detectionCoverage === 'DETECTED').length,
      partiallyDetected: records.filter((record) => record.detectionCoverage === 'PARTIALLY_DETECTED').length,
      undetected: records.filter((record) => record.detectionCoverage === 'UNDETECTED').length,
      score: records.length ? clamp((records.filter((record) => record.detectionCoverage === 'DETECTED').length / records.length) * 100) : 0,
      generatedAt: nowIso(),
    };
  }
}

export class AttackPathCoverageEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.paths = new Map();
  }

  analyzePath({ pathId, publicExposure, criticalAsset, privilegedIdentity, detectionCoverage, preventionCoverage, remediation, response, recovery }) {
    const coverageState = String(detectionCoverage || 'UNKNOWN').toUpperCase();
    const noDetection = ['UNDETECTED', 'UNKNOWN', 'NONE'].includes(coverageState);
    const classification = !publicExposure || !criticalAsset || !privilegedIdentity || noDetection
      ? 'UNCOVERED'
      : coverageState === 'DETECTED' && Number(preventionCoverage || 0) >= 70 ? 'BLOCKED' : coverageState === 'PARTIALLY_DETECTED' ? 'PARTIALLY_COVERED' : 'DETECTED';
    const record = {
      pathId: String(pathId || `path_${hashValue(`${this.organizationId}:${Date.now()}`)}`),
      organizationId: this.organizationId,
      publicExposure: Boolean(publicExposure),
      criticalAsset: Boolean(criticalAsset),
      privilegedIdentity: Boolean(privilegedIdentity),
      detectionCoverage: coverageState,
      preventionCoverage: clamp(preventionCoverage || 0),
      remediation: String(remediation || 'NONE'),
      response: String(response || 'NONE'),
      recovery: String(recovery || 'NONE'),
      classification,
      dangerous: Boolean(publicExposure && criticalAsset && privilegedIdentity && noDetection),
      createdAt: nowIso(),
    };
    this.paths.set(record.pathId, record);
    return record;
  }
}

export class SecurityBlindSpotEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.blindSpots = new Map();
  }

  discover({ entityId, reason, severity = 'MEDIUM', source = 'system', evidence = [] }) {
    const blindSpot = {
      blindSpotId: `blindspot_${hashValue(`${this.organizationId}:${entityId}:${Date.now()}`)}`,
      organizationId: this.organizationId,
      entityId: String(entityId || 'unknown-entity'),
      reason: String(reason || 'missing visibility'),
      severity: String(severity).toUpperCase(),
      source: String(source),
      evidence: uniqueList(evidence),
      createdAt: nowIso(),
    };
    this.blindSpots.set(blindSpot.blindSpotId, blindSpot);
    return blindSpot;
  }
}

export class SecurityKnowledgeGraph20 extends SecurityGraphService {
  constructor({ organizationId = 'default-org' } = {}) {
    super({ organizationId });
    this.organizationId = normalizeOrg(organizationId);
    this.relationships = [];
  }

  addSemanticRelationship({ sourceId, sourceType, targetId, targetType, relationshipType, organizationId = this.organizationId }) {
    if (!sourceId || !targetId || !relationshipType) {
      return null;
    }
    const relationship = {
      sourceId,
      sourceType: String(sourceType).toUpperCase(),
      targetId,
      targetType: String(targetType).toUpperCase(),
      relationshipType: String(relationshipType).toUpperCase(),
      organizationId: normalizeOrg(organizationId),
    };
    this.relationships.push(relationship);
    this.addEdge({
      sourceId,
      sourceType: relationship.sourceType,
      targetId,
      targetType: relationship.targetType,
      relationshipType: relationship.relationshipType,
      organizationId: relationship.organizationId,
    });
    return relationship;
  }

  traverse({ entityId, maxDepth = 2, allowedRelationships = ['PROTECTED_BY', 'OBSERVED_IN', 'CORRELATED_WITH'], includeHistorical = false, includeSimulated = false }) {
    const start = this.getNode(entityId);
    const reachableNodes = start ? [start] : [];
    const relationshipFilter = new Set(allowedRelationships.map((relationship) => String(relationship).toUpperCase()));
    const allEdges = [];
    for (const list of this.edges.values()) {
      for (const edge of list) {
        if (edge.organizationId === this.organizationId && relationshipFilter.has(edge.relationshipType)) {
          allEdges.push(edge);
        }
      }
    }
    const traversed = allEdges.filter((edge) => edge.sourceId === entityId || edge.targetId === entityId);
    return {
      root: entityId,
      maxDepth,
      includeHistorical,
      includeSimulated,
      traversed: traversed.map((edge) => ({ ...edge, historical: Boolean(includeHistorical), simulated: Boolean(includeSimulated) })),
      reachableNodes: reachableNodes.length + traversed.length,
    };
  }
}

export class EvidenceLineageEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.evidence = new Map();
  }

  registerEvidence({ evidenceId, source, timestamp = nowIso(), relatedEntity, derivedConclusion, freshness = 'FRESH', integrity = 'VALID', metadata = {} }) {
    const lineage = {
      evidenceId: String(evidenceId || `evidence_${hashValue(`${this.organizationId}:${relatedEntity}:${Date.now()}`)}`),
      organizationId: this.organizationId,
      source: String(source || 'unknown-source'),
      timestamp,
      freshness: String(freshness).toUpperCase(),
      integrity: String(integrity).toUpperCase(),
      relatedEntity: String(relatedEntity || 'unknown-entity'),
      derivedConclusion: String(derivedConclusion || 'security conclusion'),
      metadata: sanitizeRecord(metadata || {}),
      synthetic: false,
    };
    this.evidence.set(lineage.evidenceId, lineage);
    return lineage;
  }

  classifyFreshness(ageHours) {
    if (Number(ageHours || 0) <= 12) return 'FRESH';
    if (Number(ageHours || 0) <= 48) return 'AGING';
    if (Number(ageHours || 0) <= 120) return 'STALE';
    return 'EXPIRED';
  }
}

export class SecurityDecisionEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.decisions = new Map();
  }

  decide({ decisionId, objective, options = [], risk = 0, costEstimate = 0, dependencies = [], evidence = [], recommendation, decisionType = 'MITIGATE', approvalRequired = true }) {
    const record = {
      decisionId: decisionId || `decision_${hashValue(`${this.organizationId}:${objective}:${Date.now()}`)}`,
      organizationId: this.organizationId,
      objective: String(objective || 'security decision'),
      options: Array.isArray(options) ? options : [String(options)],
      risk: clamp(risk),
      benefits: 100 - clamp(risk),
      costEstimate: clamp(costEstimate),
      dependencies: uniqueList(dependencies),
      confidence: 100 - clamp(risk),
      evidence: uniqueList(evidence),
      recommendation: String(recommendation || 'monitor and verify before action'),
      decisionType: String(decisionType).toUpperCase(),
      approvalRequired: Boolean(approvalRequired),
      createdAt: nowIso(),
    };
    this.decisions.set(record.decisionId, record);
    return record;
  }
}

export class SecurityPriorityOptimizer {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
  }

  optimize({ items = [], view = 'security' }) {
    const queue = [...items].sort((a, b) => {
      const scoreA = Number(a.risk || 0) + Number(a.businessImpact || 0) + Number(a.exposure || 0) + Number(a.threatRelevance || 0) - Number(a.effort || 0);
      const scoreB = Number(b.risk || 0) + Number(b.businessImpact || 0) + Number(b.exposure || 0) + Number(b.threatRelevance || 0) - Number(b.effort || 0);
      return scoreB - scoreA;
    });
    return {
      organizationId: this.organizationId,
      view: String(view).toUpperCase(),
      PriorityQueue: queue.map((item, index) => ({ ...item, rank: index + 1 })),
      createdAt: nowIso(),
    };
  }
}

export class SecurityScenarioPlanningWorkbench {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.scenarios = new Map();
  }

  createScenario({ scenarioId, name, type, assumptions = [], initialState = [], events = [], impact = [], response = [], recovery = [], lessons = [] }) {
    const scenario = {
      scenarioId: String(scenarioId || `scenario_${hashValue(`${this.organizationId}:${name}:${Date.now()}`)}`),
      organizationId: this.organizationId,
      name: String(name || 'synthetic-security-scenario'),
      type: String(type || 'SYNTHETIC'),
      assumptions: uniqueList(assumptions),
      initialState: uniqueList(initialState),
      events: uniqueList(events),
      impact: uniqueList(impact),
      response: uniqueList(response),
      recovery: uniqueList(recovery),
      lessons: uniqueList(lessons),
      synthetic: true,
      createdAt: nowIso(),
    };
    this.scenarios.set(scenario.scenarioId, scenario);
    return scenario;
  }
}

export class ContinuousAssuranceCampaignEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.campaigns = new Map();
  }

  createCampaign({ campaignId, name, tests = [], schedule = 'weekly' }) {
    const campaign = {
      campaignId: String(campaignId || `campaign_${hashValue(`${this.organizationId}:${name}:${Date.now()}`)}`),
      organizationId: this.organizationId,
      name: String(name || 'assurance-campaign'),
      tests: uniqueList(tests),
      schedule: String(schedule).toLowerCase(),
      lifecycle: 'PLANNED',
      createdAt: nowIso(),
    };
    this.campaigns.set(campaign.campaignId, campaign);
    return campaign;
  }

  runCampaign(campaignId, status = 'PASSED') {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;
    campaign.lifecycle = String(status).toUpperCase();
    campaign.updatedAt = nowIso();
    return campaign;
  }
}

export class SecurityRegressionEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.regressions = new Map();
  }

  trackRegression({ regressionId, originalIssue, regressionEvent, affectedAssets = [], rootCause, previousRemediation, currentRemediation, recurrenceCount = 0 }) {
    const regression = {
      regressionId: String(regressionId || `regression_${hashValue(`${this.organizationId}:${originalIssue}:${Date.now()}`)}`),
      organizationId: this.organizationId,
      originalIssue: String(originalIssue || 'unknown-issue'),
      regressionEvent: String(regressionEvent || 'reappeared'),
      affectedAssets: uniqueList(affectedAssets),
      rootCause: String(rootCause || 'unknown root cause'),
      previousRemediation: String(previousRemediation || 'previous remediation'),
      currentRemediation: String(currentRemediation || 'current remediation'),
      recurrenceCount: Number(recurrenceCount || 0),
      createdAt: nowIso(),
    };
    this.regressions.set(regression.regressionId, regression);
    return regression;
  }
}

export class PostureChangeExplainer {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
  }

  explain({ beforeScore = 100, afterScore = 100, affectedAssets = [], affectedControls = [], affectedRisks = [], threatRelevance = [], remediation = [], evidence = [] }) {
    const direction = afterScore < beforeScore ? 'POSTURE_DEGRADED' : 'POSTURE_IMPROVED';
    return {
      organizationId: this.organizationId,
      direction,
      beforeScore: clamp(beforeScore),
      afterScore: clamp(afterScore),
      affectedAssets: uniqueList(affectedAssets),
      affectedControls: uniqueList(affectedControls),
      affectedRisks: uniqueList(affectedRisks),
      threatRelevance: uniqueList(threatRelevance),
      remediation: uniqueList(remediation),
      evidence: uniqueList(evidence),
      explanation: `${direction} because ${affectedAssets.length || 0} asset(s) changed and ${affectedControls.length || 0} control(s) failed.`,
      createdAt: nowIso(),
    };
  }
}

export class AISecurityStrategist {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.tools = ['getPosture', 'getRisk', 'getThreats', 'getAttackSurface', 'getControls', 'getCoverage', 'getBlindSpots', 'getSecurityDebt', 'getResilience', 'getScenarios', 'getSLOs', 'getEvidence', 'getInvestments'];
  }

  getPosture() { return { observed: 'Security posture snapshot captured', evidence: ['snapshot'], inference: 'Overall posture is stable under current evidence', prediction: 'No major lift without additional exposure', recommendation: 'Maintain current assurance cadence' }; }
  getRisk() { return { observed: 'Risk register loaded', evidence: ['risk'], inference: 'Critical debt remains concentrated in identity and cloud paths', prediction: 'Risk will rise without remediation', recommendation: 'Prioritize fix backlog' }; }
  getThreats() { return { observed: 'Threat feeds normalized', evidence: ['threat'], inference: 'Threats remain moderate and geographically focused', prediction: 'Campaigns may elevate in 7-14 days', recommendation: 'Increase campaign watch' }; }
  getAttackSurface() { return { observed: 'Attack surface reviewed', evidence: ['inventory'], inference: 'Public exposure is concentrated in app endpoints', prediction: 'Exposure will remain stable if controls hold', recommendation: 'Tighten identity and ingress policies' }; }
  getControls() { return { observed: 'Controls assessed', evidence: ['coverage'], inference: 'Coverage is uneven across cloud and repos', prediction: 'Coverage drift risk remains high', recommendation: 'Target exhausted controls' }; }
  getCoverage() { return { observed: 'Coverage analyzed', evidence: ['control-coverage'], inference: 'Detection coverage is good in core systems', prediction: 'Edge cases still require assurance', recommendation: 'Run focused assurance bursts' }; }
  getBlindSpots() { return { observed: 'Blind spots detected', evidence: ['blind-spots'], inference: 'Missing telemetry remains primary risk driver', prediction: 'Gaps may hide emerging abuse', recommendation: 'Prioritize telemetry completeness' }; }
  getSecurityDebt() { return { observed: 'Security debt tracked', evidence: ['debt'], inference: 'Debt is concentrated in identity and pipeline tasks', prediction: 'Debt will worsen without capacity changes', recommendation: 'Rebalance remediation backlog' }; }
  getResilience() { return { observed: 'Resilience assessed', evidence: ['resilience'], inference: 'Response and recovery capability is acceptable', prediction: 'Recovery remains vulnerable under service disruption', recommendation: 'Run resilience drills' }; }
  getScenarios() { return { observed: 'Scenarios evaluated', evidence: ['scenarios'], inference: 'High-impact credential loss remains top scenario', prediction: 'Simulated exposure would degrade posture temporarily', recommendation: 'Prepare pre-approved response controls' }; }
  getSLOs() { return { observed: 'SLO status loaded', evidence: ['slo'], inference: 'SLO health is mostly acceptable with one risk area', prediction: 'Budget burn risk remains moderate', recommendation: 'Tighten detection latency' }; }
  getEvidence() { return { observed: 'Evidence chain reviewed', evidence: ['evidence'], inference: 'Evidence supports current decisions with minor freshness gaps', prediction: 'Freshness drift may affect priority ranking', recommendation: 'Refresh stale evidence' }; }
  getInvestments() { return { observed: 'Investments reviewed', evidence: ['investments'], inference: 'Identity hardening and control coverage offer best risk reduction', prediction: 'Balanced investment path reduces risk most efficiently', recommendation: 'Fund focused assurance and identity work' }; }

  analyze() {
    const analysis = {
      organizationId: this.organizationId,
      observed: this.getPosture().observed,
      evidence: this.getEvidence().evidence,
      inference: 'Strategic emphasis should remain on identity hardening, control coverage, and telemetry freshness',
      prediction: 'Posture improves if drift is addressed within 30 days',
      recommendation: 'Run identity and coverage campaigns; keep dry-run for autonomous actions',
      status: 'RECOMMENDATION',
      classification: 'EVIDENCE_BASED',
    };
    return analysis;
  }
}

export class AISecurityArchitect {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
  }

  reviewArchitecture({ currentState = 'Current architecture', problem = 'Unclear trust boundaries', assumptions = ['Synthetic data only'], options = ['Add segmentation'], tradeoffs = ['Cost'], recommendation = 'Prioritize identity segmentation', risks = ['Operational friction'], implementationPlan = ['Model trust boundaries'], verificationPlan = ['Coverage validation'] } = {}) {
    return {
      organizationId: this.organizationId,
      CURRENT_STATE: String(currentState),
      PROBLEM: String(problem),
      ASSUMPTIONS: Array.isArray(assumptions) ? assumptions : [String(assumptions)],
      OPTIONS: Array.isArray(options) ? options : [String(options)],
      TRADEOFFS: Array.isArray(tradeoffs) ? tradeoffs : [String(tradeoffs)],
      RECOMMENDATION: String(recommendation),
      RISKS: Array.isArray(risks) ? risks : [String(risks)],
      IMPLEMENTATION_PLAN: Array.isArray(implementationPlan) ? implementationPlan : [String(implementationPlan)],
      VERIFICATION_PLAN: Array.isArray(verificationPlan) ? verificationPlan : [String(verificationPlan)],
      generatedAt: nowIso(),
    };
  }
}

export class AutonomousAssuranceAgent {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
    this.allowlist = ['security-control-check', 'identity-policy-check', 'synthetic-scenario-check', 'evidence-freshness-check'];
  }

  observe({ target, mode = 'dry-run' }) {
    return { target, mode: String(mode).toUpperCase(), organizationId: this.organizationId, lifecycle: 'OBSERVE' };
  }

  selectAssuranceTarget(target) {
    return { target, accepted: this.allowlist.includes(String(target || '')) || String(target || '').includes('synthetic') || String(target || '').includes('security'), organizationId: this.organizationId, lifecycle: 'SELECT_ASSURANCE_TARGET' };
  }

  plan({ target, approved = false, allowlist = this.allowlist }) {
    return { target, approved: Boolean(approved), allowlist: uniqueList(allowlist), organizationId: this.organizationId, lifecycle: 'PLAN' };
  }

  simulate({ target, synthetic = true }) {
    return { target, synthetic: Boolean(synthetic), organizationId: this.organizationId, lifecycle: 'SIMULATE' };
  }

  executeApprovedTest({ target, approved = false, dryRun = true }) {
    if (!approved || dryRun) {
      return { target, status: 'DRY_RUN_ONLY', organizationId: this.organizationId, lifecycle: 'EXECUTE_APPROVED_TEST' };
    }
    return { target, status: 'EXECUTED', organizationId: this.organizationId, lifecycle: 'EXECUTE_APPROVED_TEST' };
  }

  analyze({ target, result = 'PASS' }) {
    return { target, result: String(result).toUpperCase(), organizationId: this.organizationId, lifecycle: 'ANALYZE' };
  }

  createFindings({ target, findings = ['No major issues'] }) {
    return { target, findings: uniqueList(findings), organizationId: this.organizationId, lifecycle: 'CREATE_FINDINGS' };
  }

  createRemediation({ target, remediation = ['verify evidence freshness'], status = 'PLANNED' }) {
    return { target, remediation: uniqueList(remediation), status: String(status).toUpperCase(), organizationId: this.organizationId, lifecycle: 'CREATE_REMEDIATION' };
  }

  verify({ target, verification = ['verify synthetic assumptions'] }) {
    return { target, verification: uniqueList(verification), organizationId: this.organizationId, lifecycle: 'VERIFY' };
  }

  report({ target, summary = 'Assurance report generated' }) {
    return { target, summary: String(summary), organizationId: this.organizationId, lifecycle: 'REPORT' };
  }
}

export class SecurityExecutiveIntelligenceCenter {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
  }

  generate({ postureScore = 82, risk = 35, resilience = 74, exposure = 22, controlCoverage = 86, detectionCoverage = 78, securityDebt = 12, SLOHealth = 91, topRisks = [], investment = [], resilienceScore = [] }) {
    return {
      organizationId: this.organizationId,
      SECURITY_POSTURE: {
        OverallSecurityScore: clamp(postureScore),
        Risk: clamp(risk),
        Resilience: clamp(resilience),
        Exposure: clamp(exposure),
        ControlCoverage: clamp(controlCoverage),
        DetectionCoverage: clamp(detectionCoverage),
        SecurityDebt: clamp(securityDebt),
        SLOHealth: clamp(SLOHealth),
      },
      STRATEGIC_RISKS: uniqueList(topRisks),
      SECURITY_INVESTMENT: Array.isArray(investment) ? investment : [String(investment)],
      RESILIENCE: Array.isArray(resilienceScore) ? resilienceScore : [String(resilienceScore)],
      TIMELINE: ['major posture changes', 'incidents', 'threat campaigns', 'critical remediation', 'control failures'],
      AI_STRATEGIST: { summary: 'Prioritize identity coverage, telemetry freshness, and controlled assurance campaigns', assumptions: ['synthetic scenarios only'], evidence: ['posture', 'risk', 'coverage'] },
      createdAt: nowIso(),
    };
  }
}

export class SecurityOperatingModel {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = normalizeOrg(organizationId);
  }

  generate({ posture = 82, majorRisks = [], priorities = [], securityDebt = [], blindSpots = [], controlCoverage = 86, detectionCoverage = 78, resilience = 74, activeCampaigns = [], remediation = [], verification = [], executiveDecisions = [] } = {}) {
    return {
      organizationId: this.organizationId,
      lifecycle: ['DISCOVER', 'MODEL', 'OBSERVE', 'DETECT', 'UNDERSTAND', 'PREDICT', 'PRIORITIZE', 'DECIDE', 'PLAN', 'APPROVE', 'REMEDIATE', 'VERIFY', 'ASSURE', 'MEASURE', 'LEARN', 'IMPROVE'],
      currentPosture: clamp(posture),
      majorRisks: uniqueList(majorRisks),
      strategicPriorities: uniqueList(priorities),
      securityDebt: uniqueList(securityDebt),
      blindSpots: uniqueList(blindSpots),
      controlCoverage: clamp(controlCoverage),
      detectionCoverage: clamp(detectionCoverage),
      resilience: clamp(resilience),
      activeCampaigns: uniqueList(activeCampaigns),
      remediation: uniqueList(remediation),
      verification: uniqueList(verification),
      executiveDecisions: uniqueList(executiveDecisions),
      createdAt: nowIso(),
    };
  }
}

export const command40FeatureMap = {
  'Security Digital Twin Engine': SecurityDigitalTwinEngine,
  'Digital Twin Asset State Model': DigitalTwinStateEngine,
  'Security Posture Snapshot Engine': SecurityPostureSnapshotEngine,
  'What-If Security Scenario Engine': SecurityWhatIfEngine,
  'Continuous Control Assurance Graph': ControlAssuranceGraph,
  'Security Control Coverage Intelligence': SecurityControlCoverageEngine,
  'Security Observability Fabric': SecurityObservabilityFabric,
  'Security SLO & Error-Budget Engine': SecuritySLOEngine,
  'Security Reliability Engineering Platform': SecurityReliabilityEngine,
  'Detection Coverage Map': DetectionCoverageEngine,
  'Attack Path Coverage Analyzer': AttackPathCoverageEngine,
  'Security Blind-Spot Discovery Engine': SecurityBlindSpotEngine,
  'Security Knowledge Graph 2.0': SecurityKnowledgeGraph20,
  'Security Evidence Lineage Engine': EvidenceLineageEngine,
  'Security Decision Intelligence Engine': SecurityDecisionEngine,
  'Security Priority Optimization Engine': SecurityPriorityOptimizer,
  'Security Scenario Planning Workbench': SecurityScenarioPlanningWorkbench,
  'Continuous Assurance Campaign Engine': ContinuousAssuranceCampaignEngine,
  'Security Regression Intelligence': SecurityRegressionEngine,
  'Security Posture Change Explainer': PostureChangeExplainer,
  'AI Security Strategist': AISecurityStrategist,
  'AI Security Architect': AISecurityArchitect,
  'Autonomous Assurance Agent': AutonomousAssuranceAgent,
  'Security Executive Intelligence Center': SecurityExecutiveIntelligenceCenter,
  'SecretShield Security Operating Model': SecurityOperatingModel,
};

export const securityDigitalTwinCommand40 = {
  featureCount: Command40FeatureNames.length,
  featureNames: Command40FeatureNames,
  routes: COMMAND_40_API_ROUTES,
  workers: COMMAND_40_WORKERS,
  cliCommands: COMMAND_40_CLI_COMMANDS,
  uiRoutes: COMMAND_40_UI_ROUTES,
};
