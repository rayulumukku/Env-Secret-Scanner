/**
 * context.js — Contextual analysis for secret detection.
 *
 * Examines the surroundings of a potential secret match to:
 *   - Boost confidence when near secret-related keywords
 *   - Penalize confidence for obvious placeholders / test values
 *   - Identify sensitive file types
 *
 * SECURITY: This module never receives nor logs raw secret values.
 * It only analyses surrounding text (variable names, line content).
 */

// Keywords that strongly suggest a nearby value is a secret
const SECRET_KEYWORDS = [
  'api_key', 'apikey', 'api-key', 'api_token', 'apitoken',
  'token', 'secret', 'password', 'passwd', 'pwd',
  'authorization', 'bearer', 'credential', 'credentials',
  'private_key', 'privatekey', 'private-key',
  'access_key', 'accesskey', 'access-key',
  'client_secret', 'clientsecret',
  'database_url', 'db_url', 'connection_string',
  'auth_token', 'authtoken', 'auth-token',
  'signing_key', 'signingkey', 'encrypt_key',
  'webhook_secret', 'webhook_token',
  'refresh_token', 'refresh-token',
];

// Values that are almost certainly false positives
const PLACEHOLDER_VALUES = [
  'example', 'sample', 'test', 'dummy', 'fake', 'placeholder',
  'changeme', 'change-me', 'change_me', 'replace-me', 'replace_me',
  'your-api-key', 'your_api_key', 'your-secret', 'your_secret',
  'your-token', 'your_token', 'your-password', 'your_password',
  'xxx', 'yyy', 'zzz', 'abc', 'foo', 'bar', 'baz',
  '<api_key>', '<token>', '<secret>', '<password>',
  'api_key_here', 'token_here', 'secret_here',
  'xxxxxxxx', 'yyyyyyyy', '00000000', '11111111',
  'none', 'null', 'undefined', 'empty', 'todo',
  'insert_here', 'put_here', 'fill_here',
  'hardcoded', 'notset', 'not-set', 'not_set',
  'secret123', 'password123', 'test123', 'admin',
  'passwd', 'passw0rd', 'p@ssword',
];

// Variable/key names that indicate the nearby value IS a secret
const SENSITIVE_VARIABLE_NAMES = [
  'secret', 'password', 'passwd', 'pwd', 'token', 'apikey',
  'api_key', 'private_key', 'auth', 'credential', 'access_key',
  'client_secret', 'signing_key', 'encryption_key', 'webhook',
];

// File names/patterns that indicate sensitive context (bonus)
const SENSITIVE_FILE_PATTERNS = [
  /\.env(\.|$)/i,
  /credentials?\./i,
  /secrets?\./i,
  /config\./i,
  /settings\./i,
  /\.pem$/i,
  /\.key$/i,
  /auth\./i,
  /password/i,
];

// Test/doc file patterns that reduce confidence
const TEST_FILE_PATTERNS = [
  /\.(test|spec|tests|specs)\.[jt]sx?$/i,
  /_test\.(go|py|rb)$/i,
  /test_.*\.(py|rb)$/i,
  /\/tests?\//i,
  /\/spec(s)?\//i,
  /\/fixtures?\//i,
  /\/examples?\//i,
  /README/i,
  /CHANGELOG/i,
  /\.md$/i,
];

/**
 * Check if a value is a known placeholder.
 * Uses word-boundary aware matching to avoid false positives
 * (e.g. AKIAIOSFODNN7EXAMPLE should NOT match 'example').
 * @param {string} value
 * @returns {boolean}
 */
export function isPlaceholder(value) {
  if (!value) return true;
  const lower = value.toLowerCase();

  // All same character repeated 5+ times (xxxxx, 00000)
  if (/^(.)\1{4,}$/.test(value)) return true;
  // Same char repeated 6+ times (handle spaces etc)
  const firstChar = value[0];
  if (value.split('').every(c => c === firstChar) && value.length >= 6) return true;

  // Angle/curly bracket template: <TOKEN>, ${TOKEN}, {{TOKEN}}
  if (/^[<{].*[>}]$/.test(value)) return true;

  // Clearly sequential: abcdefgh, 12345678
  if (/^(?:abcdef|123456|qwerty|asdfgh)/i.test(value) && value.length < 20) return true;

  // Word-boundary check: the keyword must appear as a standalone word
  // e.g. "example_key" matches but "AKIAEXAMPLE" does NOT
  const PLACEHOLDER_WORDS = [
    'changeme', 'change_me', 'replace_me', 'replaceme',
    'placeholder', 'your_api_key', 'your_secret', 'your_token', 'your_password',
    'api_key_here', 'token_here', 'secret_here',
    'xxxxxxxx', 'yyyyyyyy',
    'insert_here', 'put_here', 'fill_here', 'todo',
    'notset', 'not_set',
    'secret123', 'password123', 'test123',
    'passw0rd', 'p@ssword',
    // Compound placeholder prefixes: example_key, fake_token, sample_secret, dummy_value
    'example', 'sample', 'dummy', 'fake',
  ];
  if (PLACEHOLDER_WORDS.some(w => lower === w || lower.startsWith(w + '_') || lower.startsWith(w + '-'))) return true;


  // Word-boundary sensitive keywords (must be standalone words or form the whole value)
  const WORD_KEYWORDS = [
    'example', 'sample', 'dummy', 'fake', 'placeholder',
    'test', 'demo', 'none', 'null', 'undefined', 'empty',
    'changeme', 'admin', 'passwd',
  ];
  // Only flag if the entire value IS one of these words or it's clearly a template
  if (WORD_KEYWORDS.some(kw => lower === kw)) return true;

  // Pattern: your-xxx or xxx-here
  if (/^your[_\-]/.test(lower) || /[_\-]here$/.test(lower)) return true;

  return false;
}

