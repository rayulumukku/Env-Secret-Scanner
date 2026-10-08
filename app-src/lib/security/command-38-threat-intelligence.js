import crypto from 'node:crypto';

import { securityContextSanitizer } from './security-context-sanitizer.js';
import { SecurityGraphService } from './security-graph.js';
import { IdentityGraphService } from './command-36-identity-security.js';
import { SecurityRiskRegister } from './command-35-enterprise-operations.js';
import { SecurityIntelligenceEngine } from './security-intelligence.js';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value || 0)));
const nowIso = () => new Date().toISOString();
const hash = (value) => crypto.createHash('sha256').update(String(value || 'unknown')).digest('hex');

const sanitizeRecord = (value) => {
  const sanitized = securityContextSanitizer.sanitize(value);
  if (sanitized && typeof sanitized === 'object') {
    for (const key of ['password', 'passwd', 'token', 'apiKey', 'apikey', 'authorization', 'cookie', 'session', 'privateKey', 'secret', 'secretValue', 'rawSecret', 'value']) {
      delete sanitized[key];
    }
  }
  return sanitized;
};

export const ThreatIntelConfidence = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  VERY_HIGH: 'VERY_HIGH',
  UNKNOWN: 'UNKNOWN',
};

export class ThreatIntelProvider {
  constructor({
    providerId,
    providerName,
    providerType,
    enabled = true,
    trustLevel = 'MEDIUM',
    organizationScope = 'organization',
    syncStatus = 'IDLE',
  } = {}) {
    this.providerId = providerId || `provider_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.providerName = providerName || this.providerId;
    this.providerType = providerType || 'PUBLIC_FEED';
    this.enabled = Boolean(enabled);
    this.trustLevel = trustLevel;
    this.organizationScope = organizationScope;
    this.lastSync = null;
    this.syncStatus = syncStatus;
    this.enabled = this.enabled;
  }

  connect() {
    this.syncStatus = 'CONNECTED';
    return this;
  }

  healthCheck() {
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      providerType: this.providerType,
      healthy: this.enabled,
      lastSync: this.lastSync,
      syncStatus: this.syncStatus,
      organizationScope: this.organizationScope,
    };
  }

  fetch() {
    return { providerId: this.providerId, fetchedAt: nowIso(), items: [] };
  }

  normalize(record) {
    return sanitizeRecord(record || {});
  }

  disconnect() {
    this.syncStatus = 'DISCONNECTED';
    return this;
  }
}

export class ThreatIndicator {
  constructor({ indicatorId, indicatorType, confidence = 'MEDIUM', severity = 'MEDIUM', source = 'unknown', firstSeen = nowIso(), lastSeen = nowIso(), expiration, relationships = [], metadata = {} }) {
    this.indicatorId = indicatorId || `indicator_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.indicatorType = String(indicatorType || 'DOMAIN').toUpperCase();
    this.confidence = String(confidence).toUpperCase();
    this.severity = String(severity).toUpperCase();
    this.source = source;
    this.firstSeen = firstSeen;
    this.lastSeen = lastSeen;
    this.expiration = expiration || null;
    this.relationships = Array.isArray(relationships) ? relationships : [];
    this.metadata = sanitizeRecord(metadata || {});
    this.createdAt = nowIso();
  }
}

export class ThreatAdvisory {
  constructor({ advisoryId, title, source, severity, summary, publishedAt = nowIso(), tags = [], metadata = {} }) {
    this.advisoryId = advisoryId || `advisory_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.title = title;
    this.source = source;
    this.severity = String(severity).toUpperCase();
    this.summary = summary;
    this.publishedAt = publishedAt;
    this.tags = tags;
    this.metadata = sanitizeRecord(metadata || {});
  }
}

export class ThreatCampaign {
  constructor({ campaignId, name, actor, techniques = [], targetedTechnologies = [], targetedSectors = [], confidence = 'MEDIUM', status = 'DETECTED' }) {
    this.campaignId = campaignId || `campaign_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.name = name;
    this.actor = actor;
    this.techniques = techniques;
    this.targetedTechnologies = targetedTechnologies;
    this.targetedSectors = targetedSectors;
    this.confidence = String(confidence).toUpperCase();
    this.status = String(status).toUpperCase();
    this.createdAt = nowIso();
  }
}

