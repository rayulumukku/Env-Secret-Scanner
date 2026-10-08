import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UniversalAssetDiscoveryEngine,
  DigitalAssetInventoryEngine,
  InternetExposureEngine,
  ApplicationSecurityInventory,
  APISecurityInventory,
  CloudPostureEngine,
  KubernetesSecurityIntelligenceEngine,
  PipelineSecurityEngine,
  SourceSecurityIntelligenceEngine,
  SecurityConfigurationPostureEngine,
  SecurityBaselineManager,
  VulnerabilityIntelligenceEngine,
  ExposurePrioritizationEngine,
  FindingCorrelationEngine,
  AttackSurfaceManagementEngine,
  RiskPropagationEngine,
  ContinuousSecurityDiscoveryScheduler,
  SecuritySignalCorrelationEngine,
  SecurityEventStream,
  RetentionIntelligenceEngine,
  ThreatHuntingWorkbench,
  DetectionRuleLaboratory,
  AISecurityAnalyst,
  SimulationLab,
  UniversalSecurityOperationsCenter,
  Command37UniversalSecurityPlatform,
} from '../command-37-universal-operations.js';

const featureNames = [
  'Universal Security Asset Discovery',
  'Digital Asset Inventory & Ownership Intelligence',
  'Internet Exposure Intelligence',
  'Application Security Inventory',
  'API Security Intelligence',
  'Cloud Security Posture Intelligence',
  'Kubernetes & Container Security Intelligence',
  'CI/CD & Build Pipeline Security Intelligence',
  'Source Code Security Intelligence',
  'Security Configuration Posture Management',
  'Security Baseline & Drift Management',
  'Vulnerability Intelligence Fusion',
  'Exposure Prioritization Engine',
  'Finding Deduplication & Root-Cause Intelligence',
  'Attack Surface Management',
  'Digital Risk Graph Expansion',
  'Continuous Security Discovery',
  'Security Signal Correlation Fabric',
  'Security Event Stream & Detection Pipeline',
  'Security Data Lifecycle & Retention Intelligence',
  'Advanced Threat Hunting Workbench',
  'Security Detection Rule Laboratory',
  'AI Security Analyst',
  'Security Response Simulation Laboratory',
  'Universal Security Operations Center',
];

test(featureNames[0], () => {
  const engine = new UniversalAssetDiscoveryEngine({ organizationId: 'org-37' });
  const asset = engine.addAsset({ assetId: 'repo-1', assetType: 'repo', organizationId: 'org-37', owner: 'platform', environment: 'production', source: 'github', discoveryMethod: 'metadata-sync' });
  assert.equal(asset.assetType, 'REPO');
  assert.equal(asset.lifecycleState, 'DISCOVERED');
  assert.equal(engine.list({ organizationId: 'org-37' }).length, 1);
});

test(featureNames[1], () => {
  const engine = new DigitalAssetInventoryEngine({ organizationId: 'org-37' });
  const record = engine.register({ assetId: 'app-1', assetType: 'application', owner: 'team-blue', team: 'blue', businessFunction: 'payments', environment: 'production', criticality: 'CRITICAL', dataClassification: 'CONFIDENTIAL', lifecycle: 'ACTIVE', technology: 'node' });
  assert.equal(record.ownershipState, 'OWNED');
  assert.equal(engine.getInventory().length, 1);
});

test(featureNames[2], () => {
  const engine = new InternetExposureEngine({ organizationId: 'org-37' });
  const record = engine.record({ assetId: 'domain-1', assetType: 'domain', domain: 'example.com', classification: 'PUBLIC', environment: 'production', publicFacing: true, severity: 'CRITICAL', criticality: 95 });
  assert.equal(record.classification, 'PUBLIC');
  assert.ok(record.exposureScore >= 70);
  assert.equal(engine.summarize().public >= 1, true);
});

