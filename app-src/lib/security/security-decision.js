export class SecurityDecisionEngine {
  constructor({ organizationId = 'default' } = {}) {
    this.organizationId = organizationId;
  }

  decide({ decision, reason, evidence = [], confidence = 0.7, policy = 'default', requiredApproval = false }) {
    return {
      decision: String(decision).toUpperCase(),
      reason: String(reason),
      evidence,
      confidence: Number(confidence),
      policy,
      requiredApproval,
      timestamp: new Date().toISOString(),
      organizationId: this.organizationId,
    };
  }
}

export const securityDecisionEngine = new SecurityDecisionEngine();
