import crypto from 'node:crypto';

import { ExposureIntelligenceEngine } from './exposure-intelligence.js';
import { SecurityGraphService } from './security-graph.js';
import { SecurityIntelligenceEngine } from './security-intelligence.js';
import { SecurityContextSanitizer } from './security-context-sanitizer.js';
import { IdentityGraphService } from './command-36-identity-security.js';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value || 0)));
const nowIso = () => new Date().toISOString();
const hashValue = (value) => crypto.createHash('sha256').update(String(value || 'unknown')).digest('hex');
const sanitizeRecord = (value) => {
  const sanitizer = new SecurityContextSanitizer();
  const cleaned = sanitizer.sanitize(value);
  if (cleaned && typeof cleaned === 'object') {
    for (const key of ['password', 'passwd', 'token', 'apiKey', 'apikey', 'authorization', 'cookie', 'session', 'privateKey', 'secret', 'secretValue', 'rawSecret', 'value']) {
      delete cleaned[key];
    }
  }
  return cleaned;
};

export class UniversalAssetDiscoveryEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.assets = new Map();
  }

  addAsset({
    assetId,
    assetType,
    owner = 'unknown',
    source = 'integration',
    discoveryMethod = 'metadata-sync',
    environment = 'unknown',
    organizationId = this.organizationId,
    confidence = 80,
    fingerprint,
    lifecycleState = 'DISCOVERED',
    metadata = {},
  }) {
    const id = String(assetId || hashValue(`${assetType}:${source}:${environment}:${owner}`));
    const record = {
      organizationId,
      assetId: id,
      assetType: String(assetType).toUpperCase(),
      source,
      discoveryMethod,
      confidence: clamp(confidence),
      discoveredAt: nowIso(),
      lastSeenAt: nowIso(),
      environment,
      owner,
      fingerprint: fingerprint || hashValue(`${organizationId}:${id}:${assetType}`),
      lifecycleState,
      metadata: sanitizeRecord(metadata),
    };
    this.assets.set(`${organizationId}:${id}`, record);
    return record;
  }

  reconcile(asset) {
    const key = `${asset.organizationId}:${asset.assetId}`;
    const existing = this.assets.get(key);
    if (!existing) {
      this.assets.set(key, { ...asset, lifecycleState: 'DISCOVERED', discoveredAt: nowIso(), lastSeenAt: nowIso() });
      return this.assets.get(key);
    }
    existing.lastSeenAt = nowIso();
    if (JSON.stringify(existing.metadata) !== JSON.stringify(sanitizeRecord(asset.metadata || {}))) {
      existing.lifecycleState = 'CHANGED';
      existing.metadata = sanitizeRecord(asset.metadata || {});
    }
    return existing;
  }

  list({ organizationId = this.organizationId } = {}) {
    return Array.from(this.assets.values()).filter((asset) => asset.organizationId === organizationId);
  }
}

export class DigitalAssetInventoryEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.assets = new Map();
  }

  register({
    assetId,
    assetType,
    owner = 'unknown',
    team = 'unknown',
    businessFunction = 'unknown',
    environment = 'unknown',
    criticality = 'MEDIUM',
    dataClassification = 'INTERNAL',
    lifecycle = 'ACTIVE',
    technology = 'unknown',
    dependencies = [],
    exposure = 'INTERNAL',
    findings = [],
    risks = [],
    incidents = [],
    controls = [],
    governanceRequirements = [],
  }) {
    const record = {
      assetId: String(assetId),
      assetType: String(assetType).toUpperCase(),
      owner,
      team,
      businessFunction,
      environment,
      criticality: String(criticality).toUpperCase(),
      dataClassification: String(dataClassification).toUpperCase(),
      lifecycle,
      technology,
      dependencies,
      exposure: String(exposure).toUpperCase(),
      findings,
      risks,
      incidents,
      controls,
      governanceRequirements,
      ownershipState: owner && owner !== 'unknown' ? 'OWNED' : 'UNOWNED',
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.assets.set(record.assetId, record);
    return record;
  }

  reviewOwners() {
    return Array.from(this.assets.values()).map((asset) => {
      const state = asset.owner && asset.owner !== 'unknown' ? 'OWNED' : 'UNOWNED';
      asset.ownershipState = state;
      return { assetId: asset.assetId, ownershipState: state };
    });
  }

  getInventory() {
    return Array.from(this.assets.values());
  }
}