test(featureNames[3], () => {
  const engine = new ApplicationSecurityInventory({ organizationId: 'org-37' });
  const app = engine.register({ applicationId: 'app-main', name: 'Main', posture: 'HEALTHY', risk: 20, secretsMetadata: [{ fingerprint: 'fp-1' }], dependencies: ['oauth'], apis: ['api-1'], cloudResources: ['cloud-1'] });
  assert.equal(app.securityPosture, 'HEALTHY');
  assert.equal(engine.get('app-main').applicationId, 'app-main');
});

test(featureNames[4], () => {
  const engine = new APISecurityInventory({ organizationId: 'org-37' });
  const api = engine.register({ endpoint: '/v1/orders', api: 'orders-api', application: 'orders', exposure: 'PUBLIC', authentication: 'NONE', vulnerabilities: ['CVE-123'], findings: ['finding-1'] });
  assert.equal(api.exposure, 'PUBLIC');
  assert.equal(api.apiSecurityScore > 0, true);
});

test(featureNames[5], () => {
  const engine = new CloudPostureEngine({ organizationId: 'org-37' });
  const resource = engine.registerResource({ resourceId: 'resource-1', resourceType: 'storage', account: 'acct-1', region: 'eastus', project: 'prod', publicResource: true, posture: 'DEGRADED', missingControls: ['encryption'], violations: ['public access'], drift: 15 });
  assert.equal(resource.posture, 'DEGRADED');
  assert.equal(engine.summarize().public >= 1, true);
});

test(featureNames[6], () => {
  const engine = new KubernetesSecurityIntelligenceEngine({ organizationId: 'org-37' });
  const cluster = engine.registerCluster({ clusterId: 'cluster-1', namespace: 'prod', owner: 'platform', publicIngress: true, posture: 'AT_RISK' });
  const workload = engine.registerWorkload({ workloadId: 'workload-1', clusterId: 'cluster-1', namespace: 'prod', privileged: true, publicService: true, imageRisk: 65, serviceAccountRisk: 60, owner: 'platform', posture: 'CRITICAL' });
  assert.equal(cluster.posture, 'AT_RISK');
  assert.equal(workload.posture, 'CRITICAL');
  assert.equal(engine.summarize().privileged >= 1, true);
});

test(featureNames[7], () => {
  const engine = new PipelineSecurityEngine({ organizationId: 'org-37' });
  const pipeline = engine.register({ pipelineId: 'pipe-1', repository: 'repo-1', workflow: 'deploy-prod', environment: 'production', branchProtection: false, securityGates: [], permissions: ['write'], secretsReferences: ['token'] });
  assert.equal(pipeline.posture, 'UNKNOWN');
  assert.equal(engine.summarize().missingGates >= 1, true);
});

test(featureNames[8], () => {
  const engine = new SourceSecurityIntelligenceEngine({ organizationId: 'org-37' });
  const finding = engine.createFinding({ ruleId: 'rule-1', assetId: 'repo-1', severity: 'HIGH', confidence: 92, category: 'AUTHORIZATION', evidenceLocation: 'src/auth.js', explanation: 'Missing authorization check', remediation: 'add policy guard' });
  assert.equal(finding.severity, 'HIGH');
  assert.equal(engine.getFindings().length, 1);
});

test(featureNames[9], () => {
  const engine = new SecurityConfigurationPostureEngine({ organizationId: 'org-37' });
  const snapshot = engine.record({ assetId: 'asset-1', controlState: 'MISSING', violations: ['disabled mfa'], status: 'DEGRADED' });
  assert.equal(snapshot.status, 'DEGRADED');
  assert.equal(engine.summarize().degraded >= 1, true);
});

test(featureNames[10], () => {
  const engine = new SecurityBaselineManager({ organizationId: 'org-37' });
  const baseline = engine.createBaseline({ baselineId: 'repo-baseline', category: 'REPOSITORY', requiredControls: ['branch-protection', 'secret-scan'] });
  const drift = engine.evaluateDrift({ baselineId: 'repo-baseline', assetId: 'repo-1', assetType: 'repository', currentControls: ['secret-scan'], requiredControls: ['branch-protection', 'secret-scan'], riskIncrease: 25 });
  assert.equal(baseline.category, 'REPOSITORY');
  assert.equal(drift.drifted, true);
  assert.equal(engine.events.length >= 1, true);
});

