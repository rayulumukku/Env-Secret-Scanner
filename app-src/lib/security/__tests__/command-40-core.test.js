import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SecurityDigitalTwinEngine,
  DigitalTwinStateEngine,
  SecurityPostureSnapshotEngine,
  SecurityWhatIfEngine,
  ControlAssuranceGraph,
  SecurityControlCoverageEngine,
  SecurityObservabilityFabric,
  SecuritySLOEngine,
  SecurityReliabilityEngine,
  DetectionCoverageEngine,
  AttackPathCoverageEngine,
  SecurityBlindSpotEngine,
  SecurityKnowledgeGraph20,
  EvidenceLineageEngine,
  SecurityDecisionEngine,
  SecurityPriorityOptimizer,
  SecurityScenarioPlanningWorkbench,
  ContinuousAssuranceCampaignEngine,
  SecurityRegressionEngine,
  PostureChangeExplainer,
  AISecurityStrategist,
  AISecurityArchitect,
  AutonomousAssuranceAgent,
  SecurityExecutiveIntelligenceCenter,
  SecurityOperatingModel,
  command40FeatureMap,
  COMMAND_40_API_ROUTES,
  COMMAND_40_WORKERS,
  COMMAND_40_CLI_COMMANDS,
  COMMAND_40_UI_ROUTES,
} from '../command-40-security-digital-twin.js';

