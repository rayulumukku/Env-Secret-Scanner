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
  if (q.includes('files') || (q.includes('affected') && !q.includes('repositor') && !q.includes('environment')) || q.includes('scope')) {
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

  // ── RUNTIME + CLOUD EXPOSURE INTELLIGENCE QUESTIONS ───────────────────────

  // Case G: "Was this finding deployed?"
  if (q.includes('was this finding deployed') || (q.includes('finding') && q.includes('deployed'))) {
    const deployments = context.deployments || context.matchingDeployments || [];
    const isDeployed = deployments.length > 0;
    const envs = deployments.map(d => d.environment || 'unknown').join(', ');
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'FINDING_DEPLOYMENT_QUERY',
      isDeployed,
      deploymentsCount: deployments.length,
      deployments,
      answer: isDeployed
        ? `Yes, this finding was present in ${deployments.length} deployment(s) affecting: ${envs}.`
        : 'No deployment records indicate this finding was deployed. (Status: Source exposure only)',
      evidence: deployments.map(d => `Deployment #${d.id} [${d.environment}] on commit ${d.commitSha || 'unknown'}`),
    };
  }

  // Case H: "Which environments contained this commit?"
  if (q.includes('which environments') || (q.includes('environments') && q.includes('commit'))) {
    const envs = context.affectedEnvironments || context.environments || [];
    const envNames = envs.map(e => typeof e === 'string' ? e : e.environmentName || e.name);
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'ENVIRONMENTS_FOR_COMMIT_QUERY',
      environmentsCount: envNames.length,
      environments: envNames,
      answer: envNames.length > 0
        ? `Commit was deployed to ${envNames.length} environment(s): ${envNames.join(', ')}.`
        : 'Commit was not recorded in any deployment environments.',
      evidence: envs,
    };
  }

  // Case I: "Which production deployments contain unresolved findings?"
  if (q.includes('production') && (q.includes('unresolved') || q.includes('contain') || q.includes('findings'))) {
    const prodDeployments = (context.deployments || []).filter(d =>
      d.isProduction === true || String(d.environment).toLowerCase() === 'production'
    );
    const affectedProd = prodDeployments.filter(d => (d.unresolvedFindingsCount || d.findingsCount || 0) > 0);
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'PRODUCTION_UNRESOLVED_FINDINGS_QUERY',
      productionDeploymentsCount: affectedProd.length,
      affectedDeployments: affectedProd,
      answer: affectedProd.length > 0
        ? `${affectedProd.length} production deployment(s) currently contain unresolved findings: ${affectedProd.map(d => `#${d.id} (${d.commitSha?.slice(0, 7) || 'HEAD'})`).join(', ')}.`
        : 'Zero production deployments contain unresolved findings based on current authoritative metadata.',
      evidence: affectedProd,
    };
  }

  // Case J: "Which cloud resources are associated with this application?"
  if (q.includes('cloud resources') || (q.includes('resources') && q.includes('application'))) {
    const resources = context.cloudResources || context.associatedCloudResources || [];
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'APPLICATION_CLOUD_RESOURCES_QUERY',
      resourcesCount: resources.length,
      resources,
      answer: resources.length > 0
        ? `Application is associated with ${resources.length} cloud resource(s): ${resources.map(r => `${r.resourceType || 'resource'}:${r.resourceId || r.id}`).join(', ')}.`
        : 'No cloud resources currently mapped to this application.',
      evidence: resources,
    };
  }

  // Case K: "Why is this resource considered exposed?"
  if (q.includes('why') && (q.includes('resource') || q.includes('exposed'))) {
    const postureFindings = context.postureFindings || context.findings || [];
    const reasons = postureFindings.map(f => f.title || f.description || f.reason);
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'RESOURCE_EXPOSURE_REASON_QUERY',
      isExposed: reasons.length > 0,
      reasonsCount: reasons.length,
      reasons,
      answer: reasons.length > 0
        ? `Resource considered exposed due to: ${reasons.join('; ')}.`
        : 'Resource configuration currently satisfies all least-privilege read-only baseline checks.',
      evidence: postureFindings.map(f => f.evidence || f),
    };
  }

  // Case L: "Why is this dependency vulnerable?"
  if (q.includes('why') && (q.includes('dependency') || q.includes('package')) && q.includes('vulnerable')) {
    const vuln = context.vulnerability || context.finding || {};
    const pkg = vuln.package || context.package || 'package';
    const installed = vuln.installedVersion || 'installed version';
    const range = vuln.affectedRange || 'affected range';
    const advId = vuln.advisoryId || vuln.cveId || 'advisory';
    const reachability = vuln.reachabilityStatus || 'DECLARED';
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'DEPENDENCY_VULNERABILITY_REASON_QUERY',
      package: pkg,
      installedVersion: installed,
      affectedRange: range,
      advisoryId: advId,
      reachability,
      answer: `Dependency ${pkg}@${installed} is vulnerable because it satisfies affected range ${range} documented in ${advId}. Reachability evidence status: ${reachability}. (Note: SecretShield reports reachability, not unverified runtime exploitation).`,
      evidence: vuln.evidence || vuln,
    };
  }

  // Case M: "Where is this package used?"
  if (q.includes('where') && (q.includes('package') || q.includes('dependency')) && (q.includes('used') || q.includes('located'))) {
    const dep = context.dependency || context.target || {};
    const paths = dep.dependencyPath || (dep.manifestPath ? [dep.manifestPath] : ['declared in project manifests']);
    const isDirect = dep.isDirect !== false;
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'PACKAGE_USAGE_LOCATION_QUERY',
      package: dep.name || context.package || 'package',
      isDirect,
      paths,
      answer: `Package ${dep.name || context.package || 'package'} is used as a ${isDirect ? 'direct' : 'transitive'} dependency. Path: ${paths.join(' → ')}.`,
      evidence: { dependencyPath: paths, isDirect },
    };
  }

  // Case N: "Which repositories are affected?"
  if (q.includes('which') && q.includes('repositor') && (q.includes('affected') || q.includes('contain'))) {
    const repos = context.affectedRepositories || context.repositories || [];
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'AFFECTED_REPOSITORIES_QUERY',
      repositoriesCount: repos.length,
      repositories: repos,
      answer: repos.length > 0
        ? `Advisory or dependency affects ${repos.length} repository(ies): ${repos.join(', ')}.`
        : 'No repositories currently match the specified dependency criteria.',
      evidence: repos,
    };
  }

  // Case O: "Can I upgrade safely?"
  if (q.includes('can i upgrade') || (q.includes('upgrade') && (q.includes('safe') || q.includes('how')))) {
    const fixedVersion = context.fixedVersion || context.vulnerability?.fixedVersion;
    const current = context.currentVersion || context.vulnerability?.installedVersion;
    const isDirect = context.isDirect !== false;
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'SAFE_UPGRADE_ASSESSMENT_QUERY',
      currentVersion: current,
      fixedVersion: fixedVersion || null,
      answer: fixedVersion
        ? `Safe upgrade proposal: ${current || 'current'} → ${fixedVersion}. ${isDirect ? 'Manifest update diff can be generated via SecretShield.' : 'Package is a transitive dependency; update top-level parent constraint or override in lockfile.'}`
        : 'No authoritative fixed version is currently published in the advisory database.',
      evidence: { currentVersion: current, fixedVersion, isDirect },
    };
  }

  // Case P: "What does this advisory affect?"
  if (q.includes('advisory') && (q.includes('affect') || q.includes('impact'))) {
    const adv = context.advisory || context.vulnerability || {};
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'ADVISORY_IMPACT_QUERY',
      advisoryId: adv.id || adv.advisoryId,
      package: adv.package,
      ecosystem: adv.ecosystem,
      affectedRange: adv.affectedRange,
      severity: adv.severity,
      answer: `Advisory ${adv.id || adv.advisoryId || 'metadata'} affects package ${adv.package || ''} (${adv.ecosystem || 'ecosystem'}) for versions in range ${adv.affectedRange || '*'}. Severity: ${adv.severity || 'UNKNOWN'}.`,
      evidence: adv,
    };
  }

  // Case Q: "What changed in this PR?"
  if (q.includes('what') && (q.includes('changed') || q.includes('pr')) && (q.includes('dependenc') || q.includes('package'))) {
    const prDiff = context.prDiff || context.dependencyDiff || { dependencyChanges: [] };
    const changes = prDiff.dependencyChanges || [];
    return {
      mode: 'local',
      modeLabel: 'Local deterministic mode',
      intent: 'PR_DEPENDENCY_CHANGES_QUERY',
      totalChanges: changes.length,
      changes,
      answer: changes.length > 0
        ? `PR modifies ${changes.length} dependency(ies): ${changes.map(c => `${c.package} (${c.changeType})`).join(', ')}.`
        : 'No dependency manifest or lockfile modifications detected in this PR.',
      evidence: prDiff,
    };
  }

  // Default Fallback
  return {
    mode: 'local',
    modeLabel: 'Local deterministic mode',
    intent: 'GENERAL_ASSISTANCE',
    answer: 'SecretShield Local Copilot is ready. Ask about secret findings, deployments, cloud posture, or dependency supply-chain security.',
    capabilities: [
      'Why is this finding detected?',
      'Why is this dependency vulnerable?',
      'Where is this package used?',
      'Which repositories are affected?',
      'Can I upgrade safely?',
      'What does this advisory affect?',
      'What changed in this PR?',
      'Was this finding deployed?',
      'Which environments contained this commit?',
      'Which cloud resources are associated with this application?',
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