test(featureNames[11], () => {
  const engine = new VulnerabilityIntelligenceEngine({ organizationId: 'org-37' });
  const vuln = engine.register({ vulnerabilityId: 'vuln-1', affectedAsset: 'asset-1', affectedApplication: 'app-main', severity: 'CRITICAL', exploitability: 90, exposure: 'PUBLIC', relevance: 75, remediation: 'patch framework', owner: 'team-blue', status: 'OPEN' });
  assert.equal(vuln.severity, 'CRITICAL');
  assert.equal(engine.dedupe().length, 1);
});

test(featureNames[12], () => {
  const engine = new ExposurePrioritizationEngine({ organizationId: 'org-37' });
  const result = engine.score({ exploitability: 95, internetExposure: 100, assetCriticality: 90, identityPrivilege: 80, attackPath: 65, threatRelevance: 85, runtimePresence: true, vulnerabilitySeverity: 90, controlWeakness: 80, businessImpact: 75, age: 30, recurrence: 3 });
  assert.equal(result.priority, 'P0');
  assert.ok(result.explanation.includes('P0'));
});

test(featureNames[13], () => {
  const engine = new FindingCorrelationEngine({ organizationId: 'org-37' });
  const cluster = engine.correlate({ clusterId: 'root-1', rootCauseType: 'DEPENDENCY', confidence: 88, severity: 'HIGH', affectedAssets: ['repo-1'], affectedFindings: ['f-1', 'f-2'], recommendedFix: 'upgrade dependency' });
  assert.equal(cluster.rootCauseType, 'DEPENDENCY');
  assert.equal(cluster.affectedAssets.length, 1);
});

test(featureNames[14], () => {
  const engine = new AttackSurfaceManagementEngine({ organizationId: 'org-37' });
  const record = engine.register({ assetId: 'public-app-1', assetType: 'APPLICATION', risk: 72, publicFacing: true, owner: 'unknown', isManaged: false });
  assert.equal(record.attackSurfaceScore > 70, true);
  assert.equal(engine.summarize().unmanaged >= 1, true);
});

test(featureNames[15], () => {
  const engine = new RiskPropagationEngine({ organizationId: 'org-37' });
  engine.addNode({ entityType: 'ASSET', entityId: 'asset-1', organizationId: 'org-37', metadata: { propagatedRisk: 10 } });
  engine.addNode({ entityType: 'ASSET', entityId: 'asset-2', organizationId: 'org-37', metadata: { propagatedRisk: 5 } });
  engine.addEdge({ sourceId: 'asset-1', sourceType: 'ASSET', targetId: 'asset-2', targetType: 'ASSET', relationshipType: 'DEPENDS_ON', organizationId: 'org-37' });
  const update = engine.propagateRisk({ assetId: 'asset-1', riskIncrease: 25, maxDepth: 2 });
  assert.equal(update.length >= 1, true);
});

test(featureNames[16], () => {
  const engine = new ContinuousSecurityDiscoveryScheduler({ organizationId: 'org-37' });
  const run = engine.schedule({ schedule: 'HOURLY', assetsDiscovered: 120, assetsChanged: 9, assetsRemoved: 1, status: 'SUCCESS', errors: 0, warnings: 2 });
  assert.equal(run.schedule, 'HOURLY');
  assert.equal(run.assetsDiscovered, 120);
});

test(featureNames[17], () => {
  const engine = new SecuritySignalCorrelationEngine({ organizationId: 'org-37' });
  const signal = engine.recordSignal({ assetId: 'asset-1', signalType: 'EXPOSURE', confidence: 80, severity: 'HIGH', metadata: { source: 'integration' } });
  const event = engine.correlate({ entityId: 'asset-1', eventType: 'RISK', confidence: 70, severity: 'MEDIUM', metadata: { source: 'graph' } });
  assert.equal(signal.signalType, 'EXPOSURE');
  assert.equal(event.entityId, 'asset-1');
});

