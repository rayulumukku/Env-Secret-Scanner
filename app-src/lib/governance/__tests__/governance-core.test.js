import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SecurityGovernanceEngine,
  FrameworkRegistry,
  ControlMappingEngine,
  EvidenceAutomationEngine,
  EvidenceIntegrityService,
  CompliancePostureEngine,
  validateEvidence,
  sanitizeEvidencePayload,
} from '../governance-engine.js';

test('governance engine creates a framework program and posture', () => {
  const engine = new SecurityGovernanceEngine({ organizationId: 'org-123' });

  const program = engine.createProgram({
    name: 'Annual Security Governance',
    owner: 'security-lead',
    securityOwner: 'security-ops',
    status: 'ACTIVE',
    scope: 'production',
  });

  const framework = engine.registerFramework({
    frameworkId: 'framework-soc2',
    name: 'SOC2-style Controls',
    version: '1.0',
    description: 'Internal security control mapping',
    source: 'internal',
    status: 'ACTIVE',
    requirements: [
      { requirementId: 'req-1', title: 'Production credentials must be protected', description: 'Protect production secrets', owner: 'engineering', severity: 'HIGH' },
    ],
    controls: [{ controlId: 'gctl-1', name: 'Database Secret Scanning', owner: 'platform-security', severity: 'HIGH' }],
  });

  const requirement = framework.requirements[0];
  const mapped = engine.controlMappingEngine.mapControl({
    frameworkId: framework.frameworkId,
    requirementId: requirement.requirementId,
    controlId: 'gctl-1',
    securityControlId: 'ctl_secret_scan',
  });

  assert.equal(mapped.frameworkId, framework.frameworkId);
  assert.equal(mapped.requirementId, requirement.requirementId);

  const control = engine.createGovernanceControl({
    controlId: 'gctl-1',
    name: 'Database Secret Scanning',
    owner: 'platform-security',
    automatedTest: 'command-31-scan',
    evidenceSources: ['control-run'],
    frameworkIds: [framework.frameworkId],
  });

  const evidence = engine.createEvidenceRecord({
    organizationId: 'org-123',
    sourceType: 'CONTROL_RESULT',
    sourceId: 'control-run-1',
    controlId: 'gctl-1',
    requirementId: 'req-1',
    evidenceType: 'CONTROL_RESULT',
    content: {
      status: 'PASS',
      notes: 'Secret scanning passed for production repository',
      secretValue: 'do-not-store',
    },
    metadata: { owner: 'platform-security', frameworkId: framework.frameworkId },
    collector: 'governance-engine',
    validUntil: new Date(Date.now() + 86400000).toISOString(),
  });

  assert.equal(evidence.contentHash.length > 10, true);
  assert.equal(evidence.status, 'VERIFIED');

  const posture = engine.calculatePosture({ frameworkId: framework.frameworkId, organizationId: 'org-123' });

  assert.equal(posture.score >= 70, true);
  assert.equal(posture.status, 'COMPLIANT');
  assert.equal(program.name, 'Annual Security Governance');
  assert.equal(control.controlId, 'gctl-1');
});

test('evidence freshness and integrity service catch stale and modified inputs', () => {
  const service = new EvidenceIntegrityService();

  const record = {
    evidenceId: 'ev-1',
    organizationId: 'org-1',
    sourceType: 'CONTROL_RESULT',
    sourceId: 'run-1',
    controlId: 'ctl-1',
    requirementId: 'req-1',
    evidenceType: 'CONTROL_RESULT',
    collectedAt: new Date(Date.now() - 600000).toISOString(),
    validFrom: new Date(Date.now() - 600000).toISOString(),
    validUntil: new Date(Date.now() - 60000).toISOString(),
    contentHash: 'bad-hash',
    sourceReference: 'run-1',
    metadata: { status: 'PASS' },
    status: 'EXPIRED',
  };

  const verification = service.verifyRecord(record);
  assert.equal(verification.status === 'STALE' || verification.status === 'INVALID', true);

  const freshRecord = {
    evidenceId: 'ev-2',
    organizationId: 'org-1',
    sourceType: 'SIMULATION_RESULT',
    sourceId: 'sim-2',
    controlId: 'ctl-7',
    requirementId: 'req-2',
    evidenceType: 'SIMULATION_RESULT',
    collectedAt: new Date().toISOString(),
    validFrom: new Date(Date.now() - 10000).toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    contentHash: 'abc123',
    sourceReference: 'sim-2',
    metadata: { status: 'PASS' },
    status: 'VERIFIED',
  };

  const freshVerification = service.verifyRecord(freshRecord);
  assert.equal(freshVerification.status, 'VERIFIED');
});

test('evidence auto matching and recommendation engine work with verified evidence', () => {
  const engine = new SecurityGovernanceEngine({ organizationId: 'org-24' });

  const framework = engine.registerFramework({
    frameworkId: 'framework-nist',
    name: 'NIST CSF-style Controls',
    version: '1.0',
    description: 'Internal control mapping for secret protection',
    source: 'internal',
    status: 'ACTIVE',
    requirements: [{ requirementId: 'req-secret-scan', title: 'Production secret scanning', description: 'Must detect secrets in production', owner: 'security', severity: 'CRITICAL' }],
    controls: [{ controlId: 'gctl-secret', name: 'Production Secret Scan', owner: 'security', severity: 'CRITICAL' }],
  });

  engine.controlMappingEngine.mapControl({
    frameworkId: framework.frameworkId,
    requirementId: 'req-secret-scan',
    controlId: 'gctl-secret',
    securityControlId: 'ctl_secret_scan',
  });

  engine.createEvidenceRecord({
    organizationId: 'org-24',
    sourceType: 'CONTROL_RESULT',
    sourceId: 'scan-run-42',
    controlId: 'gctl-secret',
    requirementId: 'req-secret-scan',
    evidenceType: 'CONTROL_RESULT',
    content: { status: 'PASS', summary: 'Production secret scanning passed', value: 'not-a-secret' },
    metadata: { tags: ['secret-scanning', 'production'] },
    collector: 'automated-validator',
    validUntil: new Date(Date.now() + 3600000).toISOString(),
  });

  const match = engine.evidenceMatchingEngine.findMatches({
    requirementId: 'req-secret-scan',
    organizationId: 'org-24',
    tags: ['secret-scanning'],
  });

  assert.equal(match.status, 'MATCHED');

  const recommendations = engine.governanceRecommendationEngine.generate({
    organizationId: 'org-24',
    frameworkId: framework.frameworkId,
  });

  assert.equal(recommendations.length >= 1, true);
});
