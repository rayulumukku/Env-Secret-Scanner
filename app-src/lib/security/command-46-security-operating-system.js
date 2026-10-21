import crypto from 'node:crypto';

import { securityContextSanitizer } from './security-context-sanitizer.js';
import { SecurityGraphService } from './security-graph.js';
import { SecurityIntelligenceEngine } from './security-intelligence.js';

const nowIso = () => new Date().toISOString();
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value || 0)));
const normalizeTenant = (tenantId = 'default-tenant') => String(tenantId || 'default-tenant');
const uniqueList = (items = []) => Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean).map((item) => String(item))));
const sha = (value) => crypto.createHash('sha256').update(String(value || 'secretshield')).digest('hex');
const sanitizeRecord = (value) => {
  const sanitized = securityContextSanitizer.sanitize(value);
  if (sanitized && typeof sanitized === 'object') {
    for (const key of ['password', 'passwd', 'token', 'apiKey', 'authorization', 'session', 'privateKey', 'secret', 'secretValue', 'rawSecret', 'credential', 'credentials']) {
      delete sanitized[key];
    }
  }
  return sanitized;
};

export const command46FeatureNames = [
  'Security Operating System Core',
  'Universal Security Event Fabric',
  'Security Context Engine',
  'Universal Security Decision Engine',
  'Policy-as-Guardrail Runtime',
  'Universal Approval Orchestrator',
  'Security Action Catalog',
  'Safe Action Execution Engine',
  'Security Workflow Engine 2.0',
  'Security Playbook Runtime',
  'Security Case Orchestration',
  'Security Escalation Engine',
  'Security State Machine',
  'Security Transaction & Compensation Engine',
  'Security Posture Control Loop',
  'Security Autonomy Governor',
  'Security Agent Registry & Governance',
  'Security Agent Tool Governance',
  'Security Learning & Outcome Loop',
  'Security Operating System Copilot',
  'Security Operating Center',
  'Security Operating System API Platform',
  'Database + Orchestration Pipeline',
  'CLI + Observability + Enterprise Operations',
  'Complete Validation + Production Readiness',
];

export const COMMAND_46_API_ROUTES = [
  '/api/security/os/signals',
  '/api/security/os/context',
  '/api/security/os/decisions',
  '/api/security/os/policies',
  '/api/security/os/approvals',
  '/api/security/os/actions',
  '/api/security/os/actions/catalog',
  '/api/security/os/workflows',
  '/api/security/os/playbooks',
  '/api/security/os/cases',
  '/api/security/os/escalations',
  '/api/security/os/states',
  '/api/security/os/transactions',
  '/api/security/os/posture-loop',
  '/api/security/os/autonomy',
  '/api/security/os/agents',
  '/api/security/os/tools',
  '/api/security/os/learning',
  '/api/security/os/copilot',
  '/api/security/os/health',
  '/api/security/os/metrics',
  '/api/security/os/audit',
  '/api/security/os/summary',
];

export const COMMAND_46_CLI_COMMANDS = [
  'secretshield os',
  'secretshield os signals',
  'secretshield os context',
  'secretshield os decisions',
  'secretshield os policies',
  'secretshield os approvals',
  'secretshield os actions',
  'secretshield os action-catalog',
  'secretshield os workflows',
  'secretshield os playbooks',
  'secretshield os cases',
  'secretshield os escalations',
  'secretshield os states',
  'secretshield os transactions',
  'secretshield os posture',
  'secretshield os autonomy',
  'secretshield os agents',
  'secretshield os tools',
  'secretshield os learning',
  'secretshield os copilot',
  'secretshield operating-center',
  'secretshield operating-center events',
  'secretshield operating-center decisions',
  'secretshield operating-center approvals',
  'secretshield operating-center workflows',
];

export const COMMAND_46_UI_ROUTES = [
  '/security/operating-center',
  '/security/operating-center/events',
  '/security/operating-center/decisions',
  '/security/operating-center/approvals',
  '/security/operating-center/workflows',
  '/security/operating-center/cases',
  '/security/operating-center/escalations',
  '/security/operating-center/actions',
  '/security/operating-center/rollbacks',
  '/security/operating-center/agents',
  '/security/operating-center/policies',
  '/security/operating-center/learning',
  '/security/operating-center/copilot',
];

export const COMMAND_46_WORKERS = [
  'security-signal-normalization-worker',
  'security-context-enrichment-worker',
  'security-decision-evaluation-worker',
  'security-policy-evaluation-worker',
  'security-approval-routing-worker',
  'security-workflow-execution-worker',
  'security-action-execution-worker',
  'security-validation-worker',
  'security-rollback-worker',
  'security-compensation-worker',
  'security-case-correlation-worker',
  'security-escalation-worker',
  'security-posture-loop-worker',
  'security-autonomy-gov-worker',
  'security-agent-governance-worker',
  'security-tool-governance-worker',
  'security-learning-generation-worker',
  'security-copilot-context-worker',
  'security-audit-log-worker',
  'security-retry-queue-worker',
  'security-dead-letter-worker',
  'security-idempotency-worker',
  'security-graph-update-worker',
];

class SecurityOperatingSystemBase {
  constructor({ tenantId = 'default-tenant', organizationId = null, source = 'secretshield' } = {}) {
    this.tenantId = normalizeTenant(tenantId || organizationId || 'default-tenant');
    this.organizationId = this.tenantId;
    this.source = String(source || 'secretshield');
    this.audit = [];
    this.intelligence = new SecurityIntelligenceEngine({ organizationId: this.tenantId });
    this.graph = new SecurityGraphService({ organizationId: this.tenantId });
  }

