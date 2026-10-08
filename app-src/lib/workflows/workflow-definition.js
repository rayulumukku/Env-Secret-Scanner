export const FINDING_WORKFLOW = Object.freeze({
  id: 'finding-lifecycle',
  name: 'Finding lifecycle',
  type: 'Finding',
  states: [
    'DETECTED',
    'TRIAGED',
    'ACKNOWLEDGED',
    'IN_REMEDIATION',
    'FIXED',
    'VERIFYING',
    'VERIFIED',
    'CLOSED',
    'FALSE_POSITIVE',
    'ACCEPTED_RISK',
    'DUPLICATE',
    'REOPENED',
  ],
  transitions: {
    DETECTED: ['TRIAGED', 'FALSE_POSITIVE', 'DUPLICATE'],
    TRIAGED: ['ACKNOWLEDGED', 'FALSE_POSITIVE', 'DUPLICATE'],
    ACKNOWLEDGED: ['IN_REMEDIATION', 'ACCEPTED_RISK', 'FALSE_POSITIVE'],
    IN_REMEDIATION: ['FIXED', 'REOPENED', 'ACCEPTED_RISK'],
    FIXED: ['VERIFYING', 'REOPENED'],
    VERIFYING: ['VERIFIED', 'REOPENED'],
    VERIFIED: ['CLOSED', 'REOPENED'],
    CLOSED: ['REOPENED'],
    FALSE_POSITIVE: ['REOPENED'],
    ACCEPTED_RISK: ['REOPENED'],
    DUPLICATE: ['REOPENED'],
    REOPENED: ['TRIAGED', 'ACKNOWLEDGED', 'IN_REMEDIATION'],
  },
  requiredEvidence: {
    TRIAGED: ['finding', 'scan_context'],
    ACKNOWLEDGED: ['assignee', 'repository_scope'],
    IN_REMEDIATION: ['remediation_plan'],
    FIXED: ['source_change'],
    VERIFYING: ['verification_run'],
    VERIFIED: ['verification_result'],
    ACCEPTED_RISK: ['risk_reason', 'approver'],
    FALSE_POSITIVE: ['false_positive_evidence'],
  },
  requiredApprovals: {
    ACCEPTED_RISK: ['security_lead'],
    CLOSED: ['repository_owner'],
  },
  sla: {
    responseHours: 24,
    remediationHours: 72,
    verificationHours: 24,
  },
  automatedActions: {
    DETECTED: ['create_task', 'notify_assignee'],
    ACKNOWLEDGED: ['assign_owner'],
    VERIFYING: ['trigger_rescan'],
  },
});

export const REMEDIATION_WORKFLOW = Object.freeze({
  id: 'remediation-workflow',
  name: 'Remediation workflow',
  type: 'Remediation',
  states: ['TASK_CREATED', 'ACKNOWLEDGED', 'FIX_IN_PROGRESS', 'SOURCE_FIXED', 'VERIFICATION_PENDING', 'VERIFIED'],
  transitions: {
    TASK_CREATED: ['ACKNOWLEDGED', 'FIX_IN_PROGRESS'],
    ACKNOWLEDGED: ['FIX_IN_PROGRESS', 'SOURCE_FIXED'],
    FIX_IN_PROGRESS: ['SOURCE_FIXED', 'VERIFICATION_PENDING'],
    SOURCE_FIXED: ['VERIFICATION_PENDING'],
    VERIFICATION_PENDING: ['VERIFIED'],
    VERIFIED: [],
  },
  requiredEvidence: {
    TASK_CREATED: ['task_definition'],
    SOURCE_FIXED: ['source_change'],
    VERIFIED: ['verification_result'],
  },
  requiredApprovals: {},
  sla: { responseHours: 12, verificationHours: 24 },
});

export const INCIDENT_WORKFLOW = Object.freeze({
  id: 'incident-workflow',
  name: 'Incident workflow',
  type: 'Incident',
  states: ['OPEN', 'TRIAGING', 'INVESTIGATING', 'CONTAINMENT', 'REMEDIATION', 'VERIFICATION', 'CLOSED'],
  transitions: {
    OPEN: ['TRIAGING'],
    TRIAGING: ['INVESTIGATING', 'CLOSED'],
    INVESTIGATING: ['CONTAINMENT', 'REMEDIATION'],
    CONTAINMENT: ['REMEDIATION'],
    REMEDIATION: ['VERIFICATION'],
    VERIFICATION: ['CLOSED'],
    CLOSED: [],
  },
  requiredEvidence: {
    TRIAGING: ['incident_summary'],
    CONTAINMENT: ['containment_action'],
    REMEDIATION: ['remediation_evidence'],
    VERIFIED: ['verification_result'],
  },
  requiredApprovals: {},
  sla: { responseHours: 4 },
});

export const SECURITY_WORKFLOWS = Object.freeze({
  FINDING: FINDING_WORKFLOW,
  REMEDIATION: REMEDIATION_WORKFLOW,
  INCIDENT: INCIDENT_WORKFLOW,
});

export function createWorkflowDefinition(definition) {
  return JSON.parse(JSON.stringify(definition || FINDING_WORKFLOW));
}
