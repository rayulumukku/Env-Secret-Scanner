/**
 * confidence.js — Transparent confidence scoring system.
 *
 * Converts raw pattern matches + contextual signals into a 0–100
 * confidence score with a human-readable signals array.
 *
 * Score → Severity:
 *   90–100  CRITICAL
 *   70–89   HIGH
 *   40–69   MEDIUM
 *   0–39    LOW
 *
 * SECURITY: Never receives or processes raw secret values.
 */

/**
 * Base signal scores for provider-specific rule matches.
 * These are the starting points; context analysis adds/subtracts.
 */
export const BASE_SIGNALS = {
  PROVIDER_PATTERN:    { label: 'Provider-specific pattern match', score: 40 },
  SECRET_KEYWORD:      { label: 'Secret keyword in variable name',  score: 20 },
  HIGH_ENTROPY:        { label: 'High entropy value',               score: 15 },
  ENTROPY_VERY_HIGH:   { label: 'Very high entropy value',          score: 20 },
  SUSPICIOUS_ASSIGN:   { label: 'Suspicious assignment context',    score: 10 },
  SENSITIVE_FILE:      { label: 'Sensitive file type',              score: 10 },
  NEARBY_KEYWORD:      { label: 'Secret keyword in nearby code',    score: 5  },
};

export const PENALTY_SIGNALS = {
  PLACEHOLDER:    { label: 'Placeholder or example value',        score: -35 },
  DOC_CONTEXT:    { label: 'Documentation/example context',       score: -20 },
  TEST_FILE:      { label: 'Test or documentation file',          score: -15 },
  DUMMY_VALUE:    { label: 'Obvious dummy value',                 score: -10 },
  IN_COMMENT:     { label: 'Value is inside a comment',           score: -10 },
};

/**
 * Map a final confidence score to a severity label.
 * @param {number} score - 0 to 100
 * @returns {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'}
 */
export function scoreToSeverity(score) {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Build a signals array and compute a final confidence score.
 *
 * @param {object} opts
 * @param {number}   opts.baseScore       - starting score from the rule definition
 * @param {boolean}  opts.isProviderRule  - true for named-provider rules (AWS, GitHub, etc.)
 * @param {boolean}  opts.hasSecretVarName
 * @param {boolean}  opts.isHighEntropy
 * @param {boolean}  opts.isVeryHighEntropy
 * @param {number}   opts.entropy         - actual entropy value for label
 * @param {boolean}  opts.hasSuspiciousAssignment
 * @param {boolean}  opts.isSensitiveFile
 * @param {boolean}  opts.hasNearbyKeyword
 * @param {boolean}  opts.isPlaceholder
 * @param {boolean}  opts.isDocContext
 * @param {boolean}  opts.isTestFile
 * @param {boolean}  opts.isDummyValue
 * @param {boolean}  opts.isInComment
 * @param {Array}    opts.extraSignals    - additional [{label, score, positive}]
 * @returns {{ confidence: number, severity: string, signals: Array }}
 */
export function buildConfidence(opts = {}) {
  const {
    baseScore = 50,
    isProviderRule = false,
    hasSecretVarName = false,
    isHighEntropy = false,
    isVeryHighEntropy = false,
    entropy = 0,
    hasSuspiciousAssignment = false,
    isSensitiveFile = false,
    hasNearbyKeyword = false,
    isPlaceholder = false,
    isDocContext = false,
    isTestFile = false,
    isDummyValue = false,
    isInComment = false,
    extraSignals = [],
  } = opts;

  const signals = [];
  let score = baseScore;

  // — Positive signals —
  if (isProviderRule) {
    signals.push({ ...BASE_SIGNALS.PROVIDER_PATTERN, positive: true });
    score += BASE_SIGNALS.PROVIDER_PATTERN.score;
  }
  if (hasSecretVarName) {
    signals.push({ ...BASE_SIGNALS.SECRET_KEYWORD, positive: true });
    score += BASE_SIGNALS.SECRET_KEYWORD.score;
  }
  if (isVeryHighEntropy) {
    const label = `Very high entropy (${entropy.toFixed(1)} bits)`;
    signals.push({ label, score: BASE_SIGNALS.ENTROPY_VERY_HIGH.score, positive: true });
    score += BASE_SIGNALS.ENTROPY_VERY_HIGH.score;
  } else if (isHighEntropy) {
    const label = `High entropy (${entropy.toFixed(1)} bits)`;
    signals.push({ label, score: BASE_SIGNALS.HIGH_ENTROPY.score, positive: true });
    score += BASE_SIGNALS.HIGH_ENTROPY.score;
  }
  if (hasSuspiciousAssignment) {
    signals.push({ ...BASE_SIGNALS.SUSPICIOUS_ASSIGN, positive: true });
    score += BASE_SIGNALS.SUSPICIOUS_ASSIGN.score;
  }
  if (isSensitiveFile) {
    signals.push({ ...BASE_SIGNALS.SENSITIVE_FILE, positive: true });
    score += BASE_SIGNALS.SENSITIVE_FILE.score;
  }
  if (hasNearbyKeyword) {
    signals.push({ ...BASE_SIGNALS.NEARBY_KEYWORD, positive: true });
    score += BASE_SIGNALS.NEARBY_KEYWORD.score;
  }

  // — Negative signals —
  if (isPlaceholder) {
    signals.push({ ...PENALTY_SIGNALS.PLACEHOLDER, positive: false });
    score += PENALTY_SIGNALS.PLACEHOLDER.score;
  }
  if (isDocContext) {
    signals.push({ ...PENALTY_SIGNALS.DOC_CONTEXT, positive: false });
    score += PENALTY_SIGNALS.DOC_CONTEXT.score;
  }
  if (isTestFile) {
    signals.push({ ...PENALTY_SIGNALS.TEST_FILE, positive: false });
    score += PENALTY_SIGNALS.TEST_FILE.score;
  }
  if (isDummyValue) {
    signals.push({ ...PENALTY_SIGNALS.DUMMY_VALUE, positive: false });
    score += PENALTY_SIGNALS.DUMMY_VALUE.score;
  }
  if (isInComment) {
    signals.push({ ...PENALTY_SIGNALS.IN_COMMENT, positive: false });
    score += PENALTY_SIGNALS.IN_COMMENT.score;
  }

  // Extra custom signals
  for (const sig of extraSignals) {
    signals.push(sig);
    score += sig.score;
  }

  const confidence = Math.max(0, Math.min(100, Math.round(score)));
  const severity = scoreToSeverity(confidence);

  return { confidence, severity, signals };
}

export const computeConfidence = buildConfidence;