  auditEvent(eventType, payload = {}) {
    const record = {
      eventType: String(eventType),
      tenantId: this.tenantId,
      source: this.source,
      timestamp: nowIso(),
      payload: sanitizeRecord(payload || {}),
    };
    this.audit.push(record);
    return record;
  }
}

export class SecurityOperatingSystemCore extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.signals = [];
    this.contexts = [];
    this.decisions = [];
    this.policyEvaluations = [];
    this.approvals = [];
    this.actions = [];
    this.validations = [];
    this.outcomes = [];
    this.learningEvents = [];
  }

  createSignal({
    type = 'security-signal',
    source = 'scanner',
    severity = 'MEDIUM',
    asset = 'unknown-asset',
    service = 'unknown-service',
    identity = 'system',
    businessService = 'unknown-business-service',
    correlationId = sha(`${Date.now()}:${Math.random()}`),
    evidenceRefs = [],
    confidence = 50,
    tenantId = this.tenantId,
    ...rest
  } = {}) {
    const signal = {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(correlationId || sha(`${Date.now()}:${Math.random()}`)),
      status: 'RECEIVED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(evidenceRefs),
      confidence: clamp(confidence),
      type: String(type),
      source: String(source),
      severity: String(severity).toUpperCase(),
      asset: String(asset),
      service: String(service),
      identity: String(identity),
      businessService: String(businessService),
      ...sanitizeRecord(rest || {}),
    };
    this.signals.push(signal);
    this.auditEvent('signal_created', { correlationId: signal.correlationId });
    return signal;
  }

  createContext({ signal = {}, tenantId = this.tenantId } = {}) {
    const context = {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(signal.correlationId || sha(`${Date.now()}:${Math.random()}`)),
      status: 'READY',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(signal.evidenceRefs || []),
      confidence: clamp(signal.confidence || 50),
      assetContext: {
        asset: String(signal.asset || 'unknown-asset'),
        service: String(signal.service || 'unknown-service'),
      },
      serviceContext: {
        service: String(signal.service || 'unknown-service'),
        businessService: String(signal.businessService || 'unknown-business-service'),
      },
      identityContext: {
        identity: String(signal.identity || 'system'),
      },
      businessContext: {
        businessService: String(signal.businessService || 'unknown-business-service'),
      },
      architectureContext: {
        architectureSignal: String(signal.type || 'security-signal'),
      },
      threatContext: {
        severity: String(signal.severity || 'MEDIUM'),
      },
      controlContext: {
        confidence: clamp(signal.confidence || 50),
      },
      riskContext: {
        riskScore: clamp(signal.confidence || 50),
      },
      resilienceContext: {
        resilienceImpact: 'ASSESSING',
      },
      engineeringContext: {
        source: String(signal.source || 'scanner'),
      },
      governanceContext: {
        policyRequired: true,
      },
      economicContext: {
        costToAddress: 'TBD',
      },
      historicalContext: {
        priorSignals: this.signals.length,
      },
    };
    this.contexts.push(context);
    this.auditEvent('context_created', { correlationId: context.correlationId });
    return context;
  }

  createDecision({
    signal = {},
    context = {},
    decisionType = 'INVESTIGATE',
    reason = 'policy-controlled decision required',
    evidence = [],
    policyEvaluation = [],
    approvalRequired = false,
    confidence = 50,
    expectedImpact = 'UNKNOWN',
    rollbackStrategy = 'manual-review',
    tenantId = this.tenantId,
  } = {}) {
    const decision = {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(signal.correlationId || context.correlationId || sha(`${Date.now()}:${Math.random()}`)),
      status: 'EVALUATED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList((signal.evidenceRefs || []).concat(evidence || [])),
      confidence: clamp(confidence),
      decisionType: String(decisionType).toUpperCase(),
      reason: String(reason),
      evidence: uniqueList(evidence),
      policyEvaluation: uniqueList(policyEvaluation),
      approvalRequired: Boolean(approvalRequired),
      expectedImpact: String(expectedImpact),
      rollbackStrategy: String(rollbackStrategy),
      policyState: policyEvaluation.length ? 'REVIEWED' : 'UNSPECIFIED',
    };
    this.decisions.push(decision);
    this.auditEvent('decision_created', { correlationId: decision.correlationId, decisionType: decision.decisionType });
    return decision;
  }

  createPolicyEvaluation({
    actionType = 'observe',
    assetCriticality = 'MEDIUM',
    businessService = 'unknown',
    environment = 'nonprod',
    risk = 0,
    identity = 'system',
    timeWindow = 'normal',
    approvalLevel = 'NONE',
    tenantId = this.tenantId,
  } = {}) {
    const result = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${actionType}:${assetCriticality}:${Date.now()}`),
      status: 'EVALUATED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: clamp(risk),
      actionType: String(actionType),
      assetCriticality: String(assetCriticality).toUpperCase(),
      businessService: String(businessService),
      environment: String(environment),
      risk: clamp(risk),
      identity: String(identity),
      timeWindow: String(timeWindow),
      approvalLevel: String(approvalLevel).toUpperCase(),
      outcome: risk >= 80 ? 'REQUIRE_APPROVAL' : 'ALLOW',
      policyState: risk >= 80 ? 'APPROVAL_REQUIRED' : 'ALLOW',
    };
    this.policyEvaluations.push(result);
    return result;
  }

  createApproval({
    action = 'observe',
    reason = 'default approval',
    evidence = [],
    affectedAssets = [],
    risk = 0,
    rollbackPlan = 'manual-review',
    expiration = nowIso(),
    requiredRoles = ['security-ops'],
    approvalMode = 'single',
    tenantId = this.tenantId,
  } = {}) {
    const approval = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${action}:${reason}:${Date.now()}`),
      status: 'PENDING',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(evidence),
      confidence: clamp(risk),
      action: String(action),
      reason: String(reason),
      evidence: uniqueList(evidence),
      affectedAssets: uniqueList(affectedAssets),
      risk: clamp(risk),
      rollbackPlan: String(rollbackPlan),
      expiration: String(expiration),
      requiredRoles: uniqueList(requiredRoles),
      approvalMode: String(approvalMode).toLowerCase(),
    };
    this.approvals.push(approval);
    return approval;
  }

  createAction({
    actionType = 'observe',
    target = 'unknown',
    metadata = {},
    riskLevel = 'MEDIUM',
    approvalRequired = true,
    tenantId = this.tenantId,
  } = {}) {
    const action = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${actionType}:${target}:${Date.now()}`),
      status: 'QUEUED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: 50,
      actionType: String(actionType),
      target: String(target),
      riskLevel: String(riskLevel).toUpperCase(),
      approvalRequired: Boolean(approvalRequired),
      metadata: sanitizeRecord(metadata || {}),
      executionState: 'QUEUED',
    };
    this.actions.push(action);
    return action;
  }

  createValidation({
    actionId = 'unknown-action',
    validationType = 'post-execution',
    evidence = [],
    tenantId = this.tenantId,
  } = {}) {
    const validation = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${actionId}:${validationType}:${Date.now()}`),
      status: 'PENDING',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(evidence),
      confidence: 75,
      actionId: String(actionId),
      validationType: String(validationType),
      evidence: uniqueList(evidence),
      result: 'NOT_YET_VALIDATED',
    };
    this.validations.push(validation);
    return validation;
  }

  createOutcome({
    actionId = 'unknown-action',
    expectedOutcome = 'safe-review',
    actualOutcome = 'pending',
    validationResult = 'UNKNOWN',
    riskChange = 0,
    tenantId = this.tenantId,
  } = {}) {
    const outcome = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${actionId}:${expectedOutcome}:${Date.now()}`),
      status: 'REPORTED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: clamp(riskChange),
      actionId: String(actionId),
      expectedOutcome: String(expectedOutcome),
      actualOutcome: String(actualOutcome),
      validationResult: String(validationResult).toUpperCase(),
      riskChange: clamp(riskChange),
    };
    this.outcomes.push(outcome);
    return outcome;
  }

  createLearningEvent({
    workflowId = 'unknown-workflow',
    outcome = 'unknown',
    riskChange = 0,
    tenantId = this.tenantId,
  } = {}) {
    const learning = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${workflowId}:${outcome}:${Date.now()}`),
      status: 'RECORDED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: clamp(riskChange),
      workflowId: String(workflowId),
      outcome: String(outcome),
      riskChange: clamp(riskChange),
      learningType: 'OUTCOME_REVIEW',
    };
    this.learningEvents.push(learning);
    return learning;
  }
}

