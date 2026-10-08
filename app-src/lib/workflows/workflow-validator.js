export function validateWorkflowTransition(currentState, nextState, definition) {
  const def = definition || { states: [], transitions: {} };
  const reasons = [];

  if (!def.states.includes(currentState)) {
    reasons.push(`Current state ${currentState} is not permitted by this workflow.`);
  }

  if (!def.states.includes(nextState)) {
    reasons.push(`Target state ${nextState} is not defined for this workflow.`);
  }

  const allowedNext = def.transitions?.[currentState] || [];
  if (allowedNext.length && !allowedNext.includes(nextState)) {
    reasons.push(`Transition ${currentState} -> ${nextState} is not allowed.`);
  }

  return {
    valid: reasons.length === 0,
    reasons,
    currentState,
    nextState,
  };
}

export function validateWorkflowEvidence(state, evidence = [], definition) {
  const required = definition?.requiredEvidence?.[state] || [];

  if (!Array.isArray(evidence) || evidence.length === 0) {
    const missing = required.length ? required : [];
    return {
      valid: missing.length === 0,
      missing,
      required,
    };
  }

  const normalizedEvidence = evidence.map((item) =>
    typeof item === 'string' ? item.toLowerCase() : item
  );

  const missing = required.filter((item) => {
    const normalizedItem = typeof item === 'string' ? item.toLowerCase() : item;
    return !normalizedEvidence.some((entry) => {
      if (typeof entry === 'string' && typeof normalizedItem === 'string') {
        return entry === normalizedItem || entry.includes(normalizedItem);
      }
      return entry === normalizedItem;
    });
  });

  return {
    valid: missing.length === 0 || required.length === 0,
    missing,
    required,
  };
}

export function validateApprovalRequirements(state, approvals = [], definition) {
  const required = definition?.requiredApprovals?.[state] || [];
  const missing = required.filter((role) => !approvals.includes(role));
  return {
    valid: missing.length === 0,
    missing,
    required,
  };
}
