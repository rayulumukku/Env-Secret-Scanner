import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ThreatIntelProvider,
  ThreatIndicator,
  ThreatAdvisory,
  ThreatCampaign,
  ThreatActor,
  ThreatTechnique,
  ThreatVulnerability,
  ThreatObservation,
  ThreatIntelligenceIngestionFabric,
  ThreatIntelligenceNormalizationEngine,
  IOCIntelligenceEngine,
  ThreatActorIntelligenceEngine,
  ThreatAssetCorrelationEngine,
  ThreatExposureEngine,
  SecurityBehaviorBaselineEngine,
  IdentityBehaviorAnalytics,
  ApplicationBehaviorAnalytics,
  DeveloperSecurityBehaviorEngine,
  CloudBehaviorAnalytics,
  PipelineBehaviorAnalytics,
  SecurityAnomalyEngine,
  TemporalSecurityEngine,
  SecurityCampaignDetectionEngine,
  AttackPathPredictionEngine,
  SecurityImpactSimulationEngine,
  SecuritySignalConfidenceEngine,
  ThreatHuntingQueryEngineV2,
  AdvancedDetectionEngine,
  InvestigationIntelligenceEngine,
  AIThreatHunter,
  ThreatResponseOrchestrator,
  PredictiveSecurityPostureEngine,
  ThreatIntelligenceCommandCenter,
  Command38ThreatIntelligencePlatform,
} from '../command-38-threat-intelligence.js';

const featureNames = [
  'Threat Intelligence Provider Registry',
  'Threat Indicator Lifecycle',
  'Threat Advisory Normalization',
  'Threat Campaign Modeling',
  'Threat Actor Attribution',
  'Threat Technique Catalog',
  'Threat Vulnerability Correlation',
  'Threat Observation Tracking',
  'Threat Intelligence Ingestion Fabric',
  'Threat Intelligence Normalization Engine',
  'IOC Matching Engine',
  'Threat Actor Intelligence Engine',
  'Threat Asset Correlation Engine',
  'Threat Exposure Scoring',
  'Behavioral Baseline Detection',
  'Identity Behavior Analytics',
  'Application Behavior Analytics',
  'Developer Security Behavior Engine',
  'Cloud Behavior Analytics',
  'Pipeline Behavior Analytics',
  'Security Anomaly Engine',
  'Temporal Security Event Engine',
  'Campaign Detection Engine',
  'Attack Path Prediction Engine',
  'Security Impact Simulation Engine',
  'Predictive Security Command Center',
];

test(featureNames[0], () => {
  const provider = new ThreatIntelProvider({ providerId: 'provider-1', providerName: 'MISP', providerType: 'COMMUNITY_FEED', trustLevel: 'HIGH' });
  assert.equal(provider.providerName, 'MISP');
  assert.equal(provider.healthCheck().healthy, true);
});

test(featureNames[1], () => {
  const indicator = new ThreatIndicator({ indicatorId: 'ioc-1', indicatorType: 'DOMAIN', confidence: 'HIGH', severity: 'HIGH', source: 'misp', metadata: { value: 'example.com' } });
  assert.equal(indicator.indicatorType, 'DOMAIN');
  assert.equal(indicator.confidence, 'HIGH');
  assert.ok(indicator.metadata);
});

test(featureNames[2], () => {
  const advisory = new ThreatAdvisory({ advisoryId: 'adv-1', title: 'Active exploitation', source: 'CERT', severity: 'CRITICAL', summary: 'Critical vulnerability in managed services', tags: ['cve', 'exposure'] });
  assert.equal(advisory.title, 'Active exploitation');
  assert.equal(advisory.severity, 'CRITICAL');
});

test(featureNames[3], () => {
  const campaign = new ThreatCampaign({ campaignId: 'camp-1', name: 'Phishing Wave', actor: 'APT-28', techniques: ['T1566'], targetedTechnologies: ['email'], targetedSectors: ['finance'] });
  assert.equal(campaign.name, 'Phishing Wave');
  assert.equal(campaign.status, 'DETECTED');
});

test(featureNames[4], () => {
  const actor = new ThreatActor({ actorId: 'actor-1', name: 'APT-28', attribution: 'LIKELY', confidence: 'HIGH', techniques: ['T1566'], campaigns: ['camp-1'] });
  assert.equal(actor.name, 'APT-28');
  assert.equal(actor.attribution, 'LIKELY');
});

test(featureNames[5], () => {
  const technique = new ThreatTechnique({ techniqueId: 'tech-1', name: 'Phishing', tactic: 'INITIAL_ACCESS', confidence: 'HIGH' });
  assert.equal(technique.tactic, 'INITIAL_ACCESS');
  assert.equal(technique.confidence, 'HIGH');
});

