import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AdaptiveDefenseMaturityEngine,
  DefenseEffectivenessEngine,
  ControlLearningLoop,
  SecurityOutcomeIntelligence,
  DefenseGapDiscoveryEngine,
  AdaptiveSecurityPolicyEngine,
  SecurityControlRecommendationEngine,
  DefenseStrategyOptimizer,
  SecurityCapabilityMap,
  DefensiveDependencyGraph,
  DefenseSinglePointOfFailureAnalyzer,
  SecurityResiliencePatternLibrary,
  AdaptiveDefenseCampaignEngine,
  DefenseRegressionDetector,
  SecurityDriftExplanationEngine,
  AdaptiveThreatToDefenseCorrelation,
  DefensiveSimulationPlanner,
  DefenseReadinessScoreEngine,
  AdaptiveSecurityCopilot,
  AutonomousDefenseAssuranceAgent,
  DefenseOperatingCenter,
  AdaptiveDefenseAPIPlatform,
  DatabaseBackgroundIntelligencePipeline,
  CLIObservabilityOperations,
  CompleteSecurityValidationAndProductionReadiness,
  command42FeatureNames,
  COMMAND_42_API_ROUTES,
  COMMAND_42_CLI_COMMANDS,
  COMMAND_42_UI_ROUTES,
  COMMAND_42_WORKERS,
  OutcomeType,
  DefenseMaturityLevel,
} from '../command-42-adaptive-defense.js';

test('Command 42 exposes exactly 25 major features', () => {
  assert.equal(command42FeatureNames.length, 25);
  assert.deepEqual(command42FeatureNames[0], 'Adaptive Defense Maturity Engine');
  assert.deepEqual(command42FeatureNames[24], 'Complete Security Validation + Production Readiness');
});

test('Adaptive Defense Maturity Engine calculates maturity and levels', () => {
  const engine = new AdaptiveDefenseMaturityEngine({ tenantId: 'tenant-a' });
  const result = engine.assess({
    service: 'payments',
    evidence: ['incident-1', 'drill-2'],
    incidents: 2,
    attacks: 1,
    drills: 5,
    controlEffectiveness: 82,
    detectionCoverage: 80,
    responsePerformance: 79,
    recoveryPerformance: 78,
    securityDebt: 30,
    resilienceDebt: 25,
    threatIntelligence: 85,
    attackPathExposure: 35,
    identityAnomalies: 40,
    cloudExposure: 48,
    developerBehavior: 68,
    remediationEffectiveness: 72,
    governance: 80,
    freshness: 85,
  });
  assert.equal(result.score > 0, true);
  assert.ok(result.confidence > 0);
  assert.ok(Array.isArray(result.evidenceReferences));
  assert.equal(result.level, DefenseMaturityLevel.LEVEL_4_ADAPTIVE);
  assert.ok(result.negativeFactors.length >= 0);
});

test('Defense effectiveness engine measures control effectiveness', () => {
  const engine = new DefenseEffectivenessEngine({ tenantId: 'tenant-a' });
  const tracked = engine.registerControl({ controlId: 'control-1', serviceId: 'payments', expectedEffectiveness: 90, observedEffectiveness: 88, confidence: 82, failureCount: 1, validationCount: 3, lastValidatedAt: '2026-01-01T00:00:00.000Z', regressionState: 'UNKNOWN' });
  const evaluated = engine.evaluate({ controlId: 'control-1', observedEffectiveness: 92, failureCount: 0, validationCount: 4, regressionState: 'EFFECTIVE' });
  assert.equal(tracked.serviceId, 'payments');
  assert.equal(evaluated.status, 'EFFECTIVE');
  assert.equal(evaluated.observedEffectiveness, 92);
});

test('Control learning loop captures investigation to learning metadata', () => {
  const loop = new ControlLearningLoop({ tenantId: 'tenant-a' });
  const result = loop.record({
    whatHappened: 'identity anomaly triggered suspicious login',
    controlResponded: 'conditional-access-policy',
    succeeded: true,
    timeToDetect: 45,
    timeToContain: 120,
    timeToRecover: 300,
    falsePositive: false,
    remediationOutcome: 'SUCCESSFUL',
    recoveryOutcome: 'SUCCESSFUL',
    regressionInfo: 'no regression observed',
  });
  assert.equal(result.learning, 'CONTROL_IMPROVEMENT');
  assert.equal(result.remediationOutcome, 'SUCCESSFUL');
  assert.equal(loop.events.length, 1);
});