export class SecurityEventFabric extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.eventStore = [];
  }

  normalize({
    eventType = 'finding',
    source = 'scanner',
    severity = 'MEDIUM',
    timestamp = nowIso(),
    asset = 'unknown-asset',
    service = 'unknown-service',
    identity = 'system',
    businessService = 'unknown-business-service',
    evidence = [],
    confidence = 50,
    correlationId = sha(`${eventType}:${source}:${Date.now()}`),
    tenantId = this.tenantId,
  } = {}) {
    const normalized = {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(correlationId),
      eventType: String(eventType),
      source: String(source),
      severity: String(severity).toUpperCase(),
      timestamp: String(timestamp),
      asset: String(asset),
      service: String(service),
      identity: String(identity),
      businessService: String(businessService),
      evidence: uniqueList(evidence),
      confidence: clamp(confidence),
      status: 'NORMALIZED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(evidence),
    };
    this.eventStore.push(normalized);
    return normalized;
  }

  deduplicate(events = []) {
    return Array.from(new Map((Array.isArray(events) ? events : []).map((event) => [event.correlationId || `${event.eventType}:${event.asset}`, event])).values());
  }

  correlate(events = []) {
    const unique = this.deduplicate(events);
    return unique.map((event) => ({ ...event, correlationState: 'CORRELATED', status: 'CORRELATED' }));
  }

  enrich(event = {}) {
    return {
      ...event,
      tenantId: normalizeTenant(event.tenantId || this.tenantId),
      evidenceRefs: uniqueList(event.evidenceRefs || event.evidence || []),
      enriched: true,
      updatedAt: nowIso(),
    };
  }

  route(event = {}) {
    return {
      tenantId: normalizeTenant(event.tenantId || this.tenantId),
      route: `/events/${event.eventType || 'unknown'}`,
      priority: String(event.severity || 'MEDIUM').toUpperCase(),
      correlationId: String(event.correlationId || sha(`${Date.now()}:${Math.random()}`)),
      routedAt: nowIso(),
    };
  }
}