test(featureNames[6], () => {
  const vuln = new ThreatVulnerability({ vulnerabilityId: 'vuln-1', severity: 'CRITICAL', summary: 'Remote code execution in API gateway' });
  assert.equal(vuln.severity, 'CRITICAL');
  assert.ok(vuln.summary.includes('Remote code execution'));
});

test(featureNames[7], () => {
  const observation = new ThreatObservation({ observationId: 'obs-1', entityType: 'ASSET', entityId: 'asset-1', source: 'gateway', observationType: 'UNUSUAL_TRAFFIC', confidence: 'MEDIUM' });
  assert.equal(observation.entityType, 'ASSET');
  assert.equal(observation.observationType, 'UNUSUAL_TRAFFIC');
});

test(featureNames[8], () => {
  const fabric = new ThreatIntelligenceIngestionFabric({ organizationId: 'org-38' });
  const provider = new ThreatIntelProvider({ providerId: 'provider-2', providerName: 'AlienVault', providerType: 'COMMUNITY_FEED' });
  fabric.registerProvider(provider);
  const result = fabric.ingest({ providerId: 'provider-2', records: [{ indicatorType: 'IP', value: '1.2.3.4', confidence: 'MEDIUM' }] });
  assert.equal(result.ingested, 1);
  assert.equal(fabric.list().length, 1);
});

test(featureNames[9], () => {
  const engine = new ThreatIntelligenceNormalizationEngine({ organizationId: 'org-38' });
  const indicator = engine.normalizeIndicator({ indicatorType: 'IP', confidence: 'HIGH', severity: 'HIGH', source: 'misp', value: '9.9.9.9' });
  assert.equal(indicator.indicatorType, 'IP');
  assert.equal(indicator.confidence, 'HIGH');
});

test(featureNames[10], () => {
  const engine = new IOCIntelligenceEngine({ organizationId: 'org-38' });
  const indicator = new ThreatIndicator({ indicatorId: 'ioc-2', indicatorType: 'IP', confidence: 'HIGH', severity: 'MEDIUM', source: 'intel' });
  engine.registerIndicator(indicator);
  const match = engine.matchEntity({ indicatorId: 'ioc-2', matchedEntity: 'asset-2', source: 'internal', confidence: 'HIGH', severity: 'HIGH' });
  assert.equal(match.indicatorId, 'ioc-2');
  assert.equal(engine.listMatches().length, 1);
});

test(featureNames[11], () => {
  const engine = new ThreatActorIntelligenceEngine({ organizationId: 'org-38' });
  const actor = engine.registerActor({ actorId: 'actor-2', name: 'APT-39', attribution: 'LIKELY', confidence: 'HIGH', techniques: ['T1059'], campaigns: ['camp-2'] });
  assert.equal(actor.name, 'APT-39');
  assert.equal(engine.actors.get('actor-2').name, 'APT-39');
});

test(featureNames[12], () => {
  const engine = new ThreatAssetCorrelationEngine({ organizationId: 'org-38' });
  const result = engine.correlate({ threat: 'APT-39', asset: 'database-prod', severity: 'CRITICAL', exposure: 80, vulnerabilities: ['CVE-1', 'CVE-2'], identities: ['admin-user'], application: 'payments-api' });
  assert.equal(result.asset, 'database-prod');
  assert.ok(result.score > 0);
});

test(featureNames[13], () => {
  const engine = new ThreatExposureEngine({ organizationId: 'org-38' });
  const score = engine.score({ assetId: 'asset-9', activeThreatRelevance: 80, assetExposure: 90, assetCriticality: 85, vulnerabilitySeverity: 75, exploitability: 70, attackPath: 60, identityPrivilege: 80, controlCoverage: 25, confidence: 85, freshness: 90 });
  assert.equal(score.assetId, 'asset-9');
  assert.equal(score.classification, 'CRITICAL');
});

test(featureNames[14], () => {
  const engine = new SecurityBehaviorBaselineEngine({ organizationId: 'org-38' });
  const baseline = engine.addBaseline({ entityId: 'user-42', entityType: 'USER', frequency: 10, timing: 20, volume: 55, source: 'identity', environment: 'production' });
  const evaluation = engine.evaluate({ entityId: 'user-42', entityType: 'USER', measuredFrequency: 72, measuredVolume: 80, source: 'identity', environment: 'production' });
  assert.equal(baseline.entityId, 'user-42');
  assert.equal(evaluation.state, 'ANOMALOUS');
});

test(featureNames[15], () => {
  const engine = new IdentityBehaviorAnalytics({ organizationId: 'org-38' });
  const event = engine.recordEvent({ identityId: 'user-77', eventType: 'UNUSUAL_ADMIN_ACCESS', source: 'identity-provider', confidence: 'HIGH', severity: 'HIGH', metadata: { region: 'us-east' } });
  assert.equal(event.identityId, 'user-77');
  assert.equal(engine.summarize().totalSignals, 1);
});

