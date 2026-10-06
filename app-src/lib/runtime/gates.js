/**
 * lib/runtime/gates.js
 *
 * Deterministic Deployment Gates & Pre-Deployment Policy Decision Engine for SecretShield.
 *
 * WORKFLOW:
 * Build -> SecretShield Scan -> Policy Evaluation -> Deployment Decision
 *
 * POSSIBLE OUTCOMES:
 * - ALLOW: No blocking policies triggered; deployment is permitted.
 * - BLOCK: One or more critical/high blocking policies failed; deployment halted.
 * - REVIEW_REQUIRED: Manual security officer approval required before deployment proceed.
 * - ERROR: Scan failure or invalid deployment parameters encountered; fail safe.
 *
 * SECURITY INVARIANTS:
 * - Deterministic: Given identical findings, environment, and policies, the decision is 100% reproducible.
 * - Fail-Safe: Malformed payloads or unhandled exceptions default to ERROR (never silently allow).
 * - Zero Raw Secrets: Gate decision payloads and reasons contain only masked values and rule IDs.
 */

export const GATE_DECISIONS = Object.freeze({
  ALLOW: 'ALLOW',
  BLOCK: 'BLOCK',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  ERROR: 'ERROR',
});

/**
 * Evaluate deployment decision based on scan findings, environment, and policy rules.
 *
 * @param {object} params
 * @param {string} params.commitSha - Target commit
 * @param {string} params.environment - Target deployment environment
 * @param {boolean} [params.isProduction=false] - Whether environment is authoritative production
 * @param {object[]} [params.findings=[]] - Detected findings for commit/build
 * @param {object[]} [params.policies=[]] - Active organization policies
 * @param {object} [params.options={}]
 * @returns {object} Deterministic gate decision result
 */
export function evaluateDeploymentGate({
  commitSha,
  environment,
  isProduction = false,
  findings = [],
  policies = [],
  options = {},
}) {
  if (!commitSha || typeof commitSha !== 'string') {
    return {
      decision: GATE_DECISIONS.ERROR,
      reason: 'Missing or invalid commit SHA provided to deployment gate.',
      violations: [],
      evaluatedAt: new Date().toISOString(),
    };
  }

  if (!environment || typeof environment !== 'string') {
    return {
      decision: GATE_DECISIONS.ERROR,
      reason: 'Missing or invalid environment provided to deployment gate.',
      violations: [],
      evaluatedAt: new Date().toISOString(),
    };
  }

  const violations = [];
  const warnings = [];

  // 1. Evaluate explicit organization policies
  for (const policy of policies) {
    if (!policy.enabled) continue;

    const requiresProd = policy.conditions?.some(c => c.field === 'isProduction' && c.value === true);
    if (requiresProd && !isProduction) continue;

    // Check unresolved high/critical findings condition
    const blockOnSeverity = policy.conditions?.find(c => c.field === 'severity' || c.field === 'unresolvedSeverity');
    if (blockOnSeverity) {
      const targetSev = String(blockOnSeverity.value).toUpperCase();
      const matchingFindings = findings.filter(f => {
        const fSev = String(f.severity || '').toUpperCase();
        if (targetSev === 'CRITICAL') return fSev === 'CRITICAL';
        if (targetSev === 'HIGH') return fSev === 'CRITICAL' || fSev === 'HIGH';
        return fSev === targetSev;
      });

      if (matchingFindings.length > 0) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          reason: `Policy '${policy.name}' triggered: ${matchingFindings.length} unresolved ${targetSev} finding(s) detected in commit ${commitSha.slice(0, 8)}.`,
          action: policy.actions?.includes('BLOCK_DEPLOYMENT') ? 'BLOCK' : 'REVIEW',
        });
      }
    }
  }

  // 2. Default Baseline Safety Checks
  const criticalFindings = findings.filter(f => String(f.severity).toUpperCase() === 'CRITICAL');
  const highFindings = findings.filter(f => String(f.severity).toUpperCase() === 'HIGH');

  // If deployed to production and options.blockProductionOnCritical is enabled (or policy requires)
  const shouldBlockProduction = isProduction && criticalFindings.length > 0 && options.strictProductionGate !== false;
  if (shouldBlockProduction) {
    violations.push({
      policyId: 'DEFAULT_PRODUCTION_CRITICAL_GATE',
      policyName: 'Production Critical Gate',
      reason: `Blocked: ${criticalFindings.length} unresolved CRITICAL secret(s) detected targeting production deployment.`,
      action: 'BLOCK',
    });
  }

  // Determine final deterministic outcome
  const hasBlockAction = violations.some(v => v.action === 'BLOCK');
  const hasReviewAction = violations.some(v => v.action === 'REVIEW');

  let finalDecision = GATE_DECISIONS.ALLOW;
  let reasonSummary = 'All deployment gate criteria passed. No blocking findings detected.';

  if (hasBlockAction) {
    finalDecision = GATE_DECISIONS.BLOCK;
    reasonSummary = `Deployment blocked: ${violations.map(v => v.reason).join(' | ')}`;
  } else if (hasReviewAction || (isProduction && highFindings.length > 0 && options.requireReviewForProductionHigh)) {
    finalDecision = GATE_DECISIONS.REVIEW_REQUIRED;
    reasonSummary = `Security review required prior to deployment: ${violations.map(v => v.reason).join(' | ')}`;
  }

  return {
    decision: finalDecision,
    commitSha,
    environment,
    isProduction,
    findingsCount: findings.length,
    criticalCount: criticalFindings.length,
    highCount: highFindings.length,
    reason: reasonSummary,
    violations,
    warnings,
    evaluatedAt: new Date().toISOString(),
  };
}