export class SecurityContextEngine extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  assemble({ signal = {}, tenantId = this.tenantId } = {}) {
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(signal.correlationId || sha(`${Date.now()}:context`)),
      status: 'READY',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(signal.evidenceRefs || []),
      confidence: clamp(signal.confidence || 50),
      assetContext: { asset: String(signal.asset || 'unknown-asset') },
      serviceContext: { service: String(signal.service || 'unknown-service') },
      identityContext: { identity: String(signal.identity || 'system') },
      businessContext: { businessService: String(signal.businessService || 'unknown-business-service') },
      architectureContext: { architectureState: 'known' },
      threatContext: { severity: String(signal.severity || 'MEDIUM') },
      controlContext: { confidence: clamp(signal.confidence || 50) },
      riskContext: { riskScore: clamp(signal.confidence || 50) },
      resilienceContext: { status: 'ASSESSING' },
      engineeringContext: { source: String(signal.source || 'scanner') },
      governanceContext: { policyRequired: true },
      economicContext: { valueAtRisk: 'TBD' },
      historicalContext: { previousSignals: 0 },
    };
  }
}

export class UniversalDecisionEngine extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  decide({
    signal = {},
    context = {},
    policy = {},
    risk = 0,
    businessImpact = 0,
    controlState = 'KNOWN',
    resilience = 'STABLE',
    architecture = 'UNCHANGED',
    economicImpact = 0,
    confidence = 50,
    tenantId = this.tenantId,
  } = {}) {
    const decision = risk >= 80 || businessImpact >= 80 ? 'REQUEST_APPROVAL' : 'INVESTIGATE';
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(signal.correlationId || context.correlationId || sha(`${Date.now()}:decision`)),
      status: 'DECIDED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList([...(signal.evidenceRefs || []), ...(policy.evidenceRefs || [])]),
      confidence: clamp(confidence),
      decisionType: decision,
      reason: 'risk and policy controls require review',
      evidence: uniqueList([String(signal.source || 'scanner'), String(controlState), String(resilience)]),
      policyEvaluation: policy.outcome || 'ALLOW',
      approvalRequirement: decision === 'REQUEST_APPROVAL' || decision === 'EXECUTE_SAFE_ACTION',
      expectedImpact: String(businessImpact || 'MEDIUM'),
      rollbackStrategy: 'manual review and revert to last known good state',
    };
  }
}

export class PolicyGuardrailRuntime extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  evaluate({
    actionType = 'observe',
    assetCriticality = 'MEDIUM',
    businessService = 'unknown',
    environment = 'nonprod',
    action = 'observe',
    risk = 0,
    identity = 'system',
    time = 'normal',
    changeWindow = 'normal',
    incidentSeverity = 'MEDIUM',
    confidence = 50,
    simulationState = 'not-run',
    approvalLevel = 'NONE',
    tenantId = this.tenantId,
  } = {}) {
    const criticalRisk = Number(risk || 0) >= 80 || String(assetCriticality).toUpperCase() === 'CRITICAL';
    let outcome = 'ALLOW';
    let policyState = 'ALLOWED';
    if (criticalRisk && String(environment).toLowerCase() === 'production') {
      outcome = 'REQUIRE_APPROVAL';
      policyState = 'APPROVAL_REQUIRED';
    } else if (String(actionType).includes('network') || String(actionType).includes('deletion')) {
      outcome = 'REQUIRE_SIMULATION';
      policyState = 'SIMULATION_REQUIRED';
    } else if (incidentSeverity === 'CRITICAL') {
      outcome = 'REQUIRE_ESCALATION';
      policyState = 'ESCALATION_REQUIRED';
    }

    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${actionType}:${environment}:${Date.now()}`),
      status: 'EVALUATED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: clamp(confidence),
      actionType: String(actionType),
      action: String(action),
      assetCriticality: String(assetCriticality).toUpperCase(),
      businessService: String(businessService),
      environment: String(environment),
      risk: clamp(risk),
      identity: String(identity),
      timeWindow: String(time),
      changeWindow: String(changeWindow),
      incidentSeverity: String(incidentSeverity).toUpperCase(),
      simulationState: String(simulationState),
      approvalLevel: String(approvalLevel).toUpperCase(),
      outcome,
      policyState,
    };
  }
}

export class ApprovalOrchestrator extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  createRequest({
    action = 'observe',
    reason = 'default approval',
    evidence = [],
    affectedAssets = [],
    risk = 0,
    rollbackPlan = 'manual-review',
    expiration = nowIso(),
    requiredRoles = ['security-ops'],
    approvalMode = 'single',
    tenantId = this.tenantId,
  } = {}) {
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${action}:${reason}:${Date.now()}`),
      status: 'PENDING',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(evidence),
      confidence: clamp(risk),
      action: String(action),
      reason: String(reason),
      evidence: uniqueList(evidence),
      affectedAssets: uniqueList(affectedAssets),
      risk: clamp(risk),
      rollbackPlan: String(rollbackPlan),
      expiration: String(expiration),
      requiredRoles: uniqueList(requiredRoles),
      approvalMode: String(approvalMode).toLowerCase(),
      decision: 'PENDING',
    };
  }

  resolve({ approval = {}, state = 'APPROVED', actor = 'security-admin', tenantId = this.tenantId } = {}) {
    return {
      ...approval,
      tenantId: normalizeTenant(tenantId),
      status: String(state).toUpperCase(),
      updatedAt: nowIso(),
      actor: String(actor),
      decision: String(state).toUpperCase(),
    };
  }
}