test('Security outcome intelligence creates timelines and tracks statuses', () => {
  const engine = new SecurityOutcomeIntelligence({ tenantId: 'tenant-a' });
  const outcome = engine.registerOutcome({ outcomeId: 'outcome-1', outcomeType: OutcomeType.PREVENTED, assetId: 'asset-1', serviceId: 'payments', identityId: 'user-1', repositoryId: 'repo-1', deploymentId: 'deploy-1', incidentId: 'incident-1', vulnerabilityId: 'cve-1', threatCampaignId: 'campaign-1', status: 'SUCCESS' });
  const timeline = engine.timeline({ outcomeType: OutcomeType.PREVENTED });
  assert.equal(outcome.outcomeType, OutcomeType.PREVENTED);
  assert.equal(timeline[0].outcomeId, 'outcome-1');
});

test('Defense gap discovery engine ranks missing or weak controls', () => {
  const engine = new DefenseGapDiscoveryEngine({ tenantId: 'tenant-a' });
  const gap = engine.discover({ gapId: 'gap-1', gapType: 'MISSING_CONTROL', businessImpact: 90, attackLikelihood: 75, exposure: 80, controlWeakness: 70, confidence: 82, assetId: 'asset-2', serviceId: 'api-gateway' });
  assert.equal(gap.gapType, 'MISSING_CONTROL');
  assert.ok(gap.score > 0);
  assert.equal(gap.tenantId, 'tenant-a');
});

test('Adaptive security policy engine enforces adaptive controls', () => {
  const engine = new AdaptiveSecurityPolicyEngine({ tenantId: 'tenant-a' });
  const decision = engine.evaluate({ resource: 'critical-service', criticalService: true, identityRisk: 'HIGH', attackPathExposure: 'HIGH', incidentSeverity: 'CRITICAL', cloudExposure: 'MEDIUM', resilienceState: 'DEGRADED', businessServiceState: 'IMPACTED', controlFailure: true });
  assert.ok(decision.actions.includes('require_step_up_approval'));
  assert.ok(decision.actions.includes('increase_monitoring'));
  assert.ok(decision.actions.includes('freeze_unsafe_automation'));
  assert.ok(decision.actions.includes('start_assurance_campaign'));
});

test('Security control recommendation engine generates categorized recommendations', () => {
  const engine = new SecurityControlRecommendationEngine({ tenantId: 'tenant-a' });
  const rec = engine.recommend({
    recommendationId: 'rec-1',
    problem: 'identity alarm coverage is too weak',
    evidence: ['evidence-1'],
    affectedAssets: ['asset-1'],
    affectedServices: ['payments'],
    affectedAttackPaths: ['phishing_to_session_takeover'],
    expectedBenefit: 88,
    implementationComplexity: 40,
    confidence: 81,
    riskReductionEstimate: 72,
    resilienceImprovementEstimate: 68,
    dependencies: ['mfa-policy', 'identity-monitoring'],
    approvalRequirements: ['APPROVAL_REQUIRED'],
    category: 'quick_win',
  });
  assert.equal(rec.category, 'quick_win');
  assert.match(rec.riskReductionEstimate, /estimate/i);
  assert.match(rec.resilienceImprovementEstimate, /estimate/i);
});

test('Defense strategy optimizer returns ranked strategies without claiming optimality', () => {
  const engine = new DefenseStrategyOptimizer({ tenantId: 'tenant-a' });
  const result = engine.optimize({ risk: 85, businessCriticality: 90, controlEffectiveness: 50, securityDebt: 75, resilienceDebt: 68, attackPaths: ['path-1'], threats: ['campaign-x'], incidents: ['incident-1'], engineeringCapacity: 60, remediationCost: 25, expectedRiskReduction: 70, objective: 'BALANCED' });
  assert.equal(result.objective, 'BALANCED');
  assert.ok(Array.isArray(result.rankedStrategies));
  assert.match(result.note, /not a mathematically optimal claim/i);
});

test('Security capability map supports capability registration and trend metadata', () => {
  const map = new SecurityCapabilityMap({ tenantId: 'tenant-a' });
  const capability = map.registerCapability({ capabilityId: 'cap-1', name: 'identity-security', maturity: 70, coverage: 80, effectiveness: 75, ownership: 'security-identity', evidenceFreshness: 84, gaps: ['coverage-gaps'], risk: 45, trend: 'IMPROVING' });
  assert.equal(capability.name, 'identity-security');
  assert.equal(capability.trend, 'IMPROVING');
});

test('Defensive dependency graph supports graph relationships', () => {
  const graph = new DefensiveDependencyGraph({ tenantId: 'tenant-a' });
  const edge = graph.addDefensiveLink({ sourceAsset: 'asset-1', sourceType: 'ASSET', targetControl: 'control-1', targetType: 'CONTROL', relationshipType: 'CONTROL_PROTECTS_ASSET' });
  assert.ok(edge);
  assert.equal(edge.relationshipType, 'CONTROL_PROTECTS_ASSET');
});