export class InternetExposureEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.exposure = new Map();
    this.engine = new ExposureIntelligenceEngine({ organizationId });
  }

  record({ assetId, assetType, domain, classification = 'UNKNOWN', environment = 'unknown', publicFacing = false, severity = 'HIGH', criticality = 50 }) {
    const record = {
      assetId,
      assetType,
      domain,
      classification: String(classification).toUpperCase(),
      environment,
      publicFacing,
      severity: String(severity).toUpperCase(),
      criticality: clamp(criticality),
      exposureScore: this.engine.calculateExposureScore({ secretSeverity: severity, assetCriticality: criticality, isPublic: publicFacing, deploymentStatus: environment.toUpperCase() === 'PRODUCTION' ? 'PRODUCTION' : 'STAGING', runtimeExposure: publicFacing, cloudExposure: publicFacing }).score,
      organizationId: this.organizationId,
      lastSeenAt: nowIso(),
    };
    this.exposure.set(`${this.organizationId}:${assetId}`, record);
    return record;
  }

  getInventory() {
    return Array.from(this.exposure.values());
  }

  summarize() {
    const records = Array.from(this.exposure.values());
    return {
      total: records.length,
      public: records.filter((item) => item.classification === 'PUBLIC').length,
      restricted: records.filter((item) => item.classification === 'RESTRICTED').length,
      internal: records.filter((item) => item.classification === 'INTERNAL').length,
      unknown: records.filter((item) => item.classification === 'UNKNOWN').length,
      criticalExposure: records.filter((item) => item.exposureScore >= 85).length,
    };
  }
}

export class ApplicationSecurityInventory {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.applications = new Map();
  }

  register({ applicationId, name, posture = 'UNKNOWN', risk = 0, findings = [], secretsMetadata = [], dependencies = [], apis = [], cloudResources = [], deployments = [], identities = [], attackPaths = [], incidents = [], controls = [], changeHistory = [] }) {
    const record = {
      applicationId: String(applicationId),
      name: name || applicationId,
      securityPosture: String(posture).toUpperCase(),
      risk: clamp(risk),
      findings,
      secretsMetadata,
      dependencies,
      apis,
      cloudResources,
      deployments,
      identities,
      attackPaths,
      incidents,
      controls,
      changeHistory,
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.applications.set(record.applicationId, record);
    return record;
  }

  get(applicationId) {
    return this.applications.get(String(applicationId)) || null;
  }
}

export class APISecurityInventory {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.endpoints = new Map();
  }

  register({ endpoint, api, application, owner = 'unknown', environment = 'unknown', authentication = 'unknown', exposure = 'UNKNOWN', consumers = [], dependencies = [], controls = [], vulnerabilities = [], findings = [] }) {
    const score = clamp((exposure === 'PUBLIC' ? 20 : 0) + (authentication === 'NONE' ? 25 : 0) + (vulnerabilities.length * 10) + (findings.length * 8));
    const record = {
      endpoint,
      api,
      application,
      owner,
      environment,
      authentication,
      exposure: String(exposure).toUpperCase(),
      consumers,
      dependencies,
      controls,
      vulnerabilities,
      findings,
      apiSecurityScore: score,
      classification: String(exposure).toUpperCase(),
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.endpoints.set(`${this.organizationId}:${endpoint}`, record);
    return record;
  }

  getInventory() {
    return Array.from(this.endpoints.values());
  }
}

export class CloudPostureEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.resources = new Map();
  }

  registerResource({ resourceId, resourceType, account, region, project, owner = 'unknown', securityGroups = [], identityBindings = [], publicResource = false, posture = 'UNKNOWN', missingControls = [], violations = [], drift = 0, criticality = 50 }) {
    const record = {
      resourceId: String(resourceId),
      resourceType,
      account,
      region,
      project,
      owner,
      securityGroups,
      identityBindings,
      publicResource,
      posture: String(posture).toUpperCase(),
      missingControls,
      violations,
      drift: clamp(drift),
      criticality: clamp(criticality),
      postureScore: clamp(100 - (publicResource ? 20 : 0) - missingControls.length * 8 - violations.length * 10 - drift),
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.resources.set(record.resourceId, record);
    return record;
  }

  summarize() {
    const records = Array.from(this.resources.values());
    return {
      total: records.length,
      postureScore: records.length ? Math.round(records.reduce((sum, item) => sum + item.postureScore, 0) / records.length) : 0,
      public: records.filter((item) => item.publicResource).length,
      violations: records.reduce((sum, item) => sum + item.violations.length, 0),
    };
  }
}

export class KubernetesSecurityIntelligenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.clusters = new Map();
    this.workloads = new Map();
  }

  registerCluster({ clusterId, namespace = 'default', owner = 'unknown', publicIngress = false, workloads = [], posture = 'UNKNOWN', criticality = 50 }) {
    const cluster = {
      clusterId,
      namespace,
      owner,
      publicIngress,
      workloads,
      posture: String(posture).toUpperCase(),
      criticality: clamp(criticality),
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.clusters.set(clusterId, cluster);
    return cluster;
  }

  registerWorkload({ workloadId, clusterId, namespace, privileged = false, publicService = false, imageRisk = 0, serviceAccountRisk = 0, owner = 'unknown', posture = 'UNKNOWN' }) {
    const workload = {
      workloadId,
      clusterId,
      namespace,
      privileged,
      publicService,
      imageRisk: clamp(imageRisk),
      serviceAccountRisk: clamp(serviceAccountRisk),
      owner,
      posture: String(posture).toUpperCase(),
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.workloads.set(workloadId, workload);
    return workload;
  }

  summarize() {
    const workloads = Array.from(this.workloads.values());
    return {
      workloads: workloads.length,
      privileged: workloads.filter((item) => item.privileged).length,
      publicServices: workloads.filter((item) => item.publicService).length,
      avgRisk: workloads.length ? Math.round(workloads.reduce((sum, item) => sum + item.imageRisk + item.serviceAccountRisk, 0) / workloads.length) : 0,
    };
  }
}

export class PipelineSecurityEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.pipelines = new Map();
  }

  register({ pipelineId, repository, workflow, environment = 'unknown', branchProtection = false, securityGates = [], artifactSecurity = [], permissions = [], secretsReferences = [], posture = 'UNKNOWN' }) {
    const record = {
      pipelineId,
      repository,
      workflow,
      environment,
      branchProtection,
      securityGates,
      artifactSecurity,
      permissions,
      secretsReferences,
      posture: String(posture).toUpperCase(),
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.pipelines.set(pipelineId, record);
    return record;
  }

  summarize() {
    const records = Array.from(this.pipelines.values());
    return {
      total: records.length,
      missingGates: records.filter((item) => item.securityGates.length === 0).length,
      missingBranchProtection: records.filter((item) => !item.branchProtection).length,
    };
  }
}

export class SourceSecurityIntelligenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.findings = new Map();
  }

  createFinding({ ruleId, assetId, severity = 'MEDIUM', confidence = 60, category = 'CONFIGURATION', evidenceLocation = 'repository', explanation = 'synthetic rule match', remediation = 'review configuration' }) {
    const record = {
      ruleId,
      assetId,
      severity: String(severity).toUpperCase(),
      confidence: clamp(confidence),
      category: String(category).toUpperCase(),
      evidenceLocation,
      explanation,
      remediation,
      organizationId: this.organizationId,
      createdAt: nowIso(),
    };
    this.findings.set(`${this.organizationId}:${ruleId}:${assetId}`, record);
    return record;
  }

  getFindings() {
    return Array.from(this.findings.values());
  }
}

export class SecurityConfigurationPostureEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.snapshots = new Map();
  }

  record({ assetId, controlState = 'UNKNOWN', violations = [], status = 'UNKNOWN', changedBy = 'system' }) {
    const record = {
      assetId,
      controlState: String(controlState).toUpperCase(),
      violations,
      status: String(status).toUpperCase(),
      changedBy,
      organizationId: this.organizationId,
      createdAt: nowIso(),
    };
    this.snapshots.set(`${this.organizationId}:${assetId}:${record.createdAt}`, record);
    return record;
  }

  summarize() {
    const records = Array.from(this.snapshots.values());
    return {
      total: records.length,
      degraded: records.filter((item) => item.status === 'DEGRADED').length,
      critical: records.filter((item) => item.status === 'CRITICAL').length,
      unknown: records.filter((item) => item.status === 'UNKNOWN').length,
    };
  }
}