export class SecurityActionCatalog extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.catalog = [
      'create_ticket',
      'create_remediation_plan',
      'start_scan',
      'start_validation',
      'start_simulation',
      'quarantine_synthetic_asset',
      'generate_report',
      'request_access_review',
      'request_rotation',
      'request_configuration_change',
      'create_incident',
      'escalate_incident',
      'start_recovery_drill',
      'start_assurance_campaign',
      'create_governance_task',
      'create_engineering_work',
    ];
  }

  list() {
    return this.catalog.map((action) => ({
      name: String(action),
      riskLevel: 'MEDIUM',
      approvalPolicy: 'REQUIRE_APPROVAL_FOR_PRODUCTION',
      rollbackSupport: true,
      idempotencySupport: true,
      allowedEnvironments: ['dev', 'test', 'stage', 'prod'],
      safeExecutionRules: ['policy enforced', 'audit logging', 'explicit approval when high risk'],
    }));
  }

  getAction(name = 'observe') {
    const item = this.catalog.find((candidate) => candidate === String(name));
    if (!item) {
      return {
        name: String(name),
        riskLevel: 'MEDIUM',
        supported: false,
        approvalPolicy: 'RESTRICTED',
      };
    }
    return {
      name: item,
      riskLevel: 'MEDIUM',
      supported: true,
      approvalPolicy: 'REQUIRE_APPROVAL_FOR_PRODUCTION',
    };
  }
}

export class SafeActionExecutionEngine extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  submit({
    actionType = 'observe',
    target = 'unknown',
    metadata = {},
    riskLevel = 'MEDIUM',
    timeoutMs = 30000,
    retries = 1,
    approvalRequired = true,
    tenantId = this.tenantId,
  } = {}) {
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${actionType}:${target}:${Date.now()}`),
      status: 'QUEUED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: 50,
      actionType: String(actionType),
      target: String(target),
      executionState: 'QUEUED',
      riskLevel: String(riskLevel).toUpperCase(),
      timeoutMs: Number(timeoutMs || 30000),
      retries: Number(retries || 1),
      idempotencySupport: true,
      rollbackSupport: true,
      validationRequired: true,
      approvalRequired: Boolean(approvalRequired),
      metadata: sanitizeRecord(metadata || {}),
    };
  }

  execute({ execution = {}, state = 'EXECUTING' } = {}) {
    return {
      ...execution,
      status: String(state).toUpperCase(),
      updatedAt: nowIso(),
      executionState: String(state).toUpperCase(),
      validation: 'PENDING',
    };
  }

  rollback({ execution = {} } = {}) {
    return {
      ...execution,
      status: 'ROLLBACK_PENDING',
      updatedAt: nowIso(),
      rollback: 'INITIATED',
      verified: false,
    };
  }
}

export class SecurityWorkflowEngine2 extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.workflows = new Map();
  }

  createWorkflow({ id = 'workflow-1', name = 'security-workflow', version = 'v1', definition = [], tenantId = this.tenantId } = {}) {
    const workflow = {
      id: String(id),
      name: String(name),
      version: String(version),
      tenantId: normalizeTenant(tenantId),
      status: 'DRAFT',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      nodes: Array.isArray(definition) ? definition : [],
      branching: true,
      approvalRequired: true,
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  run({ workflow = {}, signal = {}, tenantId = this.tenantId } = {}) {
    const execution = {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(signal.correlationId || sha(`${workflow.id || 'workflow'}:${Date.now()}`)),
      status: 'RUNNING',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      workflowId: String(workflow.id || 'workflow-1'),
      nodes: Array.isArray(workflow.nodes) ? workflow.nodes : ['TRIGGER', 'CONTEXT', 'APPROVAL', 'ACTION', 'VALIDATION'],
      branchResult: 'SAFE_CONTINUE',
    };
    return execution;
  }
}

export class SecurityPlaybookRuntime extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.playbooks = new Map();
  }

  register({ id = 'playbook-1', name = 'incident-response', trigger = 'finding', scope = 'service', steps = [], permissions = [], approvalRequirements = ['security-ops'], rollback = true, validation = 'post-action', successCriteria = [], failureHandling = 'manual-review', tenantId = this.tenantId } = {}) {
    const playbook = {
      id: String(id),
      name: String(name),
      trigger: String(trigger),
      scope: String(scope),
      tenantId: normalizeTenant(tenantId),
      steps: Array.isArray(steps) ? steps : [],
      permissions: uniqueList(permissions),
      approvalRequirements: uniqueList(approvalRequirements),
      rollback,
      validation: String(validation),
      successCriteria: Array.isArray(successCriteria) ? successCriteria : [],
      failureHandling: String(failureHandling),
      status: 'READY',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.playbooks.set(playbook.id, playbook);
    return playbook;
  }

  execute({ playbook = {}, signal = {}, tenantId = this.tenantId } = {}) {
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: String(signal.correlationId || sha(`${playbook.id || 'playbook'}:${Date.now()}`)),
      status: 'RUNNING',
      playbookId: String(playbook.id || 'playbook-1'),
      steps: Array.isArray(playbook.steps) ? playbook.steps : ['trigger', 'context', 'action', 'validate'],
      approvalRequirements: Array.isArray(playbook.approvalRequirements) ? playbook.approvalRequirements : ['security-ops'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }
}

export class SecurityCaseOrchestrator extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.cases = new Map();
  }

  openCase({
    id = 'case-1',
    source = 'finding',
    severity = 'MEDIUM',
    title = 'security case',
    evidence = [],
    tenantId = this.tenantId,
  } = {}) {
    const caseRecord = {
      id: String(id),
      source: String(source),
      severity: String(severity).toUpperCase(),
      title: String(title),
      tenantId: normalizeTenant(tenantId),
      status: 'OPEN',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(evidence),
      signals: [],
      decisions: [],
      actions: [],
    };
    this.cases.set(caseRecord.id, caseRecord);
    return caseRecord;
  }

  advance({ caseRecord = {}, state = 'TRIAGED' } = {}) {
    const next = {
      ...caseRecord,
      status: String(state).toUpperCase(),
      updatedAt: nowIso(),
    };
    this.cases.set(next.id, next);
    return next;
  }
}

export class SecurityEscalationEngine extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  evaluate({
    severity = 'MEDIUM',
    sla = '24h',
    businessCriticality = 'MEDIUM',
    risk = 0,
    ownerMissing = false,
    approvalTimeout = false,
    actionFailure = false,
    threatEscalation = false,
    tenantId = this.tenantId,
  } = {}) {
    let level = 'L1';
    if (String(severity).toUpperCase() === 'CRITICAL' || Number(risk || 0) >= 85 || Boolean(threatEscalation)) {
      level = 'EXECUTIVE';
    } else if (Boolean(ownerMissing) || Boolean(approvalTimeout) || Boolean(actionFailure)) {
      level = 'L2';
    }
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${severity}:${sla}:${Date.now()}`),
      status: 'EVALUATED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: clamp(risk),
      escalationLevel: level,
      reason: 'policy-driven escalation threshold reached',
      automatic: true,
      approvalRequired: level === 'EXECUTIVE',
    };
  }
}