export class ThreatActor {
  constructor({ actorId, name, attribution = 'POSSIBLE', confidence = 'MEDIUM', techniques = [], campaigns = [], metadata = {} }) {
    this.actorId = actorId || `actor_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.name = name;
    this.attribution = String(attribution).toUpperCase();
    this.confidence = String(confidence).toUpperCase();
    this.techniques = techniques;
    this.campaigns = campaigns;
    this.metadata = sanitizeRecord(metadata || {});
  }
}

export class ThreatTechnique {
  constructor({ techniqueId, name, tactic, confidence = 'MEDIUM', metadata = {} }) {
    this.techniqueId = techniqueId || `technique_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.name = name;
    this.tactic = tactic;
    this.confidence = String(confidence).toUpperCase();
    this.metadata = sanitizeRecord(metadata || {});
  }
}

export class ThreatVulnerability {
  constructor({ vulnerabilityId, severity = 'MEDIUM', summary, metadata = {} }) {
    this.vulnerabilityId = vulnerabilityId || `vuln_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.severity = String(severity).toUpperCase();
    this.summary = summary;
    this.metadata = sanitizeRecord(metadata || {});
  }
}

export class ThreatObservation {
  constructor({ observationId, entityType, entityId, source, observationType, confidence = 'MEDIUM', metadata = {} }) {
    this.observationId = observationId || `obs_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.entityType = entityType;
    this.entityId = entityId;
    this.source = source;
    this.observationType = observationType;
    this.confidence = String(confidence).toUpperCase();
    this.metadata = sanitizeRecord(metadata || {});
    this.createdAt = nowIso();
  }
}

export class ThreatIntelligenceIngestionFabric {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.providers = new Map();
    this.normalized = new Map();
  }

  registerProvider(provider) {
    this.providers.set(provider.providerId, provider);
    return provider;
  }

  fetchFromProvider(providerId) {
    const provider = this.providers.get(providerId);
    if (!provider) return null;
    provider.connect();
    const payload = provider.fetch();
    provider.lastSync = nowIso();
    provider.syncStatus = 'SYNCED';
    provider.disconnect();
    return payload;
  }

  ingest({ providerId, records = [] }) {
    const provider = this.providers.get(providerId);
    if (!provider) return { ingested: 0, providerId, records: [] };
    const deduped = [];
    const seen = new Set();
    for (const record of records) {
      const key = hash(`${providerId}:${JSON.stringify(record)}`);
      if (seen.has(key)) continue;
      seen.add(key);
      const normalized = provider.normalize(record);
      this.normalized.set(`${this.organizationId}:${key}`, normalized);
      deduped.push(normalized);
    }
    return { ingested: deduped.length, providerId, records: deduped };
  }

  list() {
    return Array.from(this.normalized.values());
  }
}

export class ThreatIntelligenceNormalizationEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
  }

  normalizeIndicator(raw = {}) {
    return new ThreatIndicator({
      indicatorId: raw.indicatorId || `indicator_${hash(`${this.organizationId}:${raw.indicatorType || 'domain'}:${raw.value || Date.now()}`)}`,
      indicatorType: raw.indicatorType || 'DOMAIN',
      confidence: raw.confidence || ThreatIntelConfidence.MEDIUM,
      severity: raw.severity || 'MEDIUM',
      source: raw.source || 'unknown',
      firstSeen: raw.firstSeen || nowIso(),
      lastSeen: raw.lastSeen || nowIso(),
      expiration: raw.expiration || null,
      relationships: raw.relationships || [],
      metadata: raw.metadata || {},
    });
  }

  normalizeAdvisory(raw = {}) {
    return new ThreatAdvisory({
      advisoryId: raw.advisoryId || `advisory_${hash(`${this.organizationId}:${raw.title || 'unknown'}`)}`,
      title: raw.title || 'Threat advisory',
      source: raw.source || 'unknown',
      severity: raw.severity || 'MEDIUM',
      summary: raw.summary || 'Threat advisory received.',
      publishedAt: raw.publishedAt || nowIso(),
      tags: raw.tags || [],
      metadata: raw.metadata || {},
    });
  }

  normalizeCampaign(raw = {}) {
    return new ThreatCampaign({
      campaignId: raw.campaignId || `campaign_${hash(`${this.organizationId}:${raw.name || 'campaign'}`)}`,
      name: raw.name || 'Threat campaign',
      actor: raw.actor || 'unknown',
      techniques: raw.techniques || [],
      targetedTechnologies: raw.targetedTechnologies || [],
      targetedSectors: raw.targetedSectors || [],
      confidence: raw.confidence || ThreatIntelConfidence.MEDIUM,
      status: raw.status || 'DETECTED',
    });
  }

  normalizeActor(raw = {}) {
    return new ThreatActor({
      actorId: raw.actorId || `actor_${hash(`${this.organizationId}:${raw.name || 'actor'}`)}`,
      name: raw.name || 'Unknown actor',
      attribution: raw.attribution || 'POSSIBLE',
      confidence: raw.confidence || ThreatIntelConfidence.MEDIUM,
      techniques: raw.techniques || [],
      campaigns: raw.campaigns || [],
      metadata: raw.metadata || {},
    });
  }

  normalizeTechnique(raw = {}) {
    return new ThreatTechnique({
      techniqueId: raw.techniqueId || `technique_${hash(`${this.organizationId}:${raw.name || 'technique'}`)}`,
      name: raw.name || 'Technique',
      tactic: raw.tactic || 'unknown',
      confidence: raw.confidence || ThreatIntelConfidence.MEDIUM,
      metadata: raw.metadata || {},
    });
  }

  normalizeVulnerability(raw = {}) {
    return new ThreatVulnerability({
      vulnerabilityId: raw.vulnerabilityId || `vuln_${hash(`${this.organizationId}:${raw.summary || 'vulnerability'}`)}`,
      severity: raw.severity || 'MEDIUM',
      summary: raw.summary || 'Vulnerability metadata',
      metadata: raw.metadata || {},
    });
  }

  normalizeObservation(raw = {}) {
    return new ThreatObservation({
      observationId: raw.observationId || `obs_${hash(`${this.organizationId}:${raw.entityId || 'unknown'}:${raw.observationType || 'observation'}`)}`,
      entityType: raw.entityType || 'ASSET',
      entityId: raw.entityId || 'unknown',
      source: raw.source || 'system',
      observationType: raw.observationType || 'THREAT_SIGNAL',
      confidence: raw.confidence || ThreatIntelConfidence.MEDIUM,
      metadata: raw.metadata || {},
    });
  }
}

export class IOCMatch {
  constructor({ indicatorId, matchedEntity, source, confidence = 'MEDIUM', firstObserved = nowIso(), lastObserved = nowIso(), context = {}, severity = 'MEDIUM' }) {
    this.indicatorId = indicatorId;
    this.matchedEntity = matchedEntity;
    this.source = source;
    this.confidence = String(confidence).toUpperCase();
    this.firstObserved = firstObserved;
    this.lastObserved = lastObserved;
    this.context = sanitizeRecord(context || {});
    this.severity = String(severity).toUpperCase();
  }
}

export class IOCIntelligenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.indicators = new Map();
    this.matches = [];
  }

  registerIndicator(indicator) {
    this.indicators.set(indicator.indicatorId, indicator);
    return indicator;
  }

  matchEntity({ indicatorId, matchedEntity, source = 'internal', confidence = 'MEDIUM', context = {}, severity = 'MEDIUM' }) {
    const match = new IOCMatch({ indicatorId, matchedEntity, source, confidence, firstObserved: nowIso(), lastObserved: nowIso(), context, severity });
    this.matches.push(match);
    return match;
  }

  listMatches() {
    return this.matches;
  }
}

export class ThreatActorIntelligenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.actors = new Map();
    this.campaigns = new Map();
    this.techniques = new Map();
  }

  registerActor({ actorId, name, attribution = 'POSSIBLE', confidence = 'MEDIUM', techniques = [], campaigns = [], metadata = {} }) {
    const actor = new ThreatActor({ actorId, name, attribution, confidence, techniques, campaigns, metadata });
    this.actors.set(actor.actorId, actor);
    return actor;
  }

  registerCampaign({ campaignId, name, actor, techniques = [], targetedTechnologies = [], targetedSectors = [], confidence = 'MEDIUM', status = 'DETECTED' }) {
    const campaign = new ThreatCampaign({ campaignId, name, actor, techniques, targetedTechnologies, targetedSectors, confidence, status });
    this.campaigns.set(campaign.campaignId, campaign);
    return campaign;
  }

  registerTechnique({ techniqueId, name, tactic, confidence = 'MEDIUM', metadata = {} }) {
    const technique = new ThreatTechnique({ techniqueId, name, tactic, confidence, metadata });
    this.techniques.set(technique.techniqueId, technique);
    return technique;
  }
}

export class ThreatAssetCorrelationEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.correlations = [];
  }

  correlate({ threat, asset, severity = 'MEDIUM', exposure = 0, vulnerabilities = [], identities = [], application = 'unknown' }) {
    const score = clamp((Number(exposure || 0) * 0.32) + (Number(vulnerabilities.length || 0) * 10) + (Number(identities.length || 0) * 5) + (severity === 'CRITICAL' ? 25 : severity === 'HIGH' ? 18 : 10));
    const result = {
      threat,
      asset,
      application,
      score,
      explanation: `Threat relevance for ${asset} increased because of exposure ${exposure}, vulnerabilities ${vulnerabilities.length}, identities ${identities.length}, and severity ${severity}.`,
      organizationId: this.organizationId,
      createdAt: nowIso(),
    };
    this.correlations.push(result);
    return result;
  }
}

export class ThreatExposureEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.scores = new Map();
  }

  score({ assetId, activeThreatRelevance = 0, assetExposure = 0, assetCriticality = 0, vulnerabilitySeverity = 0, exploitability = 0, attackPath = 0, identityPrivilege = 0, controlCoverage = 0, confidence = 0, freshness = 0 }) {
    const computed = clamp(
      Number(activeThreatRelevance || 0) * 1.2 +
      Number(assetExposure || 0) * 0.8 +
      Number(assetCriticality || 0) * 0.7 +
      Number(vulnerabilitySeverity || 0) * 0.9 +
      Number(exploitability || 0) * 0.8 +
      Number(attackPath || 0) * 0.8 +
      Number(identityPrivilege || 0) * 0.9 +
      (100 - Number(controlCoverage || 0)) * 0.4 +
      Number(confidence || 0) * 0.5 +
      Number(freshness || 0) * 0.3,
      0,
      100,
    );
    let classification = 'MINIMAL';
    if (computed >= 85) classification = 'CRITICAL';
    else if (computed >= 70) classification = 'HIGH';
    else if (computed >= 50) classification = 'MODERATE';
    else if (computed >= 25) classification = 'LOW';
    const score = { assetId, score: computed, classification, organizationId: this.organizationId, createdAt: nowIso() };
    this.scores.set(`${this.organizationId}:${assetId}`, score);
    return score;
  }
}

export class SecurityBehaviorBaselineEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.baselines = new Map();
  }

  addBaseline({ entityId, entityType, frequency = 0, timing = 0, volume = 0, source = 'system', target = 'unknown', environment = 'production', actionCategory = 'access' }) {
    const baseline = {
      entityId,
      entityType,
      frequency: clamp(frequency),
      timing: clamp(timing),
      volume: clamp(volume),
      source,
      target,
      environment,
      actionCategory,
      state: 'STABLE',
      organizationId: this.organizationId,
      createdAt: nowIso(),
    };
    this.baselines.set(`${this.organizationId}:${entityType}:${entityId}`, baseline);
    return baseline;
  }

  evaluate({ entityId, entityType, measuredFrequency = 0, measuredVolume = 0, source = 'system', environment = 'production' }) {
    const baseline = this.baselines.get(`${this.organizationId}:${entityType}:${entityId}`) || this.addBaseline({ entityId, entityType, frequency: measuredFrequency, timing: 10, volume: measuredVolume, source, environment });
    const delta = Math.abs(Number(measuredFrequency || 0) - Number(baseline.frequency || 0));
    const volumeDelta = Math.abs(Number(measuredVolume || 0) - Number(baseline.volume || 0));
    let state = 'STABLE';
    if (delta > 30 || volumeDelta > 25) state = 'CHANGING';
    if (delta > 60 || volumeDelta > 50) state = 'ANOMALOUS';
    baseline.state = state;
    return { ...baseline, state };
  }
}

export class IdentityBehaviorSignal {
  constructor({ identityId, eventType, source, confidence = 'MEDIUM', severity = 'MEDIUM', metadata = {} }) {
    this.identityId = identityId;
    this.eventType = eventType;
    this.source = source;
    this.confidence = String(confidence).toUpperCase();
    this.severity = String(severity).toUpperCase();
    this.metadata = sanitizeRecord(metadata || {});
    this.timestamp = nowIso();
  }
}

export class IdentityBehaviorAnalytics {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.signals = [];
  }

  recordEvent({ identityId, eventType, source, confidence = 'MEDIUM', severity = 'MEDIUM', metadata = {} }) {
    const signal = new IdentityBehaviorSignal({ identityId, eventType, source, confidence, severity, metadata });
    this.signals.push(signal);
    return signal;
  }

  summarize() {
    return {
      totalSignals: this.signals.length,
      unusualAccess: this.signals.filter((item) => /UNUSUAL|PRIVILEGE|DORMANT/.test(item.eventType)).length,
      organizationId: this.organizationId,
    };
  }
}

