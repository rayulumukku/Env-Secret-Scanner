/**
 * @file lib/security/priority-engine.js
 * @description Transparent finding priority calculation model.
 * 
 * FACTUAL PRIORITY PRINCIPLE:
 *   - Priority is derived strictly from documented, observable signals.
 *   - Explanations are stored in `priorityFactors[]` for full developer transparency.
 *   - Does NOT claim actual compromise or infer attacker behavior.
 */

/**
 * @typedef {'P0_IMMEDIATE'|'P1_HIGH'|'P2_MEDIUM'|'P3_LOW'} PriorityLevel
 * 
 * @typedef {Object} FindingPriority
 * @property {number} priorityScore - 0 to 100
 * @property {PriorityLevel} priorityLevel
 * @property {string[]} priorityFactors - Human-readable explanation factors
 * @property {string} prioritySummary
 */

/**
 * Computes priority score and transparent explanation factors for a finding.
 * 
 * @param {Object} finding
 * @param {Object} [context]
 * @param {boolean} [context.isCurrentHead=true] - Whether present in current source code
 * @param {number} [context.occurrenceCount=1] - Total occurrences of this fingerprint
 * @param {number} [context.repositoryCount=1] - Number of repositories containing this secret
 * @param {boolean} [context.isDefaultBranch=true] - Whether on main/master
 * @returns {FindingPriority}
 */
export function calculateFindingPriority(finding, context = {}) {
  if (!finding) {
    return {
      priorityScore: 0,
      priorityLevel: 'P3_LOW',
      priorityFactors: ['No finding data available'],
      prioritySummary: 'Unprioritized finding'
    };
  }

  let score = 0;
  const factors = [];

  const severity = String(finding.severity || 'LOW').toUpperCase();
  const confidence = Number(finding.confidence || 50);
  const isCurrentHead = context.isCurrentHead ?? (finding.exposureStatus !== 'REMOVED' && !finding.isHistoricalOnly);
  const occurrenceCount = context.occurrenceCount || finding.occurrencesCount || 1;
  const repositoryCount = context.repositoryCount || 1;
  const isDefaultBranch = context.isDefaultBranch ?? (finding.branch === 'main' || finding.branch === 'master' || !finding.branch);
  const file = String(finding.file || '').toLowerCase();

  // 1. Severity Signal (Max 40 pts)
  if (severity === 'CRITICAL') {
    score += 40;
    factors.push('Critical severity credential (e.g. cloud root or private key)');
  } else if (severity === 'HIGH') {
    score += 25;
    factors.push('High severity credential (e.g. database URI, API secret key)');
  } else if (severity === 'MEDIUM') {
    score += 15;
    factors.push('Medium severity token or webhook');
  } else {
    score += 5;
    factors.push('Low severity identifier or generic secret');
  }

  // 2. Presence Signal (Max 30 pts)
  if (isCurrentHead) {
    score += 30;
    factors.push('Active in current branch source code (immediate exposure)');
  } else {
    score += 10;
    factors.push('Historical commit exposure only (not in current HEAD)');
  }

  // 3. Confidence Signal (Max 15 pts)
  if (confidence >= 90) {
    score += 15;
    factors.push(`High detection confidence (${confidence}%)`);
  } else if (confidence >= 70) {
    score += 10;
    factors.push(`Moderate detection confidence (${confidence}%)`);
  } else {
    score += 5;
    factors.push(`Standard heuristic match (${confidence}%)`);
  }

  // 4. Occurrence & Cross-Repo Reuse (Max 15 pts)
  if (repositoryCount > 1) {
    score += 15;
    factors.push(`Cross-repository reuse (detected across ${repositoryCount} repositories)`);
  } else if (occurrenceCount > 2) {
    score += 8;
    factors.push(`Repeated occurrence (${occurrenceCount} locations in repository)`);
  }

  // 5. Context & Location Signal (Max 10 pts)
  if (isDefaultBranch) {
    score += 5;
    factors.push('Present on default production branch');
  }

  if (file.includes('.env') || file.includes('config') || file.includes('auth') || file.includes('secret')) {
    score += 5;
    factors.push('Located in sensitive configuration file');
  }

  // Normalize score between 0 and 100
  const priorityScore = Math.min(100, Math.max(0, score));

  // Determine Level
  let priorityLevel = 'P3_LOW';
  let prioritySummary = 'Low priority finding. Review during scheduled audits.';

  if (priorityScore >= 80) {
    priorityLevel = 'P0_IMMEDIATE';
    prioritySummary = 'Immediate action recommended: active high-impact credential in source.';
  } else if (priorityScore >= 60) {
    priorityLevel = 'P1_HIGH';
    prioritySummary = 'High priority: active secret requiring remediation and credential rotation.';
  } else if (priorityScore >= 40) {
    priorityLevel = 'P2_MEDIUM';
    prioritySummary = 'Medium priority: review finding context and verify test/dummy status.';
  }

  return {
    priorityScore,
    priorityLevel,
    priorityFactors: factors,
    prioritySummary
  };
}

/**
 * Enriches a list of findings with transparent priority metadata and sorts by priorityScore descending.
 * 
 * @param {Array<Object>} findings 
 * @param {Object} [globalContext] 
 * @returns {Array<Object>}
 */
export function prioritizeFindings(findings = [], globalContext = {}) {
  return (findings || [])
    .map(f => {
      const priority = calculateFindingPriority(f, globalContext);
      return {
        ...f,
        priorityScore: priority.priorityScore,
        priorityLevel: priority.priorityLevel,
        priorityFactors: priority.priorityFactors,
        prioritySummary: priority.prioritySummary
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