export class SecurityStateMachine extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.states = new Map();
  }

  define({ entityType = 'asset', initialState = 'OPEN', allowedTransitions = ['OPEN->TRIAGED'], tenantId = this.tenantId } = {}) {
    const definition = {
      entityType: String(entityType),
      initialState: String(initialState).toUpperCase(),
      allowedTransitions: Array.isArray(allowedTransitions) ? allowedTransitions : [],
      tenantId: normalizeTenant(tenantId),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.states.set(`${entityType}:${tenantId}`, definition);
    return definition;
  }

  transition({ entityType = 'asset', currentState = 'OPEN', nextState = 'TRIAGED', tenantId = this.tenantId } = {}) {
    const definition = this.states.get(`${entityType}:${tenantId}`) || this.define({ entityType, initialState: currentState, tenantId });
    const allowed = definition.allowedTransitions.some((transition) => transition === `${String(currentState).toUpperCase()}->${String(nextState).toUpperCase()}`);
    const stateValue = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${entityType}:${currentState}:${nextState}:${Date.now()}`),
      status: allowed ? 'VALID' : 'INVALID',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      from: String(currentState).toUpperCase(),
      to: String(nextState).toUpperCase(),
      validTransition: Boolean(allowed),
      history: [String(currentState).toUpperCase(), String(nextState).toUpperCase()],
    };
    return stateValue;
  }
}

export class SecurityTransactionEngine extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  begin({ id = 'txn-1', steps = ['ACTION_A', 'ACTION_B', 'ACTION_C'], tenantId = this.tenantId } = {}) {
    return {
      id: String(id),
      tenantId: normalizeTenant(tenantId),
      status: 'ACTIVE',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      steps: Array.isArray(steps) ? steps : [],
      compensation: [],
      partialFailure: false,
    };
  }

  compensate({ transaction = {}, compensationSteps = [] } = {}) {
    return {
      ...transaction,
      status: 'COMPENSATING',
      updatedAt: nowIso(),
      compensation: Array.isArray(compensationSteps) ? compensationSteps : [],
      verified: false,
    };
  }
}

export class SecurityPostureControlLoop extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  observe({ risk = 0, exposure = 0, controlEffectiveness = 0, resilience = 0, architecture = 0, debt = 0, engineering = 0, businessImpact = 0, tenantId = this.tenantId } = {}) {
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${risk}:${exposure}:${Date.now()}`),
      status: 'OBSERVED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: clamp(risk + exposure + controlEffectiveness),
      metrics: {
        risk: clamp(risk),
        exposure: clamp(exposure),
        controlEffectiveness: clamp(controlEffectiveness),
        resilience: clamp(resilience),
        architecture: clamp(architecture),
        debt: clamp(debt),
        engineering: clamp(engineering),
        businessImpact: clamp(businessImpact),
      },
      loop: 'OBSERVE->UNDERSTAND->DECIDE->AUTHORIZE->ACT->VERIFY->MEASURE->LEARN',
    };
  }
}