export class ApplicationBehaviorAnalytics {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.signals = [];
  }

  observe({ applicationId, eventType, score = 0, metadata = {} }) {
    const item = {
      applicationId,
      eventType,
      score: clamp(score),
      metadata: sanitizeRecord(metadata || {}),
      observedAt: nowIso(),
      organizationId: this.organizationId,
    };
    this.signals.push(item);
    return item;
  }

  calculateApplicationScore(applicationId) {
    const matches = this.signals.filter((signal) => signal.applicationId === applicationId);
    const value = matches.length ? matches.reduce((sum, signal) => sum + signal.score, 0) / matches.length : 0;
    return { applicationId, score: clamp(value), organizationId: this.organizationId };
  }
}

export class DeveloperSecurityBehaviorEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.behavior = [];
  }

  record({ developerId, eventType, risk = 0, metadata = {} }) {
    const signal = {
      developerId,
      eventType,
      risk: clamp(risk),
      metadata: sanitizeRecord(metadata || {}),
      recordedAt: nowIso(),
      organizationId: this.organizationId,
    };
    this.behavior.push(signal);
    return signal;
  }

  summarize() {
    return {
      total: this.behavior.length,
      highRisk: this.behavior.filter((signal) => signal.risk >= 70).length,
      organizationId: this.organizationId,
    };
  }
}

export class CloudBehaviorAnalytics {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.signals = [];
  }

  record({ resourceId, eventType, confidence = 'MEDIUM', metadata = {} }) {
    const signal = {
      resourceId,
      eventType,
      confidence: String(confidence).toUpperCase(),
      metadata: sanitizeRecord(metadata || {}),
      time: nowIso(),
      organizationId: this.organizationId,
    };
    this.signals.push(signal);
    return signal;
  }
}

export class PipelineBehaviorAnalytics {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.events = [];
  }

  record({ pipelineId, eventType, confidence = 'MEDIUM', metadata = {} }) {
    const event = {
      pipelineId,
      eventType,
      confidence: String(confidence).toUpperCase(),
      metadata: sanitizeRecord(metadata || {}),
      observedAt: nowIso(),
      organizationId: this.organizationId,
    };
    this.events.push(event);
    return event;
  }
}

export class SecurityAnomaly {
  constructor({ anomalyId, entityId, entityType, anomalyScore, confidence, baseline, observedBehavior, deviation, reason, status = 'UNUSUAL', supportingSignals = [] }) {
    this.anomalyId = anomalyId || `anomaly_${hash(`${entityId}:${Date.now()}`)}`;
    this.entityId = entityId;
    this.entityType = entityType;
    this.anomalyScore = clamp(anomalyScore);
    this.confidence = clamp(confidence);
    this.baseline = baseline;
    this.observedBehavior = observedBehavior;
    this.deviation = deviation;
    this.reason = reason;
    this.status = String(status).toUpperCase();
    this.supportingSignals = supportingSignals;
    this.createdAt = nowIso();
  }
}

export class SecurityAnomalyEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.anomalies = [];
  }

  detect({ entityId, entityType, baseline = 0, observedBehavior = 0, deviation = 0, reason = 'Behavior deviation', status = 'UNUSUAL', supportingSignals = [] }) {
    const anomalyScore = clamp((Number(observedBehavior || 0) - Number(baseline || 0)) * 2 + Number(deviation || 0));
    const confidence = clamp((anomalyScore / 100) * 100 + (supportingSignals.length * 5));
    const anomaly = new SecurityAnomaly({ anomalyId: `anomaly_${hash(`${this.organizationId}:${entityId}:${reason}`)}`, entityId, entityType, anomalyScore, confidence, baseline, observedBehavior, deviation, reason, status, supportingSignals });
    this.anomalies.push(anomaly);
    return anomaly;
  }
}

export class TemporalSecurityEvent {
  constructor({ eventId, entityId, entityType, eventType, occursAt, metadata = {} }) {
    this.eventId = eventId || `temporal_${hash(`${entityId}:${eventType}:${occursAt}`)}`;
    this.entityId = entityId;
    this.entityType = entityType;
    this.eventType = eventType;
    this.occursAt = occursAt || nowIso();
    this.metadata = sanitizeRecord(metadata || {});
  }
}