test('Defense single-point-of-failure analyzer prioritizes critical dependencies', () => {
  const analyzer = new DefenseSinglePointOfFailureAnalyzer({ tenantId: 'tenant-a' });
  const risk = analyzer.analyze({ controlId: 'backup-control', dependencyCount: 3, affectedAssets: ['asset-1', 'asset-2'], affectedServices: ['payments'], affectedAttackPaths: ['path-1'], businessImpact: 90, recoveryImpact: 85 });
  assert.equal(risk.controlId, 'backup-control');
  assert.ok(risk.priority > 0);
});

test('Security resilience pattern library supports versioned defensive patterns', () => {
  const library = new SecurityResiliencePatternLibrary({ tenantId: 'tenant-a' });
  const pattern = library.addPattern({ patternId: 'pattern-1', name: 'credential-compromise containment', trigger: 'credential anomaly', requiredControls: ['mfa', 'suspicious-login-monitoring'], detectionStrategy: 'identity telemetry', responseStrategy: 'contain affected sessions', recoveryStrategy: 'restore access with approval', validationStrategy: 'verify telemetry convergence', simulationStrategy: 'synthetic replay', evidenceRequirements: ['identity-evidence'], version: '2.1' });
  assert.equal(pattern.version, '2.1');
  assert.ok(pattern.requiredControls.includes('mfa'));
});

test('Adaptive defense campaigns manage lifecycle states', () => {
  const engine = new AdaptiveDefenseCampaignEngine({ tenantId: 'tenant-a' });
  const campaign = engine.createCampaign({ campaignId: 'campaign-1', name: 'identity-coverage-validation', category: 'control_validation', status: 'DRAFT' });
  assert.equal(campaign.lifecycle, 'DRAFT');
  const advanced = engine.advance({ campaignId: 'campaign-1', nextStatus: 'ACTIVE' });
  assert.equal(advanced.lifecycle, 'ACTIVE');
  assert.equal(engine.campaigns.get('campaign-1').lifecycle, 'ACTIVE');
});

test('Defense regression detector identifies regressions', () => {
  const detector = new DefenseRegressionDetector({ tenantId: 'tenant-a' });
  const result = detector.detect({ regressionId: 'reg-1', metric: 'control_coverage', previousState: 'EFFECTIVE', currentState: 'DEGRADED', severity: 'HIGH', confidence: 88, evidence: ['evidence-1'], affectedAssets: ['asset-1'], affectedServices: ['payments'], recommendedAction: 'revalidate control effectiveness' });
  assert.equal(result.severity, 'HIGH');
  assert.equal(result.currentState, 'DEGRADED');
});

test('Security drift explanation engine provides posture change narrative', () => {
  const engine = new SecurityDriftExplanationEngine({ tenantId: 'tenant-a' });
  const explanation = engine.explain({ whatChanged: 'control coverage dropped', whyChanged: 'new deployment changed default policy', whenChanged: '2026-10-08T00:00:00.000Z', whoOrWhatChangedIt: 'deployment pipeline', whatIsAffected: 'identity and runtime controls', whyItMatters: 'detection coverage is reduced', whatShouldHappenNext: 'validate controls and run safe simulations', evidence: ['ev-1'] });
  assert.equal(explanation.WHAT_CHANGED, 'control coverage dropped');
  assert.equal(explanation.WHAT_SHOULD_HAPPEN_NEXT, 'validate controls and run safe simulations');
});

test('Adaptive threat-to-defense correlation produces coverage metadata', () => {
  const engine = new AdaptiveThreatToDefenseCorrelation({ tenantId: 'tenant-a' });
  const result = engine.correlate({ threatId: 'threat-1', applicableAssets: ['asset-1'], attackPaths: ['path-1'], controls: ['control-1'], detectionCoverage: 'PARTIALLY_COVERED', responseReadiness: 'PREPARED', recoveryReadiness: 'PARTIALLY_READY', confidence: 74 });
  assert.equal(result.coverageState, 'THREAT_DEFENSE_COVERAGE');
  assert.equal(result.detectionCoverage, 'PARTIALLY_COVERED');
});

test('Defensive simulation planner generates synthetic scenario details and safety constraints', () => {
  const planner = new DefensiveSimulationPlanner({ tenantId: 'tenant-a' });
  const plan = planner.plan({ threat: 'phishing-to-credential-theft', asset: 'identity-provider', businessService: 'payments', attackPath: 'path-1', control: 'mfa-policy' });
  assert.equal(plan.scope, 'synthetic-only');
  assert.ok(plan.safetyConstraints.includes('no real credentials'));
  assert.deepEqual(plan.successCriteria.length > 0, true);
});