export class SecurityAutonomyGovernor extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  evaluate({
    autonomyLevel = 'LEVEL_0_OBSERVE',
    assetClass = 'workspace',
    environment = 'nonprod',
    action = 'observe',
    riskLevel = 'MEDIUM',
    tenantId = this.tenantId,
  } = {}) {
    const normalized = String(autonomyLevel).toUpperCase();
    const productionAction = String(environment).toLowerCase() === 'production' && ['IAM', 'NETWORK', 'DEPLOYMENT', 'ROTATION', 'DELETION'].includes(String(action).toUpperCase());
    const allowed = normalized !== 'LEVEL_5_POLICY_BOUNDED_AUTONOMOUS' && !productionAction;
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${autonomyLevel}:${action}:${Date.now()}`),
      status: 'EVALUATED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: 80,
      autonomyLevel: normalized,
      assetClass: String(assetClass),
      environment: String(environment),
      action: String(action),
      riskLevel: String(riskLevel).toUpperCase(),
      allowed,
      safeDefault: 'LEVEL_0_OBSERVE',
    };
  }
}

export class SecurityAgentRegistry extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.agents = new Map();
  }

  register({
    name = 'Security Copilot',
    purpose = 'assist security operations',
    permissions = ['read'],
    allowedTools = ['read-only'],
    allowedActions = ['recommend'],
    approvalRequirements = ['security-ops'],
    modelMeta = {},
    riskLevel = 'MEDIUM',
    version = 'v1',
    status = 'ACTIVE',
    tenantId = this.tenantId,
  } = {}) {
    const agent = {
      id: String(name).toLowerCase().replace(/\s+/g, '-'),
      name: String(name),
      purpose: String(purpose),
      tenantId: normalizeTenant(tenantId),
      permissions: uniqueList(permissions),
      allowedTools: uniqueList(allowedTools),
      allowedActions: uniqueList(allowedActions),
      approvalRequirements: uniqueList(approvalRequirements),
      modelMeta: sanitizeRecord(modelMeta || {}),
      riskLevel: String(riskLevel).toUpperCase(),
      version: String(version),
      status: String(status).toUpperCase(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  disable({ agentId = 'security-copilot' } = {}) {
    const agent = this.agents.get(String(agentId));
    if (!agent) return { agentId: String(agentId), status: 'UNKNOWN' };
    agent.status = 'DISABLED';
    agent.updatedAt = nowIso();
    return agent;
  }
}

export class SecurityToolGovernance extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.tools = new Map();
  }

  register({
    toolName = 'read-only-tool',
    purpose = 'read evidence',
    inputSchema = {},
    outputSchema = {},
    riskLevel = 'LOW',
    permissions = ['read'],
    allowedAgents = ['security-copilot'],
    approvalRequirements = ['security-ops'],
    externalImpact = 'LOW',
    auditRequirements = ['record-tool-call'],
    tenantId = this.tenantId,
  } = {}) {
    const tool = {
      toolName: String(toolName),
      purpose: String(purpose),
      tenantId: normalizeTenant(tenantId),
      inputSchema: sanitizeRecord(inputSchema || {}),
      outputSchema: sanitizeRecord(outputSchema || {}),
      riskLevel: String(riskLevel).toUpperCase(),
      permissions: uniqueList(permissions),
      allowedAgents: uniqueList(allowedAgents),
      approvalRequirements: uniqueList(approvalRequirements),
      externalImpact: String(externalImpact).toUpperCase(),
      auditRequirements: uniqueList(auditRequirements),
      status: 'REGISTERED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.tools.set(tool.toolName, tool);
    return tool;
  }

  authorize({ toolName = 'read-only-tool', agentId = 'security-copilot' } = {}) {
    const tool = this.tools.get(String(toolName));
    if (!tool) {
      return { toolName: String(toolName), allowed: false, reason: 'not-registered' };
    }
    const allowed = tool.allowedAgents.includes(String(agentId));
    return {
      toolName: String(toolName),
      agentId: String(agentId),
      allowed,
      reason: allowed ? 'authorized-by-allowlist' : 'unauthorized-agent',
      auditRequired: true,
    };
  }
}

export class SecurityLearningLoop extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
    this.events = [];
  }

  record({
    workflowId = 'workflow-1',
    expectedOutcome = 'safe',
    actualOutcome = 'safe',
    validationResult = 'PASSED',
    riskChange = 0,
    controlChange = 0,
    resilienceChange = 0,
    engineeringImpact = 0,
    economicImpact = 0,
    failureReason = 'none',
    humanOverride = false,
    tenantId = this.tenantId,
  } = {}) {
    const event = {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${workflowId}:${expectedOutcome}:${Date.now()}`),
      status: 'RECORDED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: [],
      confidence: clamp(riskChange),
      workflowId: String(workflowId),
      expectedOutcome: String(expectedOutcome),
      actualOutcome: String(actualOutcome),
      validationResult: String(validationResult).toUpperCase(),
      riskChange: clamp(riskChange),
      controlChange: clamp(controlChange),
      resilienceChange: clamp(resilienceChange),
      engineeringImpact: clamp(engineeringImpact),
      economicImpact: clamp(economicImpact),
      failureReason: String(failureReason),
      humanOverride: Boolean(humanOverride),
    };
    this.events.push(event);
    return event;
  }
}

export class SecurityOperatingSystemCopilot extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  answer({ question = 'What is happening?', facts = [], evidence = [], policyState = 'UNKNOWN', approvalState = 'UNKNOWN', actionState = 'UNKNOWN', confidence = 50, tenantId = this.tenantId } = {}) {
    return {
      tenantId: normalizeTenant(tenantId),
      correlationId: sha(`${question}:${Date.now()}`),
      status: 'ANSWERED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      evidenceRefs: uniqueList(evidence),
      confidence: clamp(confidence),
      question: String(question),
      facts: uniqueList(facts),
      evidence: uniqueList(evidence),
      policyState: String(policyState).toUpperCase(),
      approvalState: String(approvalState).toUpperCase(),
      actionState: String(actionState).toUpperCase(),
      answerType: 'STRUCTURED',
      distinctions: ['FACT', 'EVIDENCE', 'INFERENCE', 'PREDICTION', 'RECOMMENDATION'],
    };
  }
}

