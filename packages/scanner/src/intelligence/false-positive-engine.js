/**
 * lib/scanner/intelligence/false-positive-engine.js
 *
 * Deterministic False Positive filtering and template detection.
 * Identifies example strings, documentation placeholders, test values, and learned suppressions.
 *
 * PRIVACY & SAFETY:
 *   - 100% deterministic local rules.
 *   - No external AI APIs, no code transmission.
 */

const PLACEHOLDER_TERMS = [
  'changeme', 'change_me', 'change-me',
  'replace_me', 'replaceme', 'replace-me',
  'placeholder', 'insert_here', 'put_here', 'fill_here',
  'your_api_key', 'your-api-key', 'your_secret', 'your-secret',
  'your_token', 'your-token', 'your_password', 'your-password',
  'api_key_here', 'token_here', 'secret_here',
  'secret123', 'password123', 'test123',
  'admin', 'root', 'user', 'guest',
  'dummy_token', 'fake_key', 'sample_key',
];

const DOC_KEYWORDS = [
  'example', 'sample', 'placeholder', 'documentation',
  'readme', 'tutorial', 'demo', 'fake', 'dummy', 'fixture',
];

/**
 * Check if a candidate secret is an obvious template or placeholder value.
 *
 * @param {string} token - matched candidate string
 * @param {object} [context]
 * @param {string} [context.line='']
 * @param {string} [context.filename='']
 * @param {string} [context.envRisk='NONE']
 * @returns {{
 *   isFalsePositive: boolean,
 *   reason: string | null,
 *   penalty: number,
 *   signals: Array<{ label: string, score: number, positive: boolean }>
 * }}
 */
export function analyzeFalsePositive(token = '', context = {}) {
  const { line = '', filename = '', envRisk = 'NONE' } = context;
  const lowerToken = (token || '').toLowerCase();
  const lowerLine = (line || '').toLowerCase();
  const lowerFilename = (filename || '').toLowerCase();
  const signals = [];

  if (!token || typeof token !== 'string') {
    return { isFalsePositive: true, reason: 'Empty token', penalty: -100, signals };
  }

  // 1. Template variable syntax: ${VAR}, {{VAR}}, <TOKEN>, %VAR%, $VAR
  if (/^[<{].*[>}]$/.test(token) || /^\$\{.*\}$/.test(token) || /^\{\{.*\}\}$/.test(token)) {
    signals.push({ label: 'Template variable or placeholder placeholder (${...})', score: -40, positive: false });
    return { isFalsePositive: true, reason: 'Template placeholder syntax', penalty: -40, signals };
  }

  // 2. Exact placeholder matches (full string equals placeholder)
  if (PLACEHOLDER_TERMS.includes(lowerToken)) {
    signals.push({ label: `Known placeholder value (${lowerToken})`, score: -40, positive: false });
    return { isFalsePositive: true, reason: 'Known placeholder term', penalty: -40, signals };
  }

  // 3. Repeated characters: xxxxxxxx, 00000000, 11111111
  if (/^(.)\1{5,}$/.test(token)) {
    signals.push({ label: 'Repetitive single-character sequence', score: -35, positive: false });
    return { isFalsePositive: true, reason: 'Repeated character sequence', penalty: -35, signals };
  }

  // 4. Sequential characters: abcdef123, 123456789
  if (/^(?:abcdef|123456|qwerty|asdfgh)/i.test(token) && token.length < 24) {
    signals.push({ label: 'Sequential keyboard pattern', score: -30, positive: false });
    return { isFalsePositive: true, reason: 'Sequential character pattern', penalty: -30, signals };
  }

  // 5. Special handling for .env.example / .sample files
  if (envRisk === 'TEMPLATE' || lowerFilename.includes('.example') || lowerFilename.includes('.sample')) {
    signals.push({ label: 'Sample/template configuration file (.example)', score: -25, positive: false });
  }

  // 6. Documentation context around line (excluding the token value itself)
  const lineWithoutVal = lowerLine.replace(lowerToken, '');
  const isDocContext = DOC_KEYWORDS.some(kw =>
    new RegExp(`\\b${kw}\\b`, 'i').test(lineWithoutVal) || new RegExp(`\\b${kw}\\b`, 'i').test(lowerFilename)
  );

  if (isDocContext) {
    signals.push({ label: 'Documentation/tutorial/mock context', score: -20, positive: false });
  }

  // 7. Inside a code comment (//, #, /*, <!--)
  if (/^\s*(\/\/|#|\/\*|\*|<!--)/.test(line)) {
    signals.push({ label: 'Value is located inside a comment', score: -10, positive: false });
  }

  const totalPenalty = signals.reduce((sum, s) => sum + s.score, 0);

  return {
    isFalsePositive: totalPenalty <= -35,
    reason: signals[0]?.label || null,
    penalty: totalPenalty,
    signals,
  };
}

/**
 * Check if a finding fingerprint is suppressed by active project/organization suppressions.
 *
 * @param {string} fingerprint
 * @param {Set<string> | Array<string>} suppressedFingerprints
 * @returns {boolean}
 */
export function isSuppressed(fingerprint, suppressedFingerprints = new Set()) {
  if (!fingerprint) return false;
  if (suppressedFingerprints instanceof Set) {
    return suppressedFingerprints.has(fingerprint);
  }
  if (Array.isArray(suppressedFingerprints)) {
    return suppressedFingerprints.includes(fingerprint);
  }
  return false;
}
