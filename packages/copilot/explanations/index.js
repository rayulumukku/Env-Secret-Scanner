/**
 * packages/copilot/explanations/index.js
 *
 * Structured Finding, Commit, and PR Explanation Engine for SecretShield Copilot.
 * 
 * SAFETY INVARIANTS:
 *   - Never claims a credential is valid unless verified through authoritative evidence.
 *   - All explanations are deterministic and evidence-backed.
 *   - Source lines containing secrets are always masked.
 *   - Provider remediation steps use verified static knowledge; no fabricated URLs.
 */

import { maskSecretValue, redactSecrets } from '../redaction/index.js';

// Provider-specific static remediation intelligence catalog
export const PROVIDER_KNOWLEDGE = {
  aws: {
    name: 'Amazon Web Services (AWS)',
    credentialType: 'AWS Access Key / Secret Key Pair',
    likelyLocation: 'AWS IAM Console or CLI configuration (~/.aws/credentials)',
    impact: 'Unauthorized access to AWS cloud infrastructure, S3 buckets, EC2 compute, and IAM management.',
    docReference: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html',
    rotationSteps: [
      '1. Create a new access key in AWS IAM for the designated user or service role.',
      '2. Update the target application/CI configuration with the new key in secret storage.',
      '3. Verify applications and services function properly with the new key.',
      '4. Deactivate (disable) the old exposed key in AWS IAM Console.',
      '5. Delete the deactivated key permanently after monitoring for zero traffic.'
    ]
  },
  github: {
    name: 'GitHub',
    credentialType: 'GitHub Personal Access Token (PAT) / OAuth Token',
    likelyLocation: 'GitHub Developer Settings -> Personal Access Tokens',
    impact: 'Unauthorized access to GitHub repositories, pull requests, organization packages, and workflow runs.',
    docReference: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
    rotationSteps: [
      '1. Navigate to GitHub Settings -> Developer settings -> Personal access tokens.',
      '2. Generate a new token with minimal necessary scopes and explicit expiration.',
      '3. Update GitHub Actions secrets or application environment variables.',
      '4. Revoke the exposed token immediately from GitHub Settings.'
    ]
  },
  stripe: {
    name: 'Stripe',
    credentialType: 'Stripe API Secret / Restricted Key',
    likelyLocation: 'Stripe Dashboard -> Developers -> API Keys',
    impact: 'Direct access to payment processing, customer financial records, invoices, and charges.',
    docReference: 'https://stripe.com/docs/keys#rolling-keys',
    rotationSteps: [
      '1. Log in to the Stripe Dashboard under Developers > API Keys.',
      '2. Roll the compromised secret key, specifying an expiration window for the old key (or immediate).',
      '3. Deploy the replacement key into secure environment variables.',
      '4. Audit recent API request logs in the Stripe Dashboard for unauthorized transactions.'
    ]
  },
  openai: {
    name: 'OpenAI',
    credentialType: 'OpenAI API Secret Key',
    likelyLocation: 'OpenAI Platform Console -> API Keys',
    impact: 'Unauthorized API usage, quota exhaustion, unexpected billing charges, and potential data exfiltration.',
    docReference: 'https://platform.openai.com/api-keys',
    rotationSteps: [
      '1. Open the OpenAI Platform Dashboard at platform.openai.com/api-keys.',
      '2. Generate a new Secret Key with project-scoped permissions.',
      '3. Update your application secret manager or .env with the new key.',
      '4. Delete or revoke the compromised key immediately in the dashboard.'
    ]
  },
  slack: {
    name: 'Slack',
    credentialType: 'Slack Bot / User / Webhook Token',
    likelyLocation: 'Slack API Console (api.slack.com/apps)',
    impact: 'Access to internal channel messages, workspace member directories, and ability to post on behalf of bots.',
    docReference: 'https://api.slack.com/authentication/token-types',
    rotationSteps: [
      '1. Navigate to api.slack.com/apps and select your application.',
      '2. Regenerate the Bot or User OAuth token under "OAuth & Permissions".',
      '3. Reinstall the app to workspace if prompted to activate new token.',
      '4. Update backend secret storage and restart dependent services.'
    ]
  },
  generic: {
    name: 'Generic API / Secret',
    credentialType: 'API Key / Auth Token / Secret',
    likelyLocation: 'Provider Developer Portal or Admin Settings',
    impact: 'Potential unauthorized access to downstream third-party services and data APIs.',
    docReference: null,
    rotationSteps: [
      '1. Locate the credential in the issuing service provider dashboard.',
      '2. Generate a fresh replacement credential with least-privilege permissions.',
      '3. Inject the replacement credential into environment variables or secret store.',
      '4. Invalidate and revoke the exposed credential on the provider dashboard.'
    ]
  }
};

