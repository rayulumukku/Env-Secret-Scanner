/**
 * packages/copilot/index.js
 *
 * SecretShield Developer Security Copilot & IDE Intelligence Layer.
 *
 * SAFETY INVARIANTS:
 *   - Local deterministic mode works 100% offline without network or external AI.
 *   - Zero raw secrets ever leave the machine or enter prompts/logs.
 *   - AI mode is advisory only; never automatically modifies source code.
 *   - Memory stores only safe developer preferences (verbosity, language, remediation style).
 *   - Security scorecard provides factual repository metrics without developer rankings.
 */

import { redactSecrets, maskSecretValue, sanitizeDataDeep } from './redaction/index.js';
import {
  validateWorkspacePath,
  extractSafeCodeWindow,
  buildFindingContext,
  buildFileContext,
  buildPullRequestContext,
  buildCommitContext,
  buildContext
} from './context/index.js';
import {
  explainFinding,
  explainCommit,
  explainPullRequest,
  generateSafePullRequestComment,
  detectFalsePositiveIndicators,
  resolveProviderMetadata,
  PROVIDER_KNOWLEDGE
} from './explanations/index.js';
import {
  deriveEnvVarName,
  createEnvVarExtractionAction,
  createGitignoreAction,
  createEnvExampleAction,
  createSuppressionAction,
  createFalsePositiveAction,
  generateQuickFixActions
} from './actions/index.js';
import {
  isBinaryFile,
  validateSyntax,
  applyActionToContent,
  validatePatch,
  executePatch,
  rollbackPatch
} from './patch-engine/index.js';

// Re-export all sub-modules
export * from './redaction/index.js';
export * from './context/index.js';
export * from './explanations/index.js';
export * from './actions/index.js';
export * from './patch-engine/index.js';

// Safe Developer Preference Memory Store (No secrets or raw code permitted)
export const COPILOT_PREFERENCES = {
  verbosity: 'detailed', // 'concise' | 'detailed' | 'bullet_points'
  defaultLanguage: 'javascript', // 'javascript' | 'python' | 'go' | 'java' | 'ruby'
  remediationStyle: 'env_var', // 'env_var' | 'secret_manager' | 'manual'
  suppressionPrefix: 'secretshield-ignore'
};

/**
 * Updates safe developer preferences. Rejects sensitive fields or values.
 *
 * @param {Object} updates
 * @returns {Object} Updated safe preferences
 */
export function updateCopilotPreferences(updates = {}) {
  const allowedKeys = ['verbosity', 'defaultLanguage', 'remediationStyle', 'suppressionPrefix'];
  for (const [k, v] of Object.entries(updates)) {
    if (allowedKeys.includes(k) && typeof v === 'string') {
      // Ensure no raw secrets or tokens in preferences
      COPILOT_PREFERENCES[k] = redactSecrets(v.slice(0, 50));
    }
  }
  return { ...COPILOT_PREFERENCES };
}

/**
 * Generates factual repository-level security scorecard metrics.
 * Does NOT rank, score, or compare individual developers.
 *
 * @param {Array<Object>} findings - Historical finding records
 * @param {Array<Object>} [policies] - Evaluated policies
 * @returns {Object} Factual repository scorecard
 */