export class SecurityDriftEvent {
  constructor({ organizationId = 'default-org', assetId, assetType, baselineType, status = 'DRIFTED', driftSummary = '', riskIncrease = 0 }) {
    this.organizationId = organizationId;
    this.assetId = assetId;
    this.assetType = assetType;
    this.baselineType = baselineType;
    this.status = String(status).toUpperCase();
    this.driftSummary = driftSummary;
    this.riskIncrease = clamp(riskIncrease);
    this.createdAt = nowIso();
  }
}

export class SecurityBaselineManager {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.baselines = new Map();
    this.events = [];
  }

  createBaseline({ baselineId, category, requiredControls = [], requiredPolicies = [], requiredScanners = [], requiredReviews = [], requiredConfiguration = [] }) {
    const baseline = {
      baselineId,
      category: String(category).toUpperCase(),
      requiredControls,
      requiredPolicies,
      requiredScanners,
      requiredReviews,
      requiredConfiguration,
      organizationId: this.organizationId,
      createdAt: nowIso(),
      status: 'COMPLIANT',
    };
    this.baselines.set(baselineId, baseline);
    return baseline;
  }

  evaluateDrift({ baselineId, assetId, assetType, currentControls = [], requiredControls = [], riskIncrease = 0 }) {
    const drifted = currentControls.length < requiredControls.length || requiredControls.some((control) => !currentControls.includes(control));
    const status = drifted ? 'DRIFTED' : 'COMPLIANT';
    const event = drifted
      ? new SecurityDriftEvent({ organizationId: this.organizationId, assetId, assetType, baselineType: baselineId, status, driftSummary: `Required controls missing from ${assetType}`, riskIncrease })
      : null;
    if (event) {
      this.events.push(event);
    }
    return { baselineId, assetId, status, drifted, event };
  }
}

export class VulnerabilityIntelligenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.vulnerabilities = new Map();
  }

  register({ vulnerabilityId, affectedAsset, affectedApplication, severity = 'MEDIUM', exploitability = 0, exposure = 'INTERNAL', relevance = 0, remediation = 'review', owner = 'security', status = 'OPEN' }) {
    const record = {
      vulnerabilityId: String(vulnerabilityId),
      affectedAsset,
      affectedApplication,
      severity: String(severity).toUpperCase(),
      exploitability: clamp(exploitability),
      exposure: String(exposure).toUpperCase(),
      threatRelevance: clamp(relevance),
      remediation,
      owner,
      status: String(status).toUpperCase(),
      firstSeen: nowIso(),
      lastSeen: nowIso(),
      organizationId: this.organizationId,
    };
    this.vulnerabilities.set(record.vulnerabilityId, record);
    return record;
  }

  dedupe() {
    return Array.from(this.vulnerabilities.values());
  }
}

export class ExposurePrioritizationEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
  }

  score({ exploitability = 0, internetExposure = 0, assetCriticality = 0, identityPrivilege = 0, attackPath = 0, threatRelevance = 0, runtimePresence = false, vulnerabilitySeverity = 0, controlWeakness = 0, businessImpact = 0, age = 0, recurrence = 0 }) {
    const value = clamp(
      exploitability * 1.2 +
        internetExposure * 1.3 +
        assetCriticality * 0.55 +
        identityPrivilege * 0.8 +
        attackPath * 1.1 +
        threatRelevance * 1.2 +
        (runtimePresence ? 12 : 0) +
        vulnerabilitySeverity * 0.7 +
        controlWeakness * 0.9 +
        businessImpact * 0.8 +
        age * 0.2 +
        recurrence * 0.6,
      0,
      1000,
    );
    let priority = 'P4';
    if (value >= 650) priority = 'P0';
    else if (value >= 500) priority = 'P1';
    else if (value >= 350) priority = 'P2';
    else if (value >= 220) priority = 'P3';
    const factors = [
      internetExposure > 0 ? 'PUBLIC EXPOSURE' : 'INTERNAL EXPOSURE',
      assetCriticality > 70 ? 'CRITICAL ASSET' : 'STANDARD ASSET',
      vulnerabilitySeverity > 70 ? 'HIGH-RISK VULNERABILITY' : 'LOWER-RISK VULNERABILITY',
      identityPrivilege > 60 ? 'PRIVILEGED IDENTITY PATH' : 'STANDARD IDENTITY PATH',
      controlWeakness > 50 ? 'WEAK CONTROL COVERAGE' : 'CONTROL COVERAGE PRESENT',
    ];
    return { priority, score: Math.round(value), factors, explanation: `${priority} because: ${factors.join(' + ')}` };
  }
}