test(featureNames[18], () => {
  const stream = new SecurityEventStream({ organizationId: 'org-37', maxQueue: 10 });
  const event = stream.emit({ eventType: 'DISCOVERY', entityId: 'asset-1', severity: 'CRITICAL', confidence: 90, source: 'asset-engine', metadata: { status: 'visible' } });
  const consumed = stream.consume();
  assert.equal(event.eventType, 'DISCOVERY');
  assert.equal(consumed.length, 1);
});

test(featureNames[19], () => {
  const engine = new RetentionIntelligenceEngine({ organizationId: 'org-37' });
  const policy = engine.createPolicy({ policyName: 'event-retention', retentionDays: 180, storageClass: 'WARM', legalHold: false });
  assert.equal(policy.storageClass, 'WARM');
  assert.equal(policy.organizationId, 'org-37');
});

test(featureNames[20], () => {
  const workbench = new ThreatHuntingWorkbench({ organizationId: 'org-37' });
  const query = workbench.search({ queryId: 'hunt-1', name: 'public assets with critical vulnerabilities', filters: ['public=true'], saved: true });
  const result = workbench.runQuery(query);
  assert.equal(query.name.includes('public'), true);
  assert.equal(result.queryId, 'hunt-1');
});

test(featureNames[21], () => {
  const lab = new DetectionRuleLaboratory({ organizationId: 'org-37' });
  const rule = lab.createRule({ ruleId: 'rule-90', version: '1.0.0', positiveFixtures: ['fixture-1'], negativeFixtures: ['fixture-2'], boundaryFixtures: ['fixture-3'], lifecycle: 'DRAFT' });
  const published = lab.publish('rule-90', '1.0.0');
  assert.equal(rule.lifecycle, 'PUBLISHED');
  assert.equal(published.lifecycle, 'PUBLISHED');
});

test(featureNames[22], () => {
  const analyst = new AISecurityAnalyst({ organizationId: 'org-37' });
  const result = analyst.investigate({ question: 'Find public production assets with critical vulnerabilities.', context: { asset: 'asset-1', token: 'secret-token' } });
  assert.equal(result.organizationId, 'org-37');
  assert.ok(result.sanitizedContext.includes('asset'));
  assert.ok(Array.isArray(result.toolset));
});

test(featureNames[23], () => {
  const lab = new SimulationLab({ organizationId: 'org-37' });
  const scenario = lab.createScenario({ scenarioId: 'sim-1', name: 'Synthetic exposure drill', stages: ['DISCOVERY', 'EXPOSURE', 'DETECTION', 'RESPONSE'] });
  const result = lab.executeScenario('sim-1');
  assert.equal(scenario.synthetic, true);
  assert.equal(result.result.controlsTriggered >= 1, true);
});

test(featureNames[24], () => {
  const soc = new UniversalSecurityOperationsCenter({ organizationId: 'org-37' });
  const summary = soc.summarize({ postureScore: 89, riskScore: 32, identityRisk: 28, attackSurfaceScore: 68, controlHealth: 91, assuranceScore: 87, governancePosture: 'HEALTHY', compliancePosture: 'MONITORING' });
  assert.equal(summary.organizationId, 'org-37');
  assert.equal(summary.whatIsHappening.includes('Security posture'), true);
});

test('Platform integration summary', () => {
  const platform = new Command37UniversalSecurityPlatform({ organizationId: 'org-37' });
  assert.equal(platform.getUnifiedPipeline().includes('DISCOVERY'), true);
  assert.equal(platform.getUnifiedPipeline().includes('EXECUTIVE INTELLIGENCE'), true);
  assert.equal(platform.soc.organizationId, 'org-37');
});

console.log(`Command 37 feature validation: ${featureNames.length + 1} checks executed.`);