export class TemporalSecurityEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.events = [];
  }

  addEvent({ entityId, entityType, eventType, occursAt = nowIso(), metadata = {} }) {
    const event = new TemporalSecurityEvent({ eventId: `event_${hash(`${this.organizationId}:${entityId}:${eventType}:${occursAt}`)}`, entityId, entityType, eventType, occursAt, metadata });
    this.events.push(event);
    return event;
  }

  query({ entityId, before, after, rangeStart, rangeEnd }) {
    const list = this.events.filter((event) => {
      const matches = !entityId || event.entityId === entityId;
      const time = new Date(event.occursAt).getTime();
      const beforeMatch = before ? time <= before : true;
      const afterMatch = after ? time >= after : true;
      const rangeMatch = (rangeStart ? time >= new Date(rangeStart).getTime() : true) && (rangeEnd ? time <= new Date(rangeEnd).getTime() : true);
      return matches && beforeMatch && afterMatch && rangeMatch;
    });
    return list;
  }
}

export class SecurityCampaign {
  constructor({ campaignId, name, confidence = 'MEDIUM', status = 'DETECTED', signals = [], assets = [], identities = [] }) {
    this.campaignId = campaignId || `campaign_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.name = name;
    this.confidence = String(confidence).toUpperCase();
    this.status = String(status).toUpperCase();
    this.signals = signals;
    this.assets = assets;
    this.identities = identities;
    this.createdAt = nowIso();
  }
}

export class SecurityCampaignDetectionEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.campaigns = new Map();
  }

  detect({ campaignId, name, signals = [], assets = [], identities = [], confidence = 'MEDIUM', status = 'DETECTED' }) {
    const campaign = new SecurityCampaign({ campaignId, name, confidence, status, signals, assets, identities });
    this.campaigns.set(campaign.campaignId, campaign);
    return campaign;
  }
}

export class PredictedAttackPath {
  constructor({ path, probabilityScore, confidence, supportingSignals = [], blockedBy = [], missingControls = [], impact = 'MEDIUM' }) {
    this.path = Array.isArray(path) ? path : [];
    this.probabilityScore = clamp(probabilityScore);
    this.confidence = clamp(confidence);
    this.supportingSignals = supportingSignals;
    this.blockedBy = blockedBy;
    this.missingControls = missingControls;
    this.impact = String(impact).toUpperCase();
    this.createdAt = nowIso();
  }
}

export class AttackPathPredictionEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.graph = new SecurityGraphService({ organizationId });
    this.predictions = [];
  }

  predict({ sourceEntityId, targetEntityId, supportingSignals = [], blockedBy = [], missingControls = [], probabilityScore = 0, confidence = 0, impact = 'MEDIUM' }) {
    const path = [String(sourceEntityId), '->', String(targetEntityId)];
    const prediction = new PredictedAttackPath({ path, probabilityScore, confidence, supportingSignals, blockedBy, missingControls, impact });
    this.predictions.push(prediction);
    return prediction;
  }
}

export class PotentialBlastRadius {
  constructor({ scenario, affectedAssets = [], affectedIdentities = [], affectedApplications = [], impact = 'LOW' }) {
    this.scenario = scenario;
    this.affectedAssets = affectedAssets;
    this.affectedIdentities = affectedIdentities;
    this.affectedApplications = affectedApplications;
    this.impact = String(impact).toUpperCase();
    this.createdAt = nowIso();
  }
}

export class SecurityImpactSimulationEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.simulations = [];
  }

  simulate({ scenario = 'compromised application', affectedAssets = [], affectedIdentities = [], affectedApplications = [], impact = 'MEDIUM' }) {
    const result = new PotentialBlastRadius({ scenario, affectedAssets, affectedIdentities, affectedApplications, impact });
    this.simulations.push(result);
    return result;
  }
}

export class SecuritySignalConfidenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
  }

  score({ sourceReliability = 50, evidenceFreshness = 50, independentSignals = 1, detectionReliability = 50, historicalPrecision = 50, corroboration = 0, completeness = 50 }) {
    const score = clamp(
      Number(sourceReliability || 0) * 0.2 +
      Number(evidenceFreshness || 0) * 0.2 +
      Number(independentSignals || 0) * 5 +
      Number(detectionReliability || 0) * 0.15 +
      Number(historicalPrecision || 0) * 0.15 +
      Number(corroboration || 0) * 0.1 +
      Number(completeness || 0) * 0.2,
      0,
      100,
    );
    return { confidence: score, evidence: { sourceReliability, evidenceFreshness, independentSignals, detectionReliability, historicalPrecision, corroboration, completeness }, organizationId: this.organizationId };
  }
}

export class ThreatHuntingQueryEngineV2 {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
  }

  parse(query) {
    const normalized = String(query || '').trim();
    return {
      raw: normalized,
      terms: normalized.split(/\s+/).filter(Boolean),
      mode: normalized.toUpperCase().startsWith('FIND') ? 'FIND' : 'QUERY',
      organizationId: this.organizationId,
    };
  }

  validate(parsed) {
    const invalid = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE'];
    return !invalid.some((term) => parsed.terms.some((part) => part.toUpperCase() === term));
  }

  execute(query) {
    const parsed = this.parse(query);
    if (!this.validate(parsed)) {
      throw new Error('Query validation failed');
    }
    return {
      organizationId: this.organizationId,
      query: parsed.raw,
      results: [],
      pagination: { page: 1, pageSize: 25 },
      executedAt: nowIso(),
    };
  }
}

export class AdvancedDetectionEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.rules = new Map();
  }

  createRule({ ruleId, name, type = 'BEHAVIORAL', conditions = [], lifecycle = 'DRAFT', precision = 90, falsePositiveRate = 8, falseNegativeCoverage = 0 }) {
    const rule = {
      ruleId,
      name,
      type: String(type).toUpperCase(),
      conditions,
      lifecycle: String(lifecycle).toUpperCase(),
      precision: clamp(precision),
      falsePositiveRate: clamp(falsePositiveRate),
      falseNegativeCoverage: clamp(falseNegativeCoverage),
      executionCount: 0,
      organizationId: this.organizationId,
      createdAt: nowIso(),
    };
    this.rules.set(ruleId, rule);
    return rule;
  }

  execute(ruleId, eventSet = []) {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;
    rule.executionCount += 1;
    return {
      ruleId,
      matched: eventSet.length > 0,
      detected: eventSet.length > 0,
      latencyMs: 25,
      confidence: clamp(rule.precision - rule.falsePositiveRate),
      organizationId: this.organizationId,
      evaluatedAt: nowIso(),
      lifecycle: rule.lifecycle,
    };
  }
}

export class InvestigationSnapshot {
  constructor({ caseId, title, affectedAssets = [], identities = [], events = [], evidence = [], confidence = 50 }) {
    this.caseId = caseId;
    this.title = title;
    this.affectedAssets = affectedAssets;
    this.identities = identities;
    this.events = events;
    this.evidence = evidence;
    this.confidence = clamp(confidence);
    this.createdAt = nowIso();
  }
}

export class InvestigationIntelligenceEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.snapshots = new Map();
  }

  openCase({ caseId, title, affectedAssets = [], identities = [], events = [], evidence = [], confidence = 50 }) {
    const snapshot = new InvestigationSnapshot({ caseId, title, affectedAssets, identities, events, evidence, confidence });
    this.snapshots.set(caseId, snapshot);
    return snapshot;
  }
}

export class AIThreatHunter {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.allowedTools = [
      'searchSecurityEvents',
      'searchAnomalies',
      'identifyRelatedEntities',
      'correlateThreatIntelligence',
      'explainAttackPaths',
      'compareTimelines',
      'identifyEvidenceGaps',
      'prioritizeInvestigations',
    ];
  }

  sanitize(input) {
    return sanitizeRecord(input || {});
  }

  investigate({ hypothesis, context = {} }) {
    return {
      organizationId: this.organizationId,
      fact: 'Threat hypotheses are derived from sanitized and authorized metadata only.',
      inference: `Hypothesis ${hypothesis || 'unknown'} remains a non-destructive investigation suggestion.`,
      hypothesis,
      recommendation: 'Review correlated evidence and authorize any response action.',
      tools: this.allowedTools,
      sanitizedContext: this.sanitize(context),
      generatedAt: nowIso(),
    };
  }
}

export class ThreatResponsePlan {
  constructor({ planId, actions = [], dryRun = true, approvalRequired = true, policy = 'default' }) {
    this.planId = planId || `plan_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.actions = actions;
    this.dryRun = Boolean(dryRun);
    this.approvalRequired = Boolean(approvalRequired);
    this.policy = policy;
    this.createdAt = nowIso();
  }
}