export class RootCauseCluster {
  constructor({ clusterId, rootCauseType, confidence, severity, affectedAssets, affectedFindings, recommendedFix }) {
    this.clusterId = clusterId;
    this.rootCauseType = rootCauseType;
    this.confidence = clamp(confidence);
    this.severity = String(severity).toUpperCase();
    this.affectedAssets = affectedAssets;
    this.affectedFindings = affectedFindings;
    this.recommendedFix = recommendedFix;
    this.createdAt = nowIso();
    this.updatedAt = this.createdAt;
  }
}

export class FindingCorrelationEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.clusters = new Map();
  }

  correlate({ clusterId, rootCauseType, confidence, severity, affectedAssets, affectedFindings, recommendedFix }) {
    const cluster = new RootCauseCluster({ clusterId, rootCauseType, confidence, severity, affectedAssets, affectedFindings, recommendedFix });
    this.clusters.set(clusterId, cluster);
    return cluster;
  }
}

export class AttackSurfaceManagementEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.assets = new Map();
  }

  register({ assetId, assetType, risk = 0, publicFacing = false, owner = 'unknown', isManaged = true }) {
    const record = {
      assetId,
      assetType,
      risk: clamp(risk),
      publicFacing,
      owner,
      isManaged,
      attackSurfaceScore: clamp(risk + (publicFacing ? 20 : 0) + (owner === 'unknown' ? 10 : 0) + (!isManaged ? 15 : 0)),
      organizationId: this.organizationId,
      updatedAt: nowIso(),
    };
    this.assets.set(`${this.organizationId}:${assetId}`, record);
    return record;
  }

  summarize() {
    const records = Array.from(this.assets.values());
    return {
      total: records.length,
      public: records.filter((item) => item.publicFacing).length,
      unmanaged: records.filter((item) => !item.isManaged).length,
      averageScore: records.length ? Math.round(records.reduce((sum, item) => sum + item.attackSurfaceScore, 0) / records.length) : 0,
    };
  }
}

export class RiskPropagationEngine extends SecurityGraphService {
  constructor({ organizationId = 'default-org' } = {}) {
    super({ organizationId });
    this.organizationId = organizationId;
  }

  propagateRisk({ assetId, riskIncrease, maxDepth = 3 }) {
    const visited = new Set();
    const queue = [{ entityId: assetId, depth: 0, risk: riskIncrease }];
    const updates = [];
    while (queue.length) {
      const current = queue.shift();
      if (visited.has(current.entityId) || current.depth > maxDepth) continue;
      visited.add(current.entityId);
      const node = this.getNode(current.entityId, 'ASSET', this.organizationId) || this.getNode(current.entityId, 'APPLICATION', this.organizationId) || this.getNode(current.entityId, 'IDENTITY', this.organizationId);
      if (node) {
        node.metadata = { ...(node.metadata || {}), propagatedRisk: clamp((node.metadata?.propagatedRisk || 0) + current.risk) };
        updates.push({ entityId: current.entityId, propagatedRisk: node.metadata.propagatedRisk });
      }
      const neighbors = this.getNeighbors(current.entityId, 'ASSET', this.organizationId);
      for (const next of neighbors) {
        queue.push({ entityId: next.neighborId, depth: current.depth + 1, risk: current.risk * 0.7 });
      }
    }
    return updates;
  }
}