/**
 * Extract the variable/key name from a line of code.
 * e.g. "const API_KEY = '...'" → "API_KEY"
 * @param {string} line
 * @returns {string}
 */
function extractVariableName(line) {
  const m = line.match(/(?:const|let|var|export)?\s*([A-Za-z_][A-Za-z0-9_]*)\s*[=:]/);
  return m ? m[1].toLowerCase() : '';
}

/**
 * Analyse the context around a secret match and return confidence signals.
 *
 * @param {object} opts
 * @param {string} opts.value        - The matched value (may be partially masked by caller — use only for placeholder check)
 * @param {string} opts.matchLine    - The line of code containing the match
 * @param {string} opts.surrounding  - A few lines before+after the match
 * @param {string} opts.filename     - Sanitized filename
 * @param {number} opts.baseConfidence - Starting confidence from the rule
 * @returns {{ confidence: number, signals: Array<{label, score, positive}> }}
 */
export function analyseContext({ value = '', matchLine = '', surrounding = '', filename = '', baseConfidence = 50 }) {
  const signals = [];
  let score = baseConfidence;

  const lowerLine = matchLine.toLowerCase();
  const lowerSurrounding = surrounding.toLowerCase();
  const lowerFilename = filename.toLowerCase();
  const varName = extractVariableName(matchLine);

  // ── POSITIVE SIGNALS ────────────────────────────────────────────────────

  // Secret keyword in variable name on same line
  const hasSecretVarName = SENSITIVE_VARIABLE_NAMES.some(kw =>
    varName.includes(kw) || lowerLine.includes(kw + '_') || lowerLine.includes('_' + kw)
  );
  if (hasSecretVarName) {
    signals.push({ label: 'Sensitive variable name', score: 20, positive: true });
    score += 20;
  }

  // Secret keyword anywhere on the same line
  const hasLineKeyword = SECRET_KEYWORDS.some(kw => lowerLine.includes(kw));
  if (hasLineKeyword && !hasSecretVarName) {
    signals.push({ label: 'Secret keyword on line', score: 10, positive: true });
    score += 10;
  }

  // Secret keyword in surrounding context (nearby lines)
  const hasSurroundingKeyword = SECRET_KEYWORDS.some(kw => lowerSurrounding.includes(kw));
  if (hasSurroundingKeyword && !hasLineKeyword) {
    signals.push({ label: 'Secret keyword in nearby code', score: 5, positive: true });
    score += 5;
  }

  // Sensitive file
  const isSensitiveFile = SENSITIVE_FILE_PATTERNS.some(p => p.test(filename));
  if (isSensitiveFile) {
    signals.push({ label: 'Sensitive file type', score: 10, positive: true });
    score += 10;
  }

  // ── NEGATIVE SIGNALS ─────────────────────────────────────────────────────

  // Placeholder value
  if (isPlaceholder(value)) {
    signals.push({ label: 'Placeholder or example value', score: -35, positive: false });
    score -= 35;
  }

  // Test file
  const isTestFile = TEST_FILE_PATTERNS.some(p => p.test(filename));
  if (isTestFile) {
    signals.push({ label: 'Test or documentation file', score: -15, positive: false });
    score -= 15;
  }

  // Documentation context keywords (comment on same line or nearby)
  const lineWithoutVal = lowerLine.replace(value.toLowerCase(), '');
  const surroundingWithoutVal = lowerSurrounding.replace(value.toLowerCase(), '');
  const docKeywords = ['example', 'sample', 'placeholder', 'documentation', 'readme', 'tutorial', 'demo', 'fake', 'dummy'];
  const hasDocContext = docKeywords.some(kw =>
    new RegExp(`\\b${kw}\\b`, 'i').test(lineWithoutVal) || new RegExp(`\\b${kw}\\b`, 'i').test(surroundingWithoutVal)
  );
  if (hasDocContext) {
    signals.push({ label: 'Documentation/example context', score: -20, positive: false });
    score -= 20;
  }

  // Inside a comment
  const isComment = /^\s*(\/\/|#|\/\*|\*|<!--)/.test(matchLine);
  if (isComment) {
    signals.push({ label: 'Value is inside a comment', score: -10, positive: false });
    score -= 10;
  }

  return {
    confidence: Math.max(0, Math.min(100, Math.round(score))),
    signals,
  };
}

/**
 * Determine severity from final confidence score.
 * @param {number} confidence 0–100
 * @returns {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'}
 */
export function confidenceToSeverity(confidence) {
  if (confidence >= 90) return 'CRITICAL';
  if (confidence >= 70) return 'HIGH';
  if (confidence >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Check if a filename should be skipped entirely.
 * @param {string} filename
 * @returns {boolean}
 */
export function isTestFile(filename) {
  return TEST_FILE_PATTERNS.some(p => p.test(filename));
}

/**
 * Extract context lines around a target line.
 * @param {string[]} lines
 * @param {number} targetLine
 * @param {number} radius
 * @returns {string}
 */
export function extractContext(lines, targetLine, radius = 3) {
  if (!Array.isArray(lines)) return '';
  const start = Math.max(0, targetLine - 1 - radius);
  const end = Math.min(lines.length - 1, targetLine - 1 + radius);
  return lines.slice(start, end + 1).join('\n');
}

export { SECRET_KEYWORDS, SENSITIVE_FILE_PATTERNS };