export class ThreatResponseOrchestrator {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.plans = new Map();
  }

  plan({ planId, actions = [], dryRun = true, approvalRequired = true, policy = 'default' }) {
    const plan = new ThreatResponsePlan({ planId, actions, dryRun, approvalRequired, policy });
    this.plans.set(plan.planId, plan);
    return plan;
  }

  execute(planId, { approved = false } = {}) {
    const plan = this.plans.get(planId);
    if (!plan) return null;
    const safe = plan.dryRun || approved;
    return {
      planId,
      dryRun: plan.dryRun,
      approved,
      status: safe ? 'READY' : 'REQUIRES_APPROVAL',
      organizationId: this.organizationId,
      executedAt: nowIso(),
    };
  }
}

export class PredictiveSecurityPostureEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
  }

  forecast({ riskTrend = 50, exposureTrend = 50, vulnerabilityBacklog = 50, controlDegradation = 50, identityRiskGrowth = 50, attackSurfaceGrowth = 50, confidence = 50 }) {
    const composite = clamp((Number(riskTrend || 0) + Number(exposureTrend || 0) + Number(vulnerabilityBacklog || 0) + Number(controlDegradation || 0) + Number(identityRiskGrowth || 0) + Number(attackSurfaceGrowth || 0)) / 6);
    return {
      organizationId: this.organizationId,
      forecast: `Based on current trends, there is a ${composite >= 70 ? 'HIGH' : composite >= 40 ? 'MODERATE' : 'LOW'} likelihood of posture degradation within the next 14 days.`,
      confidence: clamp(confidence),
      drivers: { riskTrend, exposureTrend, vulnerabilityBacklog, controlDegradation, identityRiskGrowth, attackSurfaceGrowth },
      createdAt: nowIso(),
    };
  }
}