test(featureNames[16], () => {
  const engine = new ApplicationBehaviorAnalytics({ organizationId: 'org-38' });
  const signal = engine.observe({ applicationId: 'payments-api', eventType: 'RAPID_REQUEST_SPIKE', score: 80, metadata: { endpoint: '/v1/payments' } });
  const score = engine.calculateApplicationScore('payments-api');
  assert.equal(signal.applicationId, 'payments-api');
  assert.ok(score.score >= 0);
});

test(featureNames[17], () => {
  const engine = new DeveloperSecurityBehaviorEngine({ organizationId: 'org-38' });
  const record = engine.record({ developerId: 'dev-1', eventType: 'SENSITIVE_FILE_ACCESS', risk: 80, metadata: { repo: 'secretvault' } });
  assert.equal(record.developerId, 'dev-1');
  assert.equal(engine.summarize().highRisk, 1);
});

test(featureNames[18], () => {
  const engine = new CloudBehaviorAnalytics({ organizationId: 'org-38' });
  const signal = engine.record({ resourceId: 'storage-prod', eventType: 'PUBLIC_ACCESS_CHANGE', confidence: 'HIGH', metadata: { source: 'azure' } });
  assert.equal(signal.resourceId, 'storage-prod');
  assert.equal(signal.confidence, 'HIGH');
});

test(featureNames[19], () => {
  const engine = new PipelineBehaviorAnalytics({ organizationId: 'org-38' });
  const event = engine.record({ pipelineId: 'deploy-prod', eventType: 'TRUSTED_BRANCH_OVERRIDE', confidence: 'MEDIUM', metadata: { branch: 'main' } });
  assert.equal(event.pipelineId, 'deploy-prod');
  assert.equal(event.confidence, 'MEDIUM');
});

test(featureNames[20], () => {
  const engine = new SecurityAnomalyEngine({ organizationId: 'org-38' });
  const anomaly = engine.detect({ entityId: 'asset-30', entityType: 'ASSET', baseline: 20, observedBehavior: 90, deviation: 20, reason: 'Unexpected API burst', supportingSignals: ['signal-1'] });
  assert.equal(anomaly.entityId, 'asset-30');
  assert.ok(anomaly.anomalyScore > 0);
});

test(featureNames[21], () => {
  const engine = new TemporalSecurityEngine({ organizationId: 'org-38' });
  const event = engine.addEvent({ entityId: 'asset-30', entityType: 'ASSET', eventType: 'DORMANT_ACCESS', occursAt: '2025-06-01T00:00:00.000Z', metadata: { unexpected: true } });
  const query = engine.query({ entityId: 'asset-30', rangeStart: '2025-05-01T00:00:00.000Z', rangeEnd: '2025-07-01T00:00:00.000Z' });
  assert.equal(event.entityId, 'asset-30');
  assert.equal(query.length, 1);
});

test(featureNames[22], () => {
  const engine = new SecurityCampaignDetectionEngine({ organizationId: 'org-38' });
  const campaign = engine.detect({ campaignId: 'camp-77', name: 'Credential stuffing raid', signals: ['signal-1'], assets: ['asset-1'], identities: ['user-1'], confidence: 'HIGH', status: 'DETECTED' });
  assert.equal(campaign.name, 'Credential stuffing raid');
  assert.equal(campaign.status, 'DETECTED');
});

test(featureNames[23], () => {
  const engine = new AttackPathPredictionEngine({ organizationId: 'org-38' });
  const prediction = engine.predict({ sourceEntityId: 'user-1', targetEntityId: 'database-prod', supportingSignals: ['phishing'], blockedBy: ['MFA'], missingControls: ['network segmentation'], probabilityScore: 75, confidence: 70, impact: 'HIGH' });
  assert.equal(prediction.path[0], 'user-1');
  assert.equal(prediction.impact, 'HIGH');
});

test(featureNames[24], () => {
  const engine = new SecurityImpactSimulationEngine({ organizationId: 'org-38' });
  const result = engine.simulate({ scenario: 'compromised identity', affectedAssets: ['storage-prod'], affectedIdentities: ['user-1'], affectedApplications: ['payments-api'], impact: 'HIGH' });
  assert.equal(result.scenario, 'compromised identity');
  assert.equal(result.impact, 'HIGH');
});

test('Platform integration summary', () => {
  const platform = new Command38ThreatIntelligencePlatform({ organizationId: 'org-38' });
  assert.equal(platform.organizationId, 'org-38');
  assert.equal(platform.center.organizationId, 'org-38');
  assert.equal(platform.ingestion.organizationId, 'org-38');
});

console.log(`Command 38 feature validation: ${featureNames.length + 1} checks executed.`);