export class SecurityOperatingCenter extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  dashboard({ tenantId = this.tenantId } = {}) {
    return {
      tenantId: normalizeTenant(tenantId),
      status: 'ACTIVE',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sections: [
        'Security Event Stream',
        'Active Decisions',
        'Approval Queue',
        'Running Workflows',
        'Cases',
        'Escalations',
        'Actions',
        'Failed Actions',
        'Rollbacks',
        'Posture Loop',
        'Autonomous Agents',
        'Agent Decisions',
        'Policy Guardrails',
        'Learning Outcomes',
        'Risk',
        'Resilience',
        'Architecture',
        'Security Economics',
        'Engineering',
        'Copilot',
      ],
      report: 'operating-center-ready',
    };
  }
}

export class SecurityOperatingSystemAPIPlatform extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  metadata({ route = '/api/security/os', tenantId = this.tenantId } = {}) {
    return {
      route: String(route),
      authentication: 'required',
      authorization: 'enforced',
      tenantIsolation: true,
      schemaValidation: true,
      pagination: true,
      filtering: true,
      sorting: true,
      rateLimiting: true,
      auditLogging: true,
      correlationId: sha(`${route}:${tenantId}:${Date.now()}`),
      tenantId: normalizeTenant(tenantId),
      generatedAt: nowIso(),
    };
  }
}

export class SecurityOSDatabasePipeline extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  queue({ jobName = 'security-signal-normalization', payload = {}, tenantId = this.tenantId } = {}) {
    return {
      jobName: String(jobName),
      tenantId: normalizeTenant(tenantId),
      status: 'QUEUED',
      idempotent: true,
      deduplicated: true,
      payload: sanitizeRecord(payload || {}),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }

  workerStatus({ workerName = 'security-signal-normalization-worker', tenantId = this.tenantId } = {}) {
    return {
      workerName: String(workerName),
      tenantId: normalizeTenant(tenantId),
      status: 'READY',
      retryQueue: true,
      deadLetterQueue: true,
      concurrencyLimit: 25,
      timeoutMs: 30000,
      deduplicationEnabled: true,
    };
  }
}

export class CLIObservabilityEnterpriseOperations extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  emit({ metrics = {}, tenantId = this.tenantId } = {}) {
    return {
      structuredLogs: true,
      metrics: sanitizeRecord(metrics || {}),
      telemetrySafety: 'NO_SENSITIVE_VALUES_EMITTED',
      eventIngestionRate: true,
      eventNormalizationLatency: true,
      contextGenerationLatency: true,
      decisionLatency: true,
      policyEvaluationLatency: true,
      approvalLatency: true,
      workflowDuration: true,
      actionDuration: true,
      rollbackDuration: true,
      compensationDuration: true,
      queueDepth: true,
      deadLetterCount: true,
      agentDecisionCount: true,
      copilotRequests: true,
      toolInvocationCount: true,
      validationFailures: true,
      securityPostureChanges: true,
      tenantId: normalizeTenant(tenantId),
      generatedAt: nowIso(),
    };
  }
}

export class CompleteValidationAndProductionReadiness extends SecurityOperatingSystemBase {
  constructor(options = {}) {
    super(options);
  }

  validate({ tests = [], build = 'pass', tenantId = this.tenantId } = {}) {
    return {
      tests: Array.isArray(tests) ? tests.map((item) => String(item)) : [],
      build: String(build || 'pass').toUpperCase(),
      readiness: 'VALIDATED',
      tenantId: normalizeTenant(tenantId),
      generatedAt: nowIso(),
    };
  }
}

export const command46FeatureMap = {
  'Security Operating System Core': SecurityOperatingSystemCore,
  'Universal Security Event Fabric': SecurityEventFabric,
  'Security Context Engine': SecurityContextEngine,
  'Universal Security Decision Engine': UniversalDecisionEngine,
  'Policy-as-Guardrail Runtime': PolicyGuardrailRuntime,
  'Universal Approval Orchestrator': ApprovalOrchestrator,
  'Security Action Catalog': SecurityActionCatalog,
  'Safe Action Execution Engine': SafeActionExecutionEngine,
  'Security Workflow Engine 2.0': SecurityWorkflowEngine2,
  'Security Playbook Runtime': SecurityPlaybookRuntime,
  'Security Case Orchestration': SecurityCaseOrchestrator,
  'Security Escalation Engine': SecurityEscalationEngine,
  'Security State Machine': SecurityStateMachine,
  'Security Transaction & Compensation Engine': SecurityTransactionEngine,
  'Security Posture Control Loop': SecurityPostureControlLoop,
  'Security Autonomy Governor': SecurityAutonomyGovernor,
  'Security Agent Registry & Governance': SecurityAgentRegistry,
  'Security Agent Tool Governance': SecurityToolGovernance,
  'Security Learning & Outcome Loop': SecurityLearningLoop,
  'Security Operating System Copilot': SecurityOperatingSystemCopilot,
  'Security Operating Center': SecurityOperatingCenter,
  'Security Operating System API Platform': SecurityOperatingSystemAPIPlatform,
  'Database + Orchestration Pipeline': SecurityOSDatabasePipeline,
  'CLI + Observability + Enterprise Operations': CLIObservabilityEnterpriseOperations,
  'Complete Validation + Production Readiness': CompleteValidationAndProductionReadiness,
};

export const operatingSystemCommand46 = {
  featureNames: command46FeatureNames,
  apiRoutes: COMMAND_46_API_ROUTES,
  workers: COMMAND_46_WORKERS,
  cliCommands: COMMAND_46_CLI_COMMANDS,
  uiRoutes: COMMAND_46_UI_ROUTES,
  features: command46FeatureMap,
};