/**
 * Detects potential false-positive indicators for a finding.
 *
 * @param {Object} finding
 * @param {string} [fileContent]
 * @returns {Array<{ type: string, description: string, evidence: string }>}
 */
export function detectFalsePositiveIndicators(finding, fileContent = '') {
  const indicators = [];
  const filePath = (finding.filePath || '').toLowerCase();
  const masked = (finding.maskedValue || '').toLowerCase();
  const ruleId = (finding.ruleId || '').toLowerCase();
  const entropy = typeof finding.entropy === 'number' ? finding.entropy : null;

  // 1. Placeholder detection
  const placeholderKeywords = [
    'example', 'your_key', 'your-key', 'your_api', 'your_', 'dummy',
    'fake', 'sample', 'placeholder', 'changeme', '000000', 'xxxxxx', '123456'
  ];
  if (placeholderKeywords.some(kw => masked.includes(kw) || ruleId.includes(kw))) {
    indicators.push({
      type: 'PLACEHOLDER_DETECTED',
      description: 'The matched value contains standard placeholder patterns or dummy strings.',
      evidence: 'Masked value pattern resembles standard sample/placeholder text.'
    });
  }

  // 2. Test / Mock / Fixture / Spec file path
  const testPathPatterns = [/\/tests?\//, /\/fixtures?\//, /\/mocks?\//, /\/specs?\//, /\.test\.[a-z]+$/, /\.spec\.[a-z]+$/, /\/testdata\//];
  if (testPathPatterns.some(p => p.test(filePath))) {
    indicators.push({
      type: 'TEST_FILE_CONTEXT',
      description: 'The finding is located inside an automated test suite, mock fixture, or benchmark sample.',
      evidence: `File path '${finding.filePath}' matches test/mock directory conventions.`
    });
  }

  // 3. Documentation file context
  const docExtensions = ['.md', '.markdown', '.rst', '.txt', '.doc', '.pdf'];
  if (docExtensions.some(ext => filePath.endsWith(ext))) {
    indicators.push({
      type: 'DOCUMENTATION_CONTEXT',
      description: 'The finding is inside a documentation or markdown file, likely an illustrative guide.',
      evidence: 'File extension indicates markdown or text documentation.'
    });
  }

  // 4. Low Shannon Entropy (< 3.0 for 16+ char secrets)
  if (entropy !== null && entropy < 3.0) {
    indicators.push({
      type: 'LOW_ENTROPY',
      description: 'Calculated Shannon entropy is unusually low for a high-entropy cryptographically random secret.',
      evidence: `Entropy score is ${entropy.toFixed(2)} (typical random secrets exceed 3.50).`
    });
  }

  // 5. Excluded or build output path
  const buildPaths = ['/node_modules/', '/dist/', '/build/', '/.next/', '/coverage/'];
  if (buildPaths.some(bp => filePath.includes(bp))) {
    indicators.push({
      type: 'EXCLUDED_BUILD_PATH',
      description: 'Finding is located in an excluded build artifact, bundle, or dependency directory.',
      evidence: 'File path belongs to generated or ignored build directory.'
    });
  }

  return indicators;
}

/**
 * Resolves appropriate provider metadata based on rule ID or finding category.
 *
 * @param {Object} finding
 * @returns {Object} Provider metadata
 */
export function resolveProviderMetadata(finding) {
  const ruleId = (finding.ruleId || '').toLowerCase();
  const category = (finding.category || '').toLowerCase();

  if (ruleId.includes('aws') || category.includes('aws')) return PROVIDER_KNOWLEDGE.aws;
  if (ruleId.includes('github') || category.includes('github')) return PROVIDER_KNOWLEDGE.github;
  if (ruleId.includes('stripe') || category.includes('stripe')) return PROVIDER_KNOWLEDGE.stripe;
  if (ruleId.includes('openai') || category.includes('openai')) return PROVIDER_KNOWLEDGE.openai;
  if (ruleId.includes('slack') || category.includes('slack')) return PROVIDER_KNOWLEDGE.slack;

  return PROVIDER_KNOWLEDGE.generic;
}

/**
 * Generates a comprehensive, structured explanation for a single finding.
 *
 * @param {Object} finding - Raw finding
 * @param {Object} [options]
 * @param {string} [options.fileContent] - Full file text
 * @returns {Object} Structured finding explanation
 */
export function explainFinding(finding, options = {}) {
  if (!finding || typeof finding !== 'object') {
    throw new Error('Valid finding object required for explanation');
  }

  const {
    id,
    fingerprint,
    ruleId = 'GENERIC_SECRET',
    ruleName = 'Generic Secret Detected',
    severity = 'MEDIUM',
    confidence = 0.85,
    filePath = 'unknown',
    line = 1,
    column = 1,
    maskedValue,
    entropy,
    verificationStatus = 'UNVERIFIED'
  } = finding;

  const safeMasked = maskedValue ? maskSecretValue(maskedValue) : '••••••••';
  const provider = resolveProviderMetadata(finding);
  const fpIndicators = detectFalsePositiveIndicators(finding, options.fileContent);

  // Confidence assessment
  let confidenceLevel = 'MEDIUM';
  let confidenceReason = 'Matched detection pattern syntax.';
  if (confidence >= 0.90 && fpIndicators.length === 0) {
    confidenceLevel = 'HIGH';
    confidenceReason = 'Strong regex pattern match, typical token structure, and zero false-positive indicators.';
  } else if (fpIndicators.length > 0 || confidence < 0.70) {
    confidenceLevel = 'LOW';
    confidenceReason = `Contains potential false-positive indicators (${fpIndicators.map(i => i.type).join(', ')}).`;
  }

  // 6-step remediation plan
  const remediationPlan = [
    {
      step: 1,
      phase: 'Source Removal',
      action: `Replace hardcoded secret in ${filePath} with environment variable or secret manager reference.`
    },
    {
      step: 2,
      phase: 'Credential Rotation',
      action: `Generate a new credential in ${provider.name} and revoke the compromised token (${safeMasked}).`
    },
    {
      step: 3,
      phase: 'Historical Cleanup',
      action: 'Check if this secret was committed in Git history. If so, rewrite history with git-filter-repo or SecretShield git cleaner.'
    },
    {
      step: 4,
      phase: 'Repository State Verification',
      action: 'Verify that .env is in .gitignore and no unencrypted config files contain production secrets.'
    },
    {
      step: 5,
      phase: 'Rescan',
      action: 'Run `secretshield scan` locally or trigger CI scan to verify finding is fully resolved.'
    },
    {
      step: 6,
      phase: 'Remediation Confirmation',
      action: 'Confirm finding status is marked RESOLVED with audit record in SecretShield.'
    }
  ];

  return {
    summary: `Detected a ${ruleName} in ${filePath}:${line}`,
    whatWasDetected: `Identified candidate secret matching rule '${ruleId}' (${ruleName}).`,
    whyItMatched: `Matched rule '${ruleId}' syntax patterns with masked structure '${safeMasked}'${entropy ? ` and Shannon entropy of ${entropy.toFixed(2)}` : ''}.`,
    whereItWasDetected: {
      filePath,
      line,
      column,
      maskedPreview: safeMasked
    },
    whyItMatters: provider.impact,
    evidence: {
      ruleId,
      ruleName,
      severity,
      entropy: entropy ? Number(entropy.toFixed(2)) : undefined,
      verificationStatus: verificationStatus === 'ACTIVE'
        ? 'VERIFIED_ACTIVE (Authoritative response confirmed credential validity)'
        : 'UNVERIFIED (Offline pattern detection only; validity not confirmed against external APIs)',
      isVerified: verificationStatus === 'ACTIVE'
    },
    confidence: {
      level: confidenceLevel,
      score: confidence,
      reason: confidenceReason
    },
    falsePositiveIndicators: fpIndicators,
    providerGuidance: {
      providerName: provider.name,
      credentialType: provider.credentialType,
      likelyLocation: provider.likelyLocation,
      documentationUrl: provider.docReference || 'Documentation reference not available in static catalog.',
      rotationSteps: provider.rotationSteps
    },
    remediationPlan,
    disclaimer: 'AI and automated suggestions are advisory only. Never automatically modify source code or rotate credentials without human review.'
  };
}

/**
 * Generates an explanation for a Git commit.
 *
 * @param {Object} commitData
 * @returns {Object} Structured commit explanation
 */
export function explainCommit(commitData = {}) {
  const {
    sha = 'HEAD',
    author = 'developer',
    message = 'Commit update',
    filesChanged = [],
    findingsIntroduced = [],
    findingsRemoved = [],
    findingsResurfaced = [],
    policiesEvaluated = [],
    securityEvents = []
  } = commitData;

  const shortSha = String(sha).slice(0, 7);
  const netImpact = findingsIntroduced.length - findingsRemoved.length;

  return {
    commitSha: sha,
    shortSha,
    author: redactSecrets(author),
    message: redactSecrets(message),
    summary: `Commit ${shortSha}: ${findingsIntroduced.length} new finding(s) introduced, ${findingsRemoved.length} resolved.`,
    filesChangedCount: filesChanged.length,
    filesChanged: filesChanged.slice(0, 20),
    securityDelta: {
      findingsIntroduced: findingsIntroduced.map(f => ({
        ruleId: f.ruleId || 'SECRET',
        filePath: f.filePath,
        line: f.line,
        severity: f.severity || 'HIGH',
        maskedValue: maskSecretValue(f.maskedValue)
      })),
      findingsRemoved: findingsRemoved.map(f => ({
        ruleId: f.ruleId || 'SECRET',
        filePath: f.filePath,
        severity: f.severity || 'HIGH'
      })),
      findingsResurfaced: findingsResurfaced.map(f => ({
        ruleId: f.ruleId || 'SECRET',
        filePath: f.filePath
      })),
      netFindingChange: netImpact > 0 ? `+${netImpact}` : `${netImpact}`
    },
    policiesEvaluated: policiesEvaluated.map(p => ({
      name: p.name || 'Policy',
      status: p.passed ? 'PASSED' : 'VIOLATION_BLOCKED',
      severity: p.severity || 'HIGH'
    })),
    securityEvents: securityEvents.map(e => redactSecrets(String(e))),
    remediationImpact: findingsIntroduced.length > 0
      ? 'Commit introduces high-risk secrets. Recommended action: run `secretshield fix` before pushing.'
      : 'No new security findings detected in this commit.'
  };
}

/**
 * Generates an explanation for a Pull Request.
 *
 * @param {Object} prData
 * @returns {Object} Structured PR explanation
 */
export function explainPullRequest(prData = {}) {
  const {
    number = 0,
    title = 'Pull Request',
    author = 'developer',
    baseBranch = 'main',
    headBranch = 'feature',
    newFindings = [],
    existingFindings = [],
    resolvedFindings = [],
    policyViolations = [],
    ruleChanges = [],
    baselineChanges = []
  } = prData;

  const isBlocked = policyViolations.length > 0 || newFindings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');

  return {
    prNumber: number,
    title: redactSecrets(title),
    author: redactSecrets(author),
    branches: `${headBranch} -> ${baseBranch}`,
    securityStatus: isBlocked ? 'BLOCKED' : 'PASSING',
    summary: `PR #${number} has ${newFindings.length} new finding(s), ${resolvedFindings.length} resolved, and ${policyViolations.length} policy violation(s).`,
    findingsOverview: {
      newFindingsCount: newFindings.length,
      existingFindingsCount: existingFindings.length,
      resolvedFindingsCount: resolvedFindings.length,
      criticalNewFindings: newFindings.filter(f => f.severity === 'CRITICAL').length,
      highNewFindings: newFindings.filter(f => f.severity === 'HIGH').length
    },
    newFindingsList: newFindings.map(f => ({
      ruleId: f.ruleId,
      ruleName: f.ruleName || f.ruleId,
      filePath: f.filePath,
      line: f.line,
      severity: f.severity,
      maskedValue: maskSecretValue(f.maskedValue)
    })),
    policyViolations: policyViolations.map(p => ({
      policyName: p.name || p.rule,
      action: p.action || 'BLOCK_MERGE',
      reason: p.reason || 'Secret detected'
    })),
    ruleChangesCount: ruleChanges.length,
    baselineChangesCount: baselineChanges.length,
    recommendation: isBlocked
      ? 'Remediate detected secrets before merging. Do not force-merge without explicit security sign-off.'
      : 'All security checks passed. PR is clean.'
  };
}

/**
 * Generates a safe PR comment markdown string.
 *
 * @param {Object} prExplanation - Result of explainPullRequest
 * @param {Object} [options]
 * @returns {string} Safe PR comment markdown
 */
export function generateSafePullRequestComment(prExplanation, options = {}) {
  if (options.disabledByOrgAdmin) {
    return '<!-- SecretShield PR comments disabled by organization policy -->';
  }

  const { prNumber, securityStatus, findingsOverview, newFindingsList = [], policyViolations = [] } = prExplanation;
  const statusEmoji = securityStatus === 'BLOCKED' ? '🛑' : '✅';

  const lines = [
    `### ${statusEmoji} SecretShield Security Summary (PR #${prNumber})`,
    '',
    `**Status:** \`${securityStatus}\` &nbsp;|&nbsp; **New Findings:** \`${findingsOverview.newFindingsCount}\` &nbsp;|&nbsp; **Resolved:** \`${findingsOverview.resolvedFindingsCount}\``,
    ''
  ];

  if (policyViolations.length > 0) {
    lines.push('#### ⚠️ Policy Violations');
    for (const p of policyViolations) {
      lines.push(`- **${p.policyName}**: \`${p.action}\` — ${p.reason}`);
    }
    lines.push('');
  }

  if (newFindingsList.length > 0) {
    lines.push('#### 🔍 Detected Findings (Masked)');
    lines.push('| Severity | Rule | Location | Masked Preview |');
    lines.push('| :--- | :--- | :--- | :--- |');
    for (const f of newFindingsList.slice(0, 10)) {
      lines.push(`| \`${f.severity}\` | ${f.ruleName} | \`${f.filePath}:${f.line}\` | \`${f.maskedValue}\` |`);
    }
    if (newFindingsList.length > 10) {
      lines.push(`*...and ${newFindingsList.length - 10} more findings.*`);
    }
    lines.push('');
    lines.push('> 💡 **Quick Remediation:** Replace hardcoded credentials with environment variables (`process.env.VAR`) and add placeholder entries to `.env.example`.');
  } else {
    lines.push('🎉 No new secret exposures detected in this PR.');
  }

  lines.push('');
  lines.push('---');
  lines.push('🔒 *Scanned with SecretShield. No raw secrets or tokens are ever included in comments.*');

  return lines.join('\n');
}

