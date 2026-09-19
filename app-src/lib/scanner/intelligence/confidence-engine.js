/**
 * lib/scanner/intelligence/confidence-engine.js
 *
 * Transparent Confidence Scoring and Explainability Engine.
 * Converts pattern matches, entropy, syntactic context, and false-positive checks
 * into an explainable 0–100 confidence score with human-readable "Why detected" rationale.
 *
 * SECURITY:
 *   - Never processes or outputs raw secret strings.
 */

/**
 * Map numeric confidence score (0-100) to standard severity level.
 *
 * @param {number} score
 * @returns {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'}
 */
export function scoreToSeverity(score = 50) {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Synthesize all signals into a finalized confidence evaluation and explainability summary.
 *
 * @param {object} params
 * @param {boolean} params.isProviderRule - True for high-specificity provider rules (AWS, GitHub, Stripe, etc.)
 * @param {number} [params.baseScore=40]
 * @param {Array<{ label: string, score: number, positive: boolean }>} params.contextSignals
 * @param {Array<{ label: string, score: number, positive: boolean }>} params.entropySignals
 * @param {Array<{ label: string, score: number, positive: boolean }>} params.falsePositiveSignals
 * @param {object} params.fileRole - output of language-detector
 * @param {object} [params.rule] - rule definition object
 * @returns {{
 *   confidence: number,
 *   severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
 *   signals: Array<{ label: string, score: number, positive: boolean }>,
 *   whyDetected: string[]
 * }}
 */
export function calculateConfidence(params = {}) {
  const {
    isProviderRule = false,
    baseScore = isProviderRule ? 40 : 30,
    contextSignals = [],
    entropySignals = [],
    falsePositiveSignals = [],
    fileRole = {},
    rule = {},
  } = params;

  const signals = [];
  let score = baseScore;

  // 1. Base provider rule signal
  if (isProviderRule) {
    signals.push({
      label: `Specific pattern match for ${rule.name || 'Provider Credential'}`,
      score: 40,
      positive: true,
    });
  } else {
    signals.push({
      label: 'Generic credential pattern match',
      score: 20,
      positive: true,
    });
  }

  // 2. File role signals
  if (fileRole.envRisk === 'HIGH') {
    signals.push({ label: 'Located in high-risk environment file (.env)', score: 15, positive: true });
    score += 15;
  } else if (fileRole.isConfigFile) {
    signals.push({ label: 'Located inside configuration file', score: 10, positive: true });
    score += 10;
  } else if (fileRole.isIaC) {
    signals.push({ label: 'Located in Infrastructure-as-Code file', score: 10, positive: true });
    score += 10;
  }

  // 3. Merge context signals
  for (const sig of contextSignals) {
    signals.push(sig);
    score += sig.score;
  }

  // 4. Merge entropy signals
  for (const sig of entropySignals) {
    signals.push(sig);
    score += sig.score;
  }

  // 5. Merge false positive penalties
  for (const sig of falsePositiveSignals) {
    signals.push(sig);
    score += sig.score; // (negative values)
  }

  // Deduplicate signals by label
  const seenLabels = new Set();
  const dedupedSignals = [];
  for (const sig of signals) {
    if (!seenLabels.has(sig.label)) {
      seenLabels.add(sig.label);
      dedupedSignals.push(sig);
    }
  }

  const confidence = Math.max(0, Math.min(100, Math.round(score)));
  const calculatedSeverity = scoreToSeverity(confidence);
  const finalSeverity = isProviderRule && confidence >= 25 ? (rule.severity || 'HIGH') : calculatedSeverity;

  // Generate "Why was this detected?" explainability bullet points
  const whyDetected = [];
  if (isProviderRule) {
    whyDetected.push(`Matches ${rule.name || 'provider'} format specifications`);
  } else {
    whyDetected.push(`Matches generic ${rule.name || 'credential'} assignment structure`);
  }

  const hasVarSignal = dedupedSignals.find(s => s.label.includes('variable name'));
  if (hasVarSignal) {
    whyDetected.push(`Assigned to a sensitive variable name (${hasVarSignal.label.replace('Sensitive variable name ', '')})`);
  }

  const hasEntropySignal = dedupedSignals.find(s => s.label.includes('entropy'));
  if (hasEntropySignal) {
    whyDetected.push(`Contains high-randomness character distribution (${hasEntropySignal.label})`);
  }

  if (fileRole.isEnvFile) {
    whyDetected.push(`Defined in an environment configuration file (${fileRole.envRisk === 'HIGH' ? 'High Risk' : 'Template'})`);
  } else if (fileRole.isConfigFile) {
    whyDetected.push(`Stored in a tracked application configuration file`);
  }

  const hasAssignSignal = dedupedSignals.find(s => s.label.includes('Hardcoded assignment'));
  if (hasAssignSignal) {
    whyDetected.push(`Direct hardcoded string value detected`);
  }

  const fpSignal = dedupedSignals.find(s => !s.positive);
  if (fpSignal) {
    whyDetected.push(`Confidence reduced: ${fpSignal.label}`);
  }

  return {
    confidence,
    severity: finalSeverity,
    signals: dedupedSignals,
    whyDetected,
  };
}