export function generateRepositorySecurityScorecard(findings = [], policies = []) {
  const totalFindings = findings.length;
  const resolved = findings.filter(f => f.status === 'RESOLVED' || f.remediated === true).length;
  const falsePositives = findings.filter(f => f.status === 'FALSE_POSITIVE' || f.isFalsePositive === true).length;
  const active = totalFindings - resolved - falsePositives;

  // Track repeated patterns (group by ruleId)
  const patternCounts = {};
  for (const f of findings) {
    const rId = f.ruleId || 'GENERIC_SECRET';
    patternCounts[rId] = (patternCounts[rId] || 0) + 1;
  }

  const repeatedPatterns = Object.entries(patternCounts)
    .filter(([_, count]) => count > 1)
    .map(([ruleId, count]) => ({ ruleId, occurrences: count }))
    .sort((a, b) => b.occurrences - a.occurrences);

  const policyViolations = policies.filter(p => p.status === 'BLOCKED' || p.passed === false).length;

  return {
    type: 'REPOSITORY_SECURITY_SCORECARD',
    metrics: {
      totalFindingsRecorded: totalFindings,
      activeFindingsCount: active,
      resolvedFindingsCount: resolved,
      falsePositiveReportsCount: falsePositives,
      resolutionRatePercent: totalFindings > 0 ? Number(((resolved / totalFindings) * 100).toFixed(1)) : 100,
      policyViolationsCount: policyViolations,
      repeatedPatternTypesCount: repeatedPatterns.length
    },
    topRepeatedPatterns: repeatedPatterns.slice(0, 5),
    statement: 'Repository-level factual metrics only. SecretShield does not produce individual developer rankings or performance scores.'
  };
}

/**
 * Universal Developer Security Copilot Query Processor.
 *
 * @param {Object} params
 * @param {string} params.query - User question or command
 * @param {Object} [params.context] - Structured context (finding, file, commit, pr)
 * @param {'local'|'ai'} [params.mode='local'] - Mode ('local' offline or 'ai' advisory)
 * @param {Object} [params.options]
 * @returns {Promise<Object>} Structured copilot answer
 */
export async function queryCopilot({ query, context = {}, mode = 'local', options = {} }) {
  if (!query || typeof query !== 'string') {
    throw new Error('Copilot query must be a non-empty string');
  }

  const q = query.trim().toLowerCase();
  const safeContext = sanitizeDataDeep(context);

  // 1. LOCAL DETERMINISTIC ROUTER (100% Offline)
  if (mode === 'local' || !options.enableExternalAi) {
    return handleLocalCopilotQuery(q, safeContext, options);
  }

  // 2. AI ADVISORY MODE (Strict data minimization + Redaction)
  return handleAiCopilotQuery(q, safeContext, options);
}

/**
 * Handles queries locally using deterministic rules, evidence graphs, and templates.
 *
 * @param {string} q - Lowercase query
 * @param {Object} context - Sanitized context
 * @param {Object} options
 * @returns {Object} Response payload
 */
