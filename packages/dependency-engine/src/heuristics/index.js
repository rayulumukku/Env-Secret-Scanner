/**
 * packages/dependency-engine/src/heuristics/index.js
 *
 * Supply-Chain Heuristic Analyzer & Typosquatting Detection.
 * Emits factual heuristic signals for suspicious packages without claiming authoritative maliciousness.
 *
 * SECURITY INVARIANTS:
 * - Always emits status: SUSPICIOUS_SIGNAL.
 * - NEVER labels a package as "malicious" without third-party authoritative confirmation.
 * - Does NOT block installations or mutate files automatically.
 */

export const SIGNAL_STATUS = {
  SUSPICIOUS_SIGNAL: 'SUSPICIOUS_SIGNAL',
  INFORMATIONAL: 'INFORMATIONAL'
};

/**
 * High-profile reference packages frequently targeted by typosquatting attacks.
 */
export const POPULAR_REFERENCE_PACKAGES = {
  npm: [
    'react', 'react-dom', 'express', 'lodash', 'axios', 'chalk', 'moment',
    'dotenv', 'webpack', 'typescript', 'cross-env', 'commander', 'eslint',
    'body-parser', 'cors', 'debug', 'next', 'vue', 'electron'
  ],
  pypi: [
    'requests', 'urllib3', 'numpy', 'pandas', 'flask', 'django', 'pytest',
    'cryptography', 'pillow', 'scipy', 'boto3', 'wheel', 'setuptools'
  ],
  cargo: [
    'serde', 'tokio', 'rand', 'syn', 'clap', 'regex', 'chrono', 'futures'
  ],
  golang: [
    'gin-gonic/gin', 'gorilla/mux', 'spf13/cobra', 'sirupsen/logrus'
  ]
};

/**
 * Calculates Levenshtein distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function computeLevenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Detects whether a candidate package name is suspiciously similar to a known popular package.
 *
 * @param {string} candidateName
 * @param {string} ecosystem
 * @returns {{ isTyposquatCandidate: boolean, candidate: string, referencePackage: string|null, reason: string|null }}
 */
export function detectTyposquatting(candidateName, ecosystem = 'npm') {
  if (!candidateName || typeof candidateName !== 'string') {
    return { isTyposquatCandidate: false, candidate: candidateName, referencePackage: null, reason: null };
  }

  const targetName = candidateName.toLowerCase().trim();
  const references = POPULAR_REFERENCE_PACKAGES[ecosystem] || POPULAR_REFERENCE_PACKAGES.npm;

  // Exact match to popular package is legitimate
  if (references.includes(targetName)) {
    return { isTyposquatCandidate: false, candidate: candidateName, referencePackage: targetName, reason: null };
  }

  for (const ref of references) {
    // 1. Single character distance or transposition
    const dist = computeLevenshteinDistance(targetName, ref);

    // Rule: Distance 1 for words length >= 4, distance 2 for words length >= 7
    if ((dist === 1 && ref.length >= 4) || (dist === 2 && ref.length >= 7)) {
      let reason = 'Single character variation';
      if (targetName.length === ref.length) {
        reason = 'Character substitution or transposition';
      } else if (targetName.length > ref.length) {
        reason = 'Added character';
      } else {
        reason = 'Removed character';
      }

      return {
        isTyposquatCandidate: true,
        candidate: candidateName,
        referencePackage: ref,
        reason: `${reason} compared to popular package "${ref}" (edit distance: ${dist})`
      };
    }

    // 2. Homoglyph / visual similarity checks (e.g. rn -> m, 0 -> o, 1 -> l, v -> w)
    const normalizedCandidate = targetName
      .replace(/0/g, 'o')
      .replace(/1/g, 'l')
      .replace(/rn/g, 'm')
      .replace(/vv/g, 'w');

    const normalizedRef = ref
      .replace(/0/g, 'o')
      .replace(/1/g, 'l')
      .replace(/rn/g, 'm')
      .replace(/vv/g, 'w');

    if (normalizedCandidate === normalizedRef && targetName !== ref) {
      return {
        isTyposquatCandidate: true,
        candidate: candidateName,
        referencePackage: ref,
        reason: `Homoglyph or visual character substitution mimicking popular package "${ref}"`
      };
    }
  }

  return { isTyposquatCandidate: false, candidate: candidateName, referencePackage: null, reason: null };
}

/**
 * Analyzes package metadata (scripts, structure) for heuristic suspicion signals.
 *
 * @param {object} packageInfo - Package metadata or manifest snippet
 * @returns {Array<object>} Array of heuristic signal findings
 */
export function analyzePackageHeuristics(packageInfo = {}) {
  const signals = [];
  const pkgName = packageInfo.name || 'unnamed-package';
  const ecosystem = packageInfo.ecosystem || 'npm';

  // 1. Typosquatting Check
  const typoCheck = detectTyposquatting(pkgName, ecosystem);
  if (typoCheck.isTyposquatCandidate) {
    signals.push({
      signalType: 'TYPOSQUATTING_SIMILARITY',
      status: SIGNAL_STATUS.SUSPICIOUS_SIGNAL,
      package: pkgName,
      referencePackage: typoCheck.referencePackage,
      summary: `Package name "${pkgName}" exhibits similarity to popular package "${typoCheck.referencePackage}".`,
      evidence: { reason: typoCheck.reason },
      provenance: 'SecretShield Typosquatting Heuristics Engine'
    });
  }

  // 2. Suspicious Lifecycle Scripts (npm preinstall, postinstall, etc.)
  const scripts = packageInfo.scripts || {};
  const dangerousScriptTriggers = [
    { pattern: /(curl|wget|nc\s+-e|bash\s+-i|sh\s+-i)/i, description: 'Direct shell download or interactive remote shell' },
    { pattern: /(powershell.*(?:downloadstring|bypass)|certutil\s+-urlcache)/i, description: 'PowerShell/CertUtil binary download execution' },
    { pattern: /(eval\s*\(\s*Buffer\.from|atob\s*\(|fromCharCode)/i, description: 'Obfuscated base64 payload execution' },
  ];

  for (const [scriptName, scriptBody] of Object.entries(scripts)) {
    if (typeof scriptBody !== 'string') continue;

    for (const trigger of dangerousScriptTriggers) {
      if (trigger.pattern.test(scriptBody)) {
        signals.push({
          signalType: 'SUSPICIOUS_LIFECYCLE_SCRIPT',
          status: SIGNAL_STATUS.SUSPICIOUS_SIGNAL,
          package: pkgName,
          scriptName,
          summary: `Package lifecycle script "${scriptName}" contains suspicious command pattern: ${trigger.description}.`,
          evidence: {
            scriptName,
            patternMatched: trigger.description,
            // Do not copy unrestricted script body if excessively long
            scriptSnippet: scriptBody.slice(0, 100)
          },
          provenance: 'SecretShield Static AST/Script Heuristic Analyzer'
        });
      }
    }
  }

  return signals;
}
