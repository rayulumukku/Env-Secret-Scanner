import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createWorkflowDefinition,
  FINDING_WORKFLOW,
  transitionWorkflowState,
  validateWorkflowTransition,
  createWorkflowTask,
  createSlaRecord,
  createSecurityAction,
  createRiskAcceptanceRequest,
  simulateWorkflow,
} from '../workflow-engine.js';

test('finding workflow validates lifecycle states and evidence requirements', () => {
  const definition = createWorkflowDefinition(FINDING_WORKFLOW);
  assert.ok(definition.states.includes('DETECTED'));
  assert.ok(definition.transitions['DETECTED'].includes('TRIAGED'));

  const validation = validateWorkflowTransition('DETECTED', 'VERIFIED', definition);
  assert.equal(validation.valid, false);
  assert.ok(validation.reasons.length > 0);
});

test('valid finding transitions record evidence and workflow metadata', () => {
  const definition = createWorkflowDefinition(FINDING_WORKFLOW);
  const result = transitionWorkflowState({
    currentState: 'DETECTED',
    nextState: 'TRIAGED',
    actorId: 'user_1',
    reason: 'Evidence reviewed',
    evidence: ['ev_1'],
    workflowVersion: 'v1',
    definition,
    organizationId: 'org_1',
  });

  assert.equal(result.valid, true);
  assert.equal(result.transition.newState, 'TRIAGED');
  assert.equal(result.transition.evidence[0], 'ev_1');
  assert.equal(result.transition.workflowVersion, 'v1');
});

test('task creation and SLA status remain secret-safe and reviewable', () => {
  const task = createWorkflowTask({
    title: 'Rotate exposed API key',
    description: 'Remove hardcoded credential from deployment config',
    type: 'REMEDIATION',
    priority: 'CRITICAL',
    assignee: 'team-platform',
    repository: 'infra-deployment',
    relatedFinding: 'find_42',
    evidence: ['scan_1'],
    metadata: { secret: 'sk_live_123', note: 'safe' },
  });

  assert.equal(task.metadata.secret, undefined);
  assert.equal(task.status, 'OPEN');

  const sla = createSlaRecord({
    createdAt: Date.now() - 3600000,
    dueInHours: 24,
    state: 'ON_TRACK',
  });
  assert.ok(sla.dueAt > sla.createdAt);
  assert.equal(sla.state, 'ON_TRACK');
});

test('security actions and risk acceptance enforce approval and expiration', () => {
  const action = createSecurityAction({
    organizationId: 'org_1',
    actionType: 'APPROVE_RISK',
    targetId: 'finding_1',
    requestedBy: 'admin_1',
    actor: 'risk_team',
    evidence: ['ev_2'],
  });

  assert.equal(action.state, 'PENDING');

  const risk = createRiskAcceptanceRequest({
    organizationId: 'org_1',
    findingId: 'finding_1',
    requestedBy: 'admin_1',
    approver: 'security_lead',
    expiresAt: Date.now() + 86400000,
    scope: 'repo:infra-deployment',
  });

  assert.equal(risk.state, 'PENDING');
  assert.equal(risk.scope, 'repo:infra-deployment');
});

test('workflow simulation returns a deterministic path', () => {
  const sim = simulateWorkflow({
    workflow: FINDING_WORKFLOW,
    initialState: 'DETECTED',
    severity: 'CRITICAL',
    repository: 'infra-deployment',
    policy: 'allow-block',
  });

  assert.equal(sim.initialState, 'DETECTED');
  assert.ok(Array.isArray(sim.path));
  assert.ok(sim.path.length >= 2);
  assert.equal(sim.outcome, 'REVIEW_REQUIRED');
});
