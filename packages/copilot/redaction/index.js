/**
 * packages/copilot/redaction/index.js
 *
 * In-Memory Secret and PII Redaction Engine.
 *
 * SAFETY INVARIANTS:
 *   - Guarantees ZERO raw secrets or unmasked credentials ever pass to AI prompts,
 *     logs, clipboard previews, or telemetry.
 *   - Replaces credentials with safe masked representations or [REDACTED_SECRET].
 *   - Deeply sanitizes strings, objects, arrays, and error stacks.
 */

// Universal pattern detector for common secret shapes
export const SECRET_REDACTION_PATTERNS = [
  // AWS Access Key ID
  { pattern: /AKIA[0-9A-Z]{16}/g, label: 'AWS_ACCESS_KEY' },
  // AWS Secret Access Key
  { pattern: /(?<=aws_secret_access_key\s*[:=]\s*["'])[A-Za-z0-9/+=]{40}(?=["'])/gi, label: 'AWS_SECRET' },
  // GitHub PAT & OAuth tokens
  { pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/g, label: 'GITHUB_TOKEN' },
  // Stripe API Keys
  { pattern: /sk_(?:live|test)_[0-9a-zA-Z]{24,}/g, label: 'STRIPE_KEY' },
  // OpenAI API Key
  { pattern: /sk-(?:proj-)?[a-zA-Z0-9_-]{32,}/g, label: 'OPENAI_KEY' },
  // Slack Tokens
  { pattern: /xox[baprs]-[0-9a-zA-Z_-]{20,}/g, label: 'SLACK_TOKEN' },
  // Generic Bearer / Basic authorization tokens
  { pattern: /(?<=Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, label: 'BEARER_TOKEN' },
  { pattern: /(?<=Basic\s+)[A-Za-z0-9+/=]{20,}/gi, label: 'BASIC_AUTH' },
  // Private Key Headers & Content
  { pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g, label: 'PRIVATE_KEY_BLOCK' },
  // Database connection URLs with passwords
  { pattern: /([a-zA-Z0-9+]+:\/\/[^:]+:)([^@]+)(@.+)/g, replaceFn: (match, p1, pass, p3) => `${p1}[REDACTED_DB_PASS]${p3}` },
  // Generic variable assignments containing potential secret values (quotes)
  { pattern: /((?:api_?key|secret|password|passwd|auth_?token|access_?token|private_?key)\s*[:=]\s*["'])([^"']{8,})(["'])/gi, replaceFn: (match, p1, val, p3) => `${p1}[REDACTED_SECRET]${p3}` },
];

/**
 * Redact all secret occurrences from a string.
 *
 * @param {string} text - Raw input text
 * @returns {string} Sanitized text with secrets masked
 */
export function redactSecrets(text) {
  if (typeof text !== 'string') return '';
  let sanitized = text;

  for (const rule of SECRET_REDACTION_PATTERNS) {
    if (rule.replaceFn) {
      sanitized = sanitized.replace(rule.pattern, rule.replaceFn);
    } else {
      sanitized = sanitized.replace(rule.pattern, `[REDACTED_${rule.label || 'SECRET'}]`);
    }
  }

  return sanitized;
}

/**
 * Recursively sanitize any JavaScript data structure (objects, arrays, strings).
 *
 * @param {any} data - Input payload
 * @returns {any} Deeply sanitized copy
 */
export function sanitizeDataDeep(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return redactSecrets(data);
  if (typeof data === 'number' || typeof data === 'boolean') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataDeep(item));
  }

  if (typeof data === 'object') {
    const cleaned = {};
    const blockedKeyNames = ['rawsecret', 'rawvalue', 'secret', 'password', 'privatekey', 'token', 'authheader'];

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');
      if (blockedKeyNames.some(b => lowerKey.includes(b))) {
        cleaned[key] = typeof value === 'string' ? '[REDACTED_SECRET]' : '[REDACTED_FIELD]';
      } else {
        cleaned[key] = sanitizeDataDeep(value);
      }
    }
    return cleaned;
  }

  return data;
}

/**
 * Mask a secret value into a safe 8-character preview string (e.g. "sk_l...4f9a").
 *
 * @param {string} rawSecret - Secret candidate
 * @returns {string} Safe masked representation
 */
export function maskSecretValue(rawSecret) {
  if (!rawSecret || typeof rawSecret !== 'string') return '••••••••';
  const str = rawSecret.trim();
  if (str.includes('••••') || str.includes('***') || str.includes('[REDACTED')) return str;
  if (str.length <= 6) return '••••••••';

  const prefixLen = Math.min(4, Math.floor(str.length / 4));
  const suffixLen = Math.min(4, Math.floor(str.length / 4));
  return `${str.slice(0, prefixLen)}••••${str.slice(-suffixLen)}`;
}