const featureNames = [
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

test(featureNames[0], () => {
  const twin = new SecurityDigitalTwinEngine({ organizationId: 'org-40' });
  const entity = twin.createEntity({ entityId: 'app-1', entityType: 'APPLICATION', organizationId: 'org-40', source: 'scanner', relationships: ['api-1', 'repo-1'], metadata: { secret: 'ghp_secret123', token: 'abc', owner: 'platform' } });
  assert.equal(entity.entityId, 'app-1');
  assert.equal(entity.organizationId, 'org-40');
  assert.equal(entity.state, 'CURRENT');
  assert.equal(entity.relationships.length >= 2, true);
  assert.equal(entity.metadata.secret, undefined);
  assert.equal(twin.getEntity('app-1').entityType, 'APPLICATION');
});

test(featureNames[1], () => {
  const engine = new DigitalTwinStateEngine({ organizationId: 'org-40' });
  const transition = engine.recordTransition({ entityId: 'app-1', previousState: 'SECURE', newState: 'EXPOSED', reason: 'public ingress observed', evidence: ['evidence-1'], source: 'scanner', confidence: 80 });
  const history = engine.getHistory('app-1');
  assert.equal(transition.previousState, 'SECURE');
  assert.equal(transition.newState, 'EXPOSED');
  assert.equal(history.length, 1);
});

test(featureNames[2], () => {
  const engine = new SecurityPostureSnapshotEngine({ organizationId: 'org-40' });
  const before = engine.capture({ snapshotId: 'snap-a', assets: ['app-1', 'api-1'], exposure: 12, risk: 75, identities: ['id-1'], vulnerabilities: ['vuln-1'], controls: ['mfa'], threats: ['campaign-1'], incidents: ['inc-1'], remediation: ['rem-1'], governance: ['policy-1'], attackPaths: ['path-1'], cadence: 'hourly' });
  const after = engine.capture({ snapshotId: 'snap-b', assets: ['app-1', 'api-2'], exposure: 20, risk: 66, identities: ['id-1'], vulnerabilities: ['vuln-2'], controls: ['mfa', 'network-policy'], threats: ['campaign-1'], incidents: [], remediation: ['rem-2'], governance: ['policy-1'], attackPaths: ['path-2'], cadence: 'daily' });
  const comparison = engine.compareSnapshots(before, after);
  assert.equal(comparison.postureDegraded, false);
  assert.equal(comparison.postureImproved, true);
  assert.equal(comparison.newRisk >= 0, true);
});

test(featureNames[3], () => {
  const engine = new SecurityWhatIfEngine({ organizationId: 'org-40' });
  const result = engine.simulate({ scenario: 'What if this asset becomes public?', entityId: 'api-1', targetState: 'EXPOSED', affectedAssets: ['api-1', 'db-1'], risks: ['PUBLIC_EXPOSURE'], attackPaths: ['public->api->db'], controls: ['waf'], governance: ['change approval'], remediation: ['tighten ingress'], blastRadius: 60, confidence: 82 });
  assert.equal(result.synthetic, true);
  assert.equal(result.entityId, 'api-1');
  assert.equal(result.affectedEntities.includes('api-1'), true);
  assert.equal(result.controlImpact.includes('waf'), true);
});

test(featureNames[4], () => {
  const graph = new ControlAssuranceGraph({ organizationId: 'org-40' });
  const result = graph.assess({ controlId: 'control-1', coverage: 90, freshness: 80, controlFailures: 1, evidencePresent: true, effective: true, score: 92 });
  const linked = graph.connectControl({ controlId: 'control-1', assetId: 'asset-1', policyId: 'policy-1', evidenceId: 'evidence-1', testId: 'test-1', result: 'result-1', riskId: 'risk-1', governanceId: 'gov-1' });
  assert.equal(result.classification, 'EFFECTIVE');
  assert.equal(linked.controlNode.entityId, 'control-1');
  assert.equal(result.requiresEvidence, true);
});

test(featureNames[5], () => {
  const engine = new SecurityControlCoverageEngine({ organizationId: 'org-40' });
  const result = engine.evaluate({ entityType: 'APPLICATION', entityId: 'payments-api', coverage: 42, controls: ['mfa', 'waf'], staleControls: 1, duplicateControls: 1, unverifiedControls: 2 });
  assert.equal(result.classification, 'PARTIAL_COVERAGE');
  assert.equal(result.warnings.length >= 1, true);
});

test(featureNames[6], () => {
  const fabric = new SecurityObservabilityFabric({ organizationId: 'org-40' });
  const signal = fabric.ingest({ sourceType: 'PIPELINE', source: 'github-actions', entityId: 'build-1', eventLatency: 10, detectionLatency: 8, ingestionLatency: 7, processingFailures: 1, missingTelemetry: 0, staleTelemetry: 2, metadata: { secret: 'ghp_secret123', environment: 'prod' } });
  const summary = fabric.summarize();
  assert.equal(signal.organizationId, 'org-40');
  assert.equal(summary.totalSignals, 1);
  assert.equal(signal.metadata.secret, undefined);
});

test(featureNames[7], () => {
  const engine = new SecuritySLOEngine({ organizationId: 'org-40' });
  engine.defineSLO({ sloId: 'slo-detection', metric: 'detection-latency', target: 10, threshold: 6, objective: '99%' });
  const evaluation = engine.evaluate({ sloId: 'slo-detection', actual: 9, objective: 95 });
  assert.equal(evaluation.breach, true);
  assert.equal(evaluation.SLI >= 0, true);
  assert.equal(evaluation.ErrorBudget >= 0, true);
});

test(featureNames[8], () => {
  const engine = new SecurityReliabilityEngine({ organizationId: 'org-40' });
  engine.recordMetric({ metric: 'meanDetectionTime', value: 12 });
  engine.recordMetric({ metric: 'meanRemediationTime', value: 18 });
  const result = engine.calculateScore({ meanDetectionTime: 12, meanInvestigationTime: 16, meanRemediationTime: 18, meanVerificationTime: 14, incidentRecurrence: 1, controlFailureRate: 3, detectionFailureRate: 2, remediationFailureRate: 1 });
  assert.equal(result.organizationId, 'org-40');
  assert.equal(result.SecurityReliabilityScore >= 0, true);
  assert.equal(result.trend !== undefined, true);
});

test(featureNames[9], () => {
  const engine = new DetectionCoverageEngine({ organizationId: 'org-40' });
  const map = engine.mapThreat({ threatId: 'threat-1', technique: 'credential-stuffing', signal: 'failed logins', detection: 'DETECTED', control: 'mfa', response: 'rate-limit', verification: 'verified' });
  const score = engine.score();
  assert.equal(map.detectionCoverage, 'DETECTED');
  assert.equal(score.totalThreats >= 1, true);
});

test(featureNames[10], () => {
  const engine = new AttackPathCoverageEngine({ organizationId: 'org-40' });
  const result = engine.analyzePath({ pathId: 'path-1', publicExposure: true, criticalAsset: true, privilegedIdentity: true, detectionCoverage: 'UNDETECTED', preventionCoverage: 20, remediation: 'tighten ingress', response: 'quarantine', recovery: 'restore' });
  assert.equal(result.classification, 'UNCOVERED');
  assert.equal(result.dangerous, true);
});

test(featureNames[11], () => {
  const engine = new SecurityBlindSpotEngine({ organizationId: 'org-40' });
  const blindSpot = engine.discover({ entityId: 'api-unknown', reason: 'missing telemetry and owner', severity: 'HIGH', source: 'discovery', evidence: ['inventory'] });
  assert.equal(blindSpot.severity, 'HIGH');
  assert.equal(blindSpot.reason.includes('telemetry'), true);
});

test(featureNames[12], () => {
  const graph = new SecurityKnowledgeGraph20({ organizationId: 'org-40' });
  const node = graph.addNode({ entityId: 'asset-1', entityType: 'ASSET', organizationId: 'org-40' });
  const rel = graph.addSemanticRelationship({ sourceId: node.entityId, sourceType: 'ASSET', targetId: 'control-1', targetType: 'CONTROL', relationshipType: 'PROTECTED_BY', organizationId: 'org-40' });
  const traversal = graph.traverse({ entityId: node.entityId, allowedRelationships: ['PROTECTED_BY'] });
  assert.equal(rel.relationshipType, 'PROTECTED_BY');
  assert.equal(traversal.reachableNodes >= 1, true);
});

test(featureNames[13], () => {
  const engine = new EvidenceLineageEngine({ organizationId: 'org-40' });
  const evidence = engine.registerEvidence({ evidenceId: 'ev-1', source: 'scanner', relatedEntity: 'app-1', derivedConclusion: 'Risk increased', freshness: 'AGING', integrity: 'VALID', metadata: { secret: 'ghp_notallowed', observed: 'public ingress' } });
  assert.equal(evidence.freshness, 'AGING');
  assert.equal(evidence.metadata.secret, undefined);
  assert.equal(engine.classifyFreshness(72), 'STALE');
});

test(featureNames[14], () => {
  const engine = new SecurityDecisionEngine({ organizationId: 'org-40' });
  const decision = engine.decide({ decisionId: 'decision-1', objective: 'Reduce public surface risk', options: ['Mitigate', 'Monitor', 'Accept'], risk: 35, costEstimate: 52, dependencies: ['approval', 'change window'], evidence: ['evidence-1'], recommendation: 'MITIGATE', decisionType: 'MITIGATE', approvalRequired: true });
  assert.equal(decision.decisionType, 'MITIGATE');
  assert.equal(decision.approvalRequired, true);
  assert.equal(decision.options.length, 3);
});

test(featureNames[15], () => {
  const engine = new SecurityPriorityOptimizer({ organizationId: 'org-40' });
  const result = engine.optimize({ items: [{ id: 'item-1', risk: 90, businessImpact: 75, exposure: 80, threatRelevance: 70, effort: 10 }, { id: 'item-2', risk: 60, businessImpact: 40, exposure: 45, threatRelevance: 50, effort: 20 }], view: 'executive' });
  assert.equal(result.PriorityQueue[0].id, 'item-1');
  assert.equal(result.view, 'EXECUTIVE');
});

test(featureNames[16], () => {
  const engine = new SecurityScenarioPlanningWorkbench({ organizationId: 'org-40' });
  const scenario = engine.createScenario({ scenarioId: 'scenario-1', name: 'Critical credential exposure', type: 'SYNTHETIC', assumptions: ['credential leaked in repo history'], initialState: ['repo access'], events: ['token compromise'], impact: ['account takeover'], response: ['disable tokens'], recovery: ['rotate and verify'], lessons: ['shore up branch protections'] });
  assert.equal(scenario.synthetic, true);
  assert.equal(scenario.name, 'Critical credential exposure');
});

test(featureNames[17], () => {
  const engine = new ContinuousAssuranceCampaignEngine({ organizationId: 'org-40' });
  const campaign = engine.createCampaign({ campaignId: 'campaign-1', name: 'secret detection assurance', tests: ['secret-scan', 'coverage-check'], schedule: 'weekly' });
  const run = engine.runCampaign('campaign-1', 'PASSED');
  assert.equal(campaign.lifecycle, 'PASSED');
  assert.equal(run.lifecycle, 'PASSED');
});

test(featureNames[18], () => {
  const engine = new SecurityRegressionEngine({ organizationId: 'org-40' });
  const regression = engine.trackRegression({ regressionId: 'reg-1', originalIssue: 'public repo secret', regressionEvent: 'secret exposure returned', affectedAssets: ['repo-1'], rootCause: 'branch policy drift', previousRemediation: 'rotate secret', currentRemediation: 'enforce branch policy and delete secret', recurrenceCount: 2 });
  assert.equal(regression.organizationId, 'org-40');
  assert.equal(regression.rootCause, 'branch policy drift');
  assert.equal(regression.recurrenceCount, 2);
});

test(featureNames[19], () => {
  const explain = new PostureChangeExplainer({ organizationId: 'org-40' });
  const result = explain.explain({ beforeScore: 82, afterScore: 71, affectedAssets: ['asset-1', 'asset-2'], affectedControls: ['waf', 'mfa'], affectedRisks: ['exposure'], threatRelevance: ['phishing'], remediation: ['patch workflow'], evidence: ['evidence-1'] });
  assert.equal(result.direction, 'POSTURE_DEGRADED');
  assert.equal(result.affectedAssets.length, 2);
  assert.equal(result.explanation.includes('POSTURE_DEGRADED'), true);
});

test(featureNames[20], () => {
  const strategist = new AISecurityStrategist({ organizationId: 'org-40' });
  const analysis = strategist.analyze();
  assert.equal(analysis.organizationId, 'org-40');
  assert.equal(analysis.status, 'RECOMMENDATION');
  assert.equal(analysis.classification, 'EVIDENCE_BASED');
});

test(featureNames[21], () => {
  const architect = new AISecurityArchitect({ organizationId: 'org-40' });
  const review = architect.reviewArchitecture({ currentState: 'Service mesh with public ingress', problem: 'Trust boundary drift', assumptions: ['semi-trusted services'], options: ['segmentation', 'mTLS', 'identity hardening'], tradeoffs: ['cost', 'latency'], recommendation: 'Segment public intake from internal services', risks: ['reduced interoperability'], implementationPlan: ['draft trust boundary map'], verificationPlan: ['validate network paths'] });
  assert.equal(review.CURRENT_STATE.includes('Service mesh'), true);
  assert.equal(review.IMPLEMENTATION_PLAN.length >= 1, true);
  assert.equal(review.VERIFICATION_PLAN.length >= 1, true);
});

test(featureNames[22], () => {
  const agent = new AutonomousAssuranceAgent({ organizationId: 'org-40' });
  const observe = agent.observe({ target: 'security-control-check', mode: 'dry-run' });
  const planned = agent.plan({ target: 'security-control-check', approved: false, allowlist: ['security-control-check'] });
  const dry = agent.executeApprovedTest({ target: 'security-control-check', approved: false, dryRun: true });
  assert.equal(observe.lifecycle, 'OBSERVE');
  assert.equal(planned.approved, false);
  assert.equal(dry.status, 'DRY_RUN_ONLY');
});

test(featureNames[23], () => {
  const center = new SecurityExecutiveIntelligenceCenter({ organizationId: 'org-40' });
  const executive = center.generate({ postureScore: 82, risk: 28, resilience: 74, exposure: 24, controlCoverage: 87, detectionCoverage: 81, securityDebt: 15, SLOHealth: 90, topRisks: ['identity drift', 'telemetry gap'], investment: ['identity hardening'], resilienceScore: ['prevention', 'response'] });
  assert.equal(executive.SECURITY_POSTURE.OverallSecurityScore, 82);
  assert.equal(executive.STRATEGIC_RISKS.includes('identity drift'), true);
});

test(featureNames[24], () => {
  const model = new SecurityOperatingModel({ organizationId: 'org-40' });
  const operating = model.generate({ posture: 84, majorRisks: ['identity drift'], priorities: ['control coverage'], securityDebt: ['vault rotation'], blindSpots: ['telemetry gap'], controlCoverage: 88, detectionCoverage: 80, resilience: 76, activeCampaigns: ['assurance'], remediation: ['rotate credentials'], verification: ['scan + approve'], executiveDecisions: ['approve budget'] });
  assert.equal(operating.currentPosture, 84);
  assert.equal(operating.lifecycle.includes('DISCOVER'), true);
  assert.equal(operating.verification.includes('scan + approve'), true);
});

test('Command 40 feature registry and public interfaces', () => {
  assert.equal(command40FeatureMap['Security Digital Twin Engine']?.name, 'SecurityDigitalTwinEngine');
  assert.equal(COMMAND_40_API_ROUTES.length, 25);
  assert.equal(COMMAND_40_WORKERS.length, 25);
  assert.equal(COMMAND_40_CLI_COMMANDS.length, 24);
  assert.equal(COMMAND_40_UI_ROUTES.length, 24);
  assert.equal(featureNames.length, 25);
});

test('Command 40 security rules', () => {
  const twin = new SecurityDigitalTwinEngine({ organizationId: 'org-40' });
  const entity = twin.createEntity({ entityId: 'tenant-a-asset', entityType: 'APPLICATION', organizationId: 'tenant-a', metadata: { secret: 'ghp_1234567890', password: 'secret', token: 'abc', owner: 'team-a' } });
  assert.equal(entity.metadata.secret, undefined);
  assert.equal(entity.metadata.password, undefined);
  assert.equal(entity.metadata.token, undefined);
  assert.equal(entity.organizationId, 'tenant-a');
  const another = twin.createEntity({ entityId: 'tenant-b-asset', entityType: 'APPLICATION', organizationId: 'tenant-b', metadata: { owner: 'team-b' } });
  assert.equal(twin.listEntities('tenant-a').length, 1);
  assert.equal(twin.listEntities('tenant-b').length, 1);
  assert.equal(another.organizationId, 'tenant-b');
});

console.log(`Command 40 feature validation: ${featureNames.length + 2} checks executed.`);
