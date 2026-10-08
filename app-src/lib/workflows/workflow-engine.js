import { FINDING_WORKFLOW, createWorkflowDefinition } from './workflow-definition.js';
import { validateWorkflowTransition, validateWorkflowEvidence, validateApprovalRequirements } from './workflow-validator.js';

const SECRET_KEYS = new Set(['secret', 'token', 'password', 'passphrase', 'apiKey', 'privateKey', 'authorization', 'cookie', 'jwt']);

function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(metadata)) {
    const normalizedKey = key.toLowerCase();
    if (SECRET_KEYS.has(normalizedKey)) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function transitionWorkflowState({
  currentState,
  nextState,
  actorId,
  reason,
  evidence = [],
  workflowVersion = 'v1',
  definition = FINDING_WORKFLOW,
  organizationId,
  approvals = [],
}) {
  const validation = validateWorkflowTransition(currentState, nextState, definition);
  if (!validation.valid) {
    return {
      valid: false,
      transition: null,
      reasons: validation.reasons,
      state: currentState,
    };
  }

  const evidenceValidation = validateWorkflowEvidence(nextState, evidence, definition);
  if (Array.isArray(evidence) && evidence.length === 0 && !evidenceValidation.valid) {
    return {
      valid: false,
      transition: null,
      reasons: [`Missing evidence for ${nextState}: ${evidenceValidation.missing.join(', ')}`],
      state: currentState,
    };
  }

  const approvalValidation = validateApprovalRequirements(nextState, approvals, definition);
  if (!approvalValidation.valid) {
    return {
      valid: false,
      transition: null,
      reasons: [`Missing approvals for ${nextState}: ${approvalValidation.missing.join(', ')}`],
      state: currentState,
    };
  }

  return {
    valid: true,
    transition: {
      fromState: currentState,
      newState: nextState,
      actorId,
      reason,
      evidence,
      workflowVersion,
      organizationId,
      approvals,
      timestamp: Date.now(),
    },
    reasons: [],
    state: nextState,
  };
}

export function createWorkflowTask({
  title,
  description,
  type,
  priority,
  assignee,
  repository,
  relatedFinding,
  evidence = [],
  metadata = {},
}) {
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    title,
    description,
    type,
    priority,
    assignee,
    repository,
    relatedFinding,
    evidence,
    metadata: sanitizeMetadata(metadata),
    status: 'OPEN',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return task;
}

export function createSlaRecord({ createdAt = Date.now(), dueInHours = 24, state = 'ON_TRACK' }) {
  return {
    createdAt,
    dueAt: createdAt + dueInHours * 60 * 60 * 1000,
    state,
    breached: false,
  };
}

export function createSecurityAction({
  organizationId,
  actionType,
  targetId,
  requestedBy,
  actor,
  evidence = [],
  metadata = {},
}) {
  return {
    id: `action_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    organizationId,
    actionType,
    targetId,
    requestedBy,
    actor,
    evidence,
    metadata: sanitizeMetadata(metadata),
    state: 'PENDING',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createRiskAcceptanceRequest({
  organizationId,
  findingId,
  requestedBy,
  approver,
  expiresAt,
  scope,
  metadata = {},
}) {
  return {
    id: `riskaccept_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    organizationId,
    findingId,
    requestedBy,
    approver,
    expiresAt,
    scope,
    metadata: sanitizeMetadata(metadata),
    state: 'PENDING',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function simulateWorkflow({ workflow = FINDING_WORKFLOW, initialState, severity = 'MEDIUM', repository, policy = 'allow-block' }) {
  const path = [initialState];
  let currentState = initialState;

  const start = workflow.transitions?.[currentState] || [];
  if (start.length === 0) {
    return {
      initialState,
      path,
      outcome: 'NO_TRANSITION',
      severity,
      repository,
      policy,
    };
  }

  const candidate = severity === 'CRITICAL' ? 'TRIAGED' : start[0];
  if (candidate === 'TRIAGED') {
    path.push('TRIAGED');
    currentState = 'TRIAGED';
  }

  const followUp = workflow.transitions?.[currentState] || [];
  if (followUp.includes('ACKNOWLEDGED')) {
    path.push('ACKNOWLEDGED');
    currentState = 'ACKNOWLEDGED';
  }

  if (policy === 'allow-block' && severity === 'CRITICAL') {
    return {
      initialState,
      path,
      outcome: 'REVIEW_REQUIRED',
      severity,
      repository,
      policy,
    };
  }

  return {
    initialState,
    path,
    outcome: 'AUTO_RESOLVED',
    severity,
    repository,
    policy,
  };
}

export { FINDING_WORKFLOW, createWorkflowDefinition, validateWorkflowTransition, validateWorkflowEvidence, validateApprovalRequirements };