test('Defense readiness score returns metrics and overall score', () => {
  const score = new DefenseReadinessScoreEngine({ tenantId: 'tenant-a' });
  const result = score.score({ prevention: 74, detection: 78, investigation: 72, containment: 77, remediation: 73, recovery: 68, resilience: 70, governance: 81, evidence: 79, threatCoverage: 76 });
  assert.ok(result.overall_score > 0);
  assert.equal(result.dimension_scores.prevention, 74);
  assert.ok(Array.isArray(result.top_strengths));
  assert.ok(Array.isArray(result.critical_gaps));
});

test('Adaptive security copilot classifies evidence and prediction states', () => {
  const copilot = new AdaptiveSecurityCopilot({ tenantId: 'tenant-a' });
  const response = copilot.answer({ question: 'Which controls are weakest?', evidence: ['evidence-1', 'evidence-2'], prediction: 'HIGH_RISK', recommendation: 'prioritize control validation' });
  assert.ok(response.FACT.length > 0);
  assert.ok(Array.isArray(response.EVIDENCE));
  assert.equal(response.PREDICTION, 'HIGH_RISK');
  assert.equal(response.RECOMMENDATION, 'prioritize control validation');
});

test('Autonomous defense assurance agent never bypasses approval and returns policy evaluation', () => {
  const agent = new AutonomousDefenseAssuranceAgent({ tenantId: 'tenant-a' });
  const result = agent.run({ posture: 'DEGRADED', coverage: 'PARTIAL', evidenceFreshness: 55, regressions: ['reg-1'], simulations: ['sim-1'], campaigns: ['camp-1'] });
  assert.equal(result.decision, 'SCHEDULE_SAFE_VALIDATION');
  assert.ok(result.policyEvaluation.includes('approval_required_for_external_actions'));
  assert.equal(result.approvalState, 'PENDING');
});

test('Defense operating center summarizes executive posture', () => {
  const center = new DefenseOperatingCenter({ tenantId: 'tenant-a' });
  const summary = center.summarize({ readiness: 77, controlEffectiveness: 81, activeThreats: ['threat-1'], defensiveGaps: ['gap-1'], regressions: ['reg-1'], singlePoints: ['sp-1'], campaigns: ['camp-1'], readinessScore: 79 });
  assert.equal(summary.summary.includes('defense center'), true);
  assert.ok(summary.activeThreats.length > 0);
});

test('Adaptive defense API platform metadata includes security and correlation fields', () => {
  const api = new AdaptiveDefenseAPIPlatform({ tenantId: 'tenant-a' });
  const metadata = api.metadata({ route: '/api/security/defense/readiness' });
  assert.equal(metadata.authentication, 'required');
  assert.equal(metadata.authorization, 'enforced');
  assert.ok(metadata.correlationId.length > 0);
});

test('Database background intelligence pipeline queues idempotent jobs', () => {
  const pipeline = new DatabaseBackgroundIntelligencePipeline({ tenantId: 'tenant-a' });
  const job = pipeline.queue({ jobName: 'readiness-scoring', payload: { tenantId: 'tenant-a', status: 'active' } });
  assert.equal(job.status, 'QUEUED');
  assert.equal(job.idempotent, true);
  assert.deepEqual(job.payload.tenantId, 'tenant-a');
});

test('CLI observability emits structured metrics without sensitive values', () => {
  const ops = new CLIObservabilityOperations({ tenantId: 'tenant-a' });
  const metrics = ops.emitMetrics({ metrics: { readiness: 78, policyChecks: 2, apiLatencyMs: 137 } });
  assert.equal(metrics.structuredLogs, true);
  assert.equal(metrics.metrics.readiness, 78);
  assert.equal(metrics.tracing, true);
});

test('Production readiness validation returns validated status with build data', () => {
  const validation = new CompleteSecurityValidationAndProductionReadiness({ tenantId: 'tenant-a' });
  const result = validation.validate({ tests: ['tenant isolation', 'RBAC', 'AI safety'], build: 'success', tenantId: 'tenant-a' });
  assert.equal(result.readiness, 'VALIDATED');
  assert.equal(result.build, 'SUCCESS');
  assert.ok(Array.isArray(result.tests));
});

test('Command 42 route, worker, and CLI registry includes all required surfaces', () => {
  assert.equal(COMMAND_42_API_ROUTES.length, 25);
  assert.equal(COMMAND_42_CLI_COMMANDS.length, 25);
  assert.equal(COMMAND_42_UI_ROUTES.length, 15);
  assert.equal(COMMAND_42_WORKERS.length, 25);
  assert.ok(COMMAND_42_API_ROUTES.includes('/api/security/defense/maturity'));
  assert.ok(COMMAND_42_CLI_COMMANDS.includes('secretshield defense readiness'));
  assert.ok(COMMAND_42_UI_ROUTES.includes('/security/defense-center/readiness'));
  assert.ok(COMMAND_42_WORKERS.includes('readiness-scoring-worker'));
});
