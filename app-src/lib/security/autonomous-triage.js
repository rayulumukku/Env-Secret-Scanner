export class AutonomousTriageEngine {
  constructor({ organizationId = 'default' } = {}) {
    this.organizationId = organizationId;
  }

  triageFinding(finding) {
    const normalized = finding || {};
    const severity = String(normalized.severity || 'MEDIUM').toUpperCase();
    const classification = severity === 'CRITICAL' ? 'URGENT' : severity === 'HIGH' ? 'HIGH_RISK' : 'MONITOR';
    const decision = severity === 'CRITICAL' ? 'ESCALATE' : severity === 'HIGH' ? 'TRIAGE' : 'MONITOR';

    return {
      findingId: normalized.id || 'finding_unknown',
      organizationId: normalized.organizationId || this.organizationId,
      classification,
      decision,
      priority: severity === 'CRITICAL' ? 'DO NOW' : severity === 'HIGH' ? 'HIGH PRIORITY' : 'NORMAL',
      summary: `Autonomous triage classified ${normalized.id || 'finding'} as ${classification} based on severity and context.`,
      recommendedAction: 'Review exposure scope and assign an owner for investigation or policy-controlled remediation.',
      requiresApproval: severity !== 'CRITICAL',
      createdAt: new Date().toISOString(),
    };
  }
}

export const autonomousTriageEngine = new AutonomousTriageEngine();