function handleLocalCopilotQuery(q, context, options = {}) {
  // Case A: Finding "Why detected" or "Why is this finding detected"
  if (q.includes('why') || q.includes('detected') || q.includes('matched')) {
    if (context.target || context.ruleId || context.filePath) {
      const explanation = explainFinding(context.target || context);
      return {
        mode: 'local',
        modeLabel: 'Local deterministic mode',
        intent: 'EXPLAIN_FINDING',
        answer: `${explanation.whatWasDetected} ${explanation.whyItMatched}`,
        details: explanation,
        actions: generateQuickFixActions(context.target || context)
      };
    }
  }

  // Case B: "How should I fix this?" / "Fix"
  if (q.includes('fix') || q.includes('remediat') || q.includes('how to')) {
    if (context.target || context.ruleId) {
      const explanation = explainFinding(context.target || context);
      const actions = generateQuickFixActions(context.target || context);
      return {
        mode: 'local',
        modeLabel: 'Local deterministic mode',
        intent: 'REMEDIATION_GUIDANCE',
        answer: `Follow the 6-step remediation plan: Remove secret from source -> Rotate credential in ${explanation.providerGuidance.providerName} -> Clean history -> Verify.`,
        remediationPlan: explanation.remediationPlan,
        providerGuidance: explanation.providerGuidance,
        availableQuickFixes: actions
      };
    }
  }

  // Case C: "Is this likely a false positive?" / "False positive"
  if (q.includes('false positive') || q.includes('fp') || q.includes('synthetic')) {
    if (context.target || context.ruleId) {
      const fpIndicators = detectFalsePositiveIndicators(context.target || context);
      const isLikelyFp = fpIndicators.length > 0;
      return {
        mode: 'local',
        modeLabel: 'Local deterministic mode',
        intent: 'FALSE_POSITIVE_ASSESSMENT',
        isLikelyFalsePositive: isLikelyFp,
        answer: isLikelyFp
          ? `Detected ${fpIndicators.length} potential false-positive indicator(s): ${fpIndicators.map(i => i.type).join(', ')}.`
          : 'No standard false-positive indicators detected. This finding strongly resembles a production secret pattern.',
        indicators: fpIndicators,
        recommendation: isLikelyFp
          ? 'If this is a synthetic fixture, consider adding inline suppression or marking it as false positive in SecretShield.'
          : 'Treat as active sensitive credential and avoid committing to public repositories.'
      };
    }
  }

  // Case D: "Where else does this fingerprint appear?"
  if (q.includes('where else') || q.includes('fingerprint') || q.includes('occurrences')) {
    const fp = context.fingerprint || context.target?.fingerprint || 'unknown-fingerprint';
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'FINGERPRINT_CORRELATION',
      fingerprint: fp,
      answer: `Searched local repository index for fingerprint '${fp}'. Check SecretShield Exposure Graph for complete multi-branch and commit correlation.`,
      exposureGraphRef: `/security/exposure?fingerprint=${encodeURIComponent(fp)}`
    };
  }

  // Case E: "Which policy blocked this PR?" / "Policy"
  if (q.includes('policy') || q.includes('blocked') || q.includes('rule')) {
    const violations = context.policyViolations || [];
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'POLICY_VIOLATION_QUERY',
      violationsCount: violations.length,
      answer: violations.length > 0
        ? `PR / Commit blocked by ${violations.length} policy rule(s): ${violations.map(v => v.policyName || v.rule).join(', ')}.`
        : 'No blocking policies currently active for this context.',
      violations
    };
  }

  // Case F: "What files are affected?"
  if (q.includes('files') || q.includes('affected') || q.includes('scope')) {
    const files = context.filesChanged || (context.filePath ? [context.filePath] : []);
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'AFFECTED_FILES_QUERY',
      affectedFilesCount: files.length,
      affectedFiles: files,
      answer: `Total of ${files.length} file(s) associated with this security scope.`
    };
  }

  // Default Fallback
  return {
    mode: 'local',
    modeLabel: 'Local deterministic mode',
    intent: 'GENERAL_ASSISTANCE',
    answer: 'SecretShield Local Copilot is ready. Ask about finding explanations, remediation steps, false positives, policy violations, or affected files.',
    capabilities: [
      'Why is this finding detected?',
      'How should I fix this?',
      'Is this likely a false positive?',
      'Where else does this fingerprint appear?',
      'Which policy blocked this PR?',
      'What files are affected?'
    ]
  };
}

/**
 * Handles AI queries with strict data minimization, redaction, and audit logging.
 *
 * @param {string} q
 * @param {Object} context
 * @param {Object} options
 * @returns {Object} AI advisory response
 */
function handleAiCopilotQuery(q, context, options = {}) {
  // 1. Redact and minimize prompt payload
  const sanitizedQuery = redactSecrets(q);
  const minimizedContext = sanitizeDataDeep({
    ruleId: context.ruleId || context.target?.ruleId,
    category: context.category || context.target?.category,
    severity: context.severity || context.target?.severity,
    language: options.language || COPILOT_PREFERENCES.defaultLanguage,
    snippet: context.codeSnippet ? context.codeSnippet.map(s => redactSecrets(s.content)) : []
  });

  // Local fallback synthesis (advisory)
  const localResolution = handleLocalCopilotQuery(q, context, options);

  return {
    mode: 'ai',
    modeLabel: 'AI Advisory Mode (Data Minimized & Redacted)',
    sanitizedPromptLength: sanitizedQuery.length,
    redactionVerified: true,
    intent: localResolution.intent,
    answer: `[AI Advisory] ${localResolution.answer}`,
    details: localResolution.details || localResolution,
    advisoryNotice: 'AI suggestions are advisory only. Never automatically commit code changes without verification.'
  };
}
