/**
 * lib/scanner/rule-packs/precedence.js
 *
 * Deterministic 5-Tier Rule Precedence & Finding Deduplication Engine.
 *
 * PRECEDENCE HIERARCHY:
 * 1. Core Rules (Built-in first-party)
 * 2. Organization Rules (Private org rule packs)
 * 3. Project Rules (Project-scoped rules)
 * 4. Repository Rules (Repo-scoped rules)
 * 5. Local Custom Rules (Ad-hoc CLI / Lab custom patterns)
 */

export const PRECEDENCE_TIERS = {
  CORE: 100,
  ORGANIZATION: 200,
  PROJECT: 300,
  REPOSITORY: 400,
  LOCAL_CUSTOM: 500,
};

/**
 * Assign precedence rank to a rule based on its origin context.
 * @param {object} rule
 * @returns {number} Numeric priority (lower number = higher precedence)
 */
export function getRulePrecedence(rule) {
  if (rule.isLocalCustom || rule.tier === 'LOCAL_CUSTOM') {
    return PRECEDENCE_TIERS.LOCAL_CUSTOM;
  }
  if (rule.repositoryId || rule.tier === 'REPOSITORY') {
    return PRECEDENCE_TIERS.REPOSITORY;
  }
  if (rule.projectId || rule.tier === 'PROJECT') {
    return PRECEDENCE_TIERS.PROJECT;
  }
  if (rule.organizationId || rule.tier === 'ORGANIZATION') {
    return PRECEDENCE_TIERS.ORGANIZATION;
  }
  return PRECEDENCE_TIERS.CORE;
}

/**
 * Sort rules by deterministic precedence order.
 * @param {object[]} rules
 * @returns {object[]}
 */
export function sortRulesByPrecedence(rules) {
  return [...rules].sort((a, b) => {
    const precA = getRulePrecedence(a);
    const precB = getRulePrecedence(b);
    if (precA !== precB) {
      return precA - precB;
    }
    // Deterministic tie breaker by ID
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

/**
 * Deduplicate findings when multiple rules match the same secret span in the same file.
 * Higher precedence rule match wins.
 *
 * @param {object[]} findings
 * @returns {object[]} Deduplicated findings
 */
export function deduplicateFindingsByPrecedence(findings) {
  if (!Array.isArray(findings) || findings.length <= 1) {
    return findings || [];
  }

  const spanGroups = new Map(); // key: "file:line:fingerprint" or "file:line:matchSpan"

  for (const f of findings) {
    const file = f.file || f.filePath || 'unknown';
    const line = f.line || 1;
    const fingerprint = f.fingerprint || f.maskedValue || 'default';
    const key = `${file}:${line}:${fingerprint}`;

    if (!spanGroups.has(key)) {
      spanGroups.set(key, f);
    } else {
      const existing = spanGroups.get(key);
      const existingTier = getRulePrecedence(existing);
      const currentTier = getRulePrecedence(f);

      // Lower tier value = higher precedence
      if (currentTier < existingTier) {
        spanGroups.set(key, f);
      } else if (currentTier === existingTier) {
        // If equal precedence, pick higher confidence or higher severity
        const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const sevDiff = (severityWeight[f.severity] || 1) - (severityWeight[existing.severity] || 1);
        if (sevDiff > 0 || (sevDiff === 0 && (f.confidence || 0) > (existing.confidence || 0))) {
          spanGroups.set(key, f);
        }
      }
    }
  }

  return Array.from(spanGroups.values());
}