export class ThreatIntelligenceCommandCenter {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.summary = {
      threatExposure: 0,
      activeThreats: 0,
      campaigns: 0,
      relevantAssets: 0,
      anomalies: 0,
    };
  }

  summarize({ threatExposure = 0, activeThreats = 0, campaigns = 0, relevantAssets = 0, anomalies = 0 }) {
    this.summary = { threatExposure, activeThreats, campaigns, relevantAssets, anomalies, organizationId: this.organizationId, generatedAt: nowIso() };
    return this.summary;
  }
}

export class Command38ThreatIntelligencePlatform {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.ingestion = new ThreatIntelligenceIngestionFabric({ organizationId });
    this.normalization = new ThreatIntelligenceNormalizationEngine({ organizationId });
    this.iocs = new IOCIntelligenceEngine({ organizationId });
    this.actorIntel = new ThreatActorIntelligenceEngine({ organizationId });
    this.assetCorrelation = new ThreatAssetCorrelationEngine({ organizationId });
    this.exposure = new ThreatExposureEngine({ organizationId });
    this.behaviorBaseline = new SecurityBehaviorBaselineEngine({ organizationId });
    this.identityBehavior = new IdentityBehaviorAnalytics({ organizationId });
    this.applicationBehavior = new ApplicationBehaviorAnalytics({ organizationId });
    this.developerBehavior = new DeveloperSecurityBehaviorEngine({ organizationId });
    this.cloudBehavior = new CloudBehaviorAnalytics({ organizationId });
    this.pipelineBehavior = new PipelineBehaviorAnalytics({ organizationId });
    this.anomalies = new SecurityAnomalyEngine({ organizationId });
    this.temporal = new TemporalSecurityEngine({ organizationId });
    this.campaigns = new SecurityCampaignDetectionEngine({ organizationId });
    this.attackPaths = new AttackPathPredictionEngine({ organizationId });
    this.blastRadius = new SecurityImpactSimulationEngine({ organizationId });
    this.confidence = new SecuritySignalConfidenceEngine({ organizationId });
    this.hunt = new ThreatHuntingQueryEngineV2({ organizationId });
    this.detection = new AdvancedDetectionEngine({ organizationId });
    this.investigations = new InvestigationIntelligenceEngine({ organizationId });
    this.aiHunter = new AIThreatHunter({ organizationId });
    this.response = new ThreatResponseOrchestrator({ organizationId });
    this.predictions = new PredictiveSecurityPostureEngine({ organizationId });
    this.center = new ThreatIntelligenceCommandCenter({ organizationId });
  }
}

export const command38ThreatPlatform = new Command38ThreatIntelligencePlatform({ organizationId: 'default-org' });