export class ContinuousSecurityDiscoveryScheduler {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.runs = [];
  }

  schedule({ schedule = 'DAILY', assetsDiscovered = 0, assetsChanged = 0, assetsRemoved = 0, status = 'SUCCESS', errors = 0, warnings = 0 }) {
    const run = {
      runId: `run_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      organizationId: this.organizationId,
      schedule: String(schedule).toUpperCase(),
      start: nowIso(),
      end: nowIso(),
      status: String(status).toUpperCase(),
      assetsDiscovered,
      assetsChanged,
      assetsRemoved,
      errors,
      warnings,
    };
    this.runs.push(run);
    return run;
  }
}

export class SecuritySignal {
  constructor({ organizationId, assetId, signalType, confidence, severity, metadata = {} }) {
    this.organizationId = organizationId;
    this.assetId = assetId;
    this.signalType = signalType;
    this.confidence = clamp(confidence);
    this.severity = String(severity).toUpperCase();
    this.metadata = sanitizeRecord(metadata);
    this.timestamp = nowIso();
    this.signalId = hashValue(`${organizationId}:${assetId}:${signalType}:${this.timestamp}`);
  }
}

export class CorrelatedSecurityEvent {
  constructor({ organizationId, entityId, eventType, correlationId, confidence, severity, metadata = {} }) {
    this.organizationId = organizationId;
    this.entityId = entityId;
    this.eventType = eventType;
    this.correlationId = correlationId || hashValue(`${organizationId}:${entityId}:${eventType}:${Date.now()}`);
    this.confidence = clamp(confidence);
    this.severity = String(severity).toUpperCase();
    this.metadata = sanitizeRecord(metadata);
    this.timestamp = nowIso();
  }
}

export class SecuritySignalCorrelationEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.signals = [];
    this.events = [];
  }

  recordSignal({ assetId, signalType, confidence, severity, metadata = {} }) {
    const signal = new SecuritySignal({ organizationId: this.organizationId, assetId, signalType, confidence, severity, metadata });
    this.signals.push(signal);
    return signal;
  }

  correlate({ entityId, eventType, confidence, severity, metadata = {} }) {
    const event = new CorrelatedSecurityEvent({ organizationId: this.organizationId, entityId, eventType, confidence, severity, metadata });
    this.events.push(event);
    return event;
  }
}

export class SecurityEventStream {
  constructor({ organizationId = 'default-org', maxQueue = 200 } = {}) {
    this.organizationId = organizationId;
    this.maxQueue = maxQueue;
    this.queue = [];
    this.backpressure = 0;
  }

  emit({ eventType, entityId, severity = 'MEDIUM', confidence = 60, source = 'internal', metadata = {} }) {
    const event = {
      eventId: hashValue(`${this.organizationId}:${eventType}:${entityId}:${Date.now()}`),
      organizationId: this.organizationId,
      eventType: String(eventType).toUpperCase(),
      source,
      timestamp: nowIso(),
      entityId,
      severity: String(severity).toUpperCase(),
      confidence: clamp(confidence),
      correlationId: hashValue(`${this.organizationId}:${entityId}:${eventType}`),
      metadata: sanitizeRecord(metadata),
    };
    this.queue.push(event);
    if (this.queue.length > this.maxQueue) {
      this.backpressure = this.queue.length - this.maxQueue;
      this.queue = this.queue.slice(-this.maxQueue);
    }
    return event;
  }

  consume() {
    const items = [...this.queue];
    this.queue = [];
    return items;
  }
}

export class RetentionPolicy {
  constructor({ organizationId = 'default-org', policyName, retentionDays = 90, storageClass = 'HOT', legalHold = false }) {
    this.organizationId = organizationId;
    this.policyName = policyName;
    this.retentionDays = retentionDays;
    this.storageClass = String(storageClass).toUpperCase();
    this.legalHold = legalHold;
    this.createdAt = nowIso();
  }
}

export class RetentionIntelligenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.policies = new Map();
  }

  createPolicy({ policyName, retentionDays = 90, storageClass = 'HOT', legalHold = false }) {
    const policy = new RetentionPolicy({ organizationId: this.organizationId, policyName, retentionDays, storageClass, legalHold });
    this.policies.set(policyName, policy);
    return policy;
  }
}

export class HuntQuery {
  constructor({ queryId, name, filters = [], saved = false }) {
    this.queryId = queryId;
    this.name = name;
    this.filters = filters;
    this.saved = saved;
    this.createdAt = nowIso();
  }
}

export class ThreatHuntingWorkbench {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.savedQueries = new Map();
  }

  search({ queryId, name, filters = [], saved = false }) {
    const query = new HuntQuery({ queryId, name, filters, saved });
    this.savedQueries.set(queryId, query);
    return query;
  }

  runQuery(query) {
    return {
      organizationId: this.organizationId,
      queryId: query.queryId,
      results: [],
      filters: query.filters,
      saved: query.saved,
      executedAt: nowIso(),
    };
  }
}

export class DetectionRuleVersion {
  constructor({ ruleId, version, positiveFixtures = [], negativeFixtures = [], boundaryFixtures = [], published = false, lifecycle = 'DRAFT' }) {
    this.ruleId = ruleId;
    this.version = version;
    this.positiveFixtures = positiveFixtures;
    this.negativeFixtures = negativeFixtures;
    this.boundaryFixtures = boundaryFixtures;
    this.published = published;
    this.lifecycle = String(lifecycle).toUpperCase();
    this.createdAt = nowIso();
  }
}

export class DetectionRuleLaboratory {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.rules = new Map();
  }

  createRule({ ruleId, version = '1.0.0', positiveFixtures = [], negativeFixtures = [], boundaryFixtures = [], lifecycle = 'DRAFT' }) {
    const versioned = new DetectionRuleVersion({ ruleId, version, positiveFixtures, negativeFixtures, boundaryFixtures, lifecycle });
    this.rules.set(`${ruleId}:${version}`, versioned);
    return versioned;
  }

  publish(ruleId, version = '1.0.0') {
    const rule = this.rules.get(`${ruleId}:${version}`);
    if (!rule) return null;
    rule.lifecycle = 'PUBLISHED';
    rule.published = true;
    return rule;
  }
}

export class AISecurityAnalyst {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.allowedTools = [
      'searchSecurityEvents',
      'searchAssets',
      'searchIdentities',
      'searchRisks',
      'searchFindings',
      'searchIncidents',
      'searchThreats',
      'searchControls',
      'searchGovernance',
      'findAttackPaths',
      'calculateBlastRadius',
      'getTimeline',
      'getExposure',
      'getConfigurationDrift',
    ];
  }

  sanitizeContext(input) {
    const payload = sanitizeRecord(input);
    return JSON.stringify(payload);
  }

  investigate({ question, context = {} }) {
    return {
      organizationId: this.organizationId,
      question,
      plan: ['scope the assets', 'map identities', 'correlate events', 'prioritize risk', 'verify evidence'],
      sanitizedContext: this.sanitizeContext(context),
      toolset: this.allowedTools,
      riskSummary: 'No destructive or external actions performed by the AI analyst in this implementation.',
      generatedAt: nowIso(),
    };
  }
}

export class Scenario {
  constructor({ scenarioId, name, stages = [], synthetic = true }) {
    this.scenarioId = scenarioId;
    this.name = name;
    this.stages = stages;
    this.synthetic = synthetic;
    this.createdAt = nowIso();
  }
}

export class ScenarioExecution {
  constructor({ scenarioId, status = 'DISCOVERY', result = {} }) {
    this.scenarioId = scenarioId;
    this.status = String(status).toUpperCase();
    this.result = result;
    this.startedAt = nowIso();
  }
}

export class SimulationLab {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.scenarios = new Map();
    this.executions = [];
  }

  createScenario({ scenarioId, name, stages = [] }) {
    const scenario = new Scenario({ scenarioId, name, stages, synthetic: true });
    this.scenarios.set(scenarioId, scenario);
    return scenario;
  }

  executeScenario(scenarioId) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return null;
    const execution = new ScenarioExecution({
      scenarioId,
      status: 'DISCOVERY',
      result: {
        controlsTriggered: scenario.stages.length,
        controlsMissed: 0,
        responseTime: 'immediate-synthetic',
        detectionLatency: 'synthetic-simulation',
        policyViolations: 0,
        workflowFailures: 0,
      },
    });
    this.executions.push(execution);
    return execution;
  }
}

export class UniversalSecurityOperationsCenter {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.lastSummary = null;
    this.graph = new SecurityGraphService({ organizationId });
    this.intelligence = new SecurityIntelligenceEngine({ organizationId });
    this.identityGraph = new IdentityGraphService({ organizationId });
    this.exposure = new InternetExposureEngine({ organizationId });
  }

  summarize({ postureScore = 82, riskScore = 27, identityRisk = 24, attackSurfaceScore = 63, controlHealth = 90, assuranceScore = 88, governancePosture = 'HEALTHY', compliancePosture = 'MONITORING' }) {
    const summary = {
      organizationId: this.organizationId,
      securityPosture: { postureScore, riskScore, identityRisk, attackSurfaceScore, controlHealth, assuranceScore, governancePosture, compliancePosture },
      liveQueue: ['P0', 'P1', 'active incidents', 'critical risks'],
      whatIsHappening: 'Security posture is being monitored with discovery, exposure, identity, and risk signals.',
      whatIsAtRisk: 'Priority assets and identities with elevated exposure and critical dependencies.',
      whatChanged: 'Asset discovery, posture, and exposure signals are being updated continuously.',
      whatIsConnected: 'Organizational assets, identities, and risk graph nodes are correlated through the shared graph.',
      whatShouldWeInvestigate: 'High-risk public assets, identity paths, and control failures.',
      whatShouldWeRemediate: 'Priority exposures, misconfigurations, and ownership gaps.',
      whatRequiresApproval: 'Sensitive identity and cloud changes.',
      whatHasAlreadyBeenDone: 'Discovery, risk scoring, posture evaluation, and evidence tracking are in place.',
      generatedAt: nowIso(),
    };
    this.lastSummary = summary;
    return summary;
  }
}

export class Command37UniversalSecurityPlatform {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.discovery = new UniversalAssetDiscoveryEngine({ organizationId });
    this.inventory = new DigitalAssetInventoryEngine({ organizationId });
    this.exposure = new InternetExposureEngine({ organizationId });
    this.applications = new ApplicationSecurityInventory({ organizationId });
    this.apis = new APISecurityInventory({ organizationId });
    this.cloud = new CloudPostureEngine({ organizationId });
    this.kubernetes = new KubernetesSecurityIntelligenceEngine({ organizationId });
    this.pipelines = new PipelineSecurityEngine({ organizationId });
    this.source = new SourceSecurityIntelligenceEngine({ organizationId });
    this.configuration = new SecurityConfigurationPostureEngine({ organizationId });
    this.baselines = new SecurityBaselineManager({ organizationId });
    this.vulnerabilities = new VulnerabilityIntelligenceEngine({ organizationId });
    this.priorities = new ExposurePrioritizationEngine({ organizationId });
    this.rootCauses = new FindingCorrelationEngine({ organizationId });
    this.attackSurface = new AttackSurfaceManagementEngine({ organizationId });
    this.riskPropagation = new RiskPropagationEngine({ organizationId });
    this.discoveryScheduler = new ContinuousSecurityDiscoveryScheduler({ organizationId });
    this.signalCorrelation = new SecuritySignalCorrelationEngine({ organizationId });
    this.events = new SecurityEventStream({ organizationId });
    this.retention = new RetentionIntelligenceEngine({ organizationId });
    this.hunt = new ThreatHuntingWorkbench({ organizationId });
    this.detectionLab = new DetectionRuleLaboratory({ organizationId });
    this.aiAnalyst = new AISecurityAnalyst({ organizationId });
    this.simulation = new SimulationLab({ organizationId });
    this.soc = new UniversalSecurityOperationsCenter({ organizationId });
  }

  getUnifiedPipeline() {
    return [
      'DISCOVERY',
      'ASSET INVENTORY',
      'EXPOSURE',
      'DETECTION',
      'VULNERABILITY',
      'IDENTITY',
      'THREAT',
      'RISK',
      'GRAPH',
      'CORRELATION',
      'CONTROL VALIDATION',
      'SIMULATION',
      'INCIDENT',
      'OPERATIONS',
      'RESPONSE',
      'REMEDIATION',
      'VERIFICATION',
      'GOVERNANCE',
      'EVIDENCE',
      'EXECUTIVE INTELLIGENCE',
    ];
  }
}

export const command37Platform = new Command37UniversalSecurityPlatform({ organizationId: 'default-org' });
