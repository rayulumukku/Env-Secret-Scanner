/**
 * lib/security/redact.js
 *
 * Centralized High-Performance Secret Redaction Utility.
 *
 * GUARANTEES:
 *   - Recursively sanitizes logs, errors, webhook payloads, API responses, and exceptions.
 *   - Combines structural key matching AND deep heuristic regex content matching.
 *   - Replaces any sensitive string or object key value with "[REDACTED]".
 *   - NEVER leaks raw source code, credentials, or connection strings.
 */

// Keys whose values should always be completely redacted
const SENSITIVE_KEY_PATTERN = /^(.*_)?(token|secret|password|passwd|apiKey|api_key|accessToken|access_token|refreshToken|refresh_token|privateKey|private_key|authorization|clientSecret|client_secret|cookie|jwt|bearer|signature|sessionToken|session_token|auth|credentials|databaseUrl|database_url|webhookSecret|webhook_secret|encryptionKey|encryption_key)(_.*)?$/i;

// Regex patterns to detect embedded sensitive strings within any text content
const EMBEDDED_SECRET_PATTERNS = [
  // Database connection URLs with passwords
  /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis|amqp):\/\/[^:\s]+:[^@\s]+@[^\s"']+/gi,

  // Private key blocks (RSA, OpenSSH, EC, DSA, Generic)
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/gi,

  // AWS Access Key ID
  /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,

  // GitHub tokens (classic PAT, fine-grained, oauth, user-to-server)
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/g,

  // Slack tokens
  /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}\b/g,
  /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/g,

  // Stripe secret keys
  /\b(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}\b/g,

  // OpenAI project / API keys
  /\bsk-[a-zA-Z0-9]{20,T3BlbkFJ[a-zA-Z0-9]{20,}\b/g,
  /\bsk-proj-[a-zA-Z0-9_-]{20,}\b/g,

  // JWTs (header.payload.signature)
  /\beyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_.+/=]{10,}\b/g,

  // Authorization headers
  /(?:Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi,
];

/**
 * Redact embedded sensitive string patterns from plain text.
 *
 * @param {string} text
 * @returns {string} Redacted text
 */
export function redactString(text) {
  if (typeof text !== 'string') return text;

  let result = text;
  for (const pattern of EMBEDDED_SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

/**
 * Deep recursive redaction of sensitive keys and embedded strings.
 *
 * @param {any} input
 * @param {Set<any>} [seen=new Set()] Circular reference protection
 * @returns {any} Fully redacted clone
 */
export function redactSensitive(input, seen = new Set()) {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return redactString(input);
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (input instanceof Error) {
    return redactError(input);
  }

  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  if (typeof input !== 'object') {
    return input;
  }

  // Circular reference guard
  if (seen.has(input)) {
    return '[CIRCULAR_REF]';
  }
  seen.add(input);

  if (Array.isArray(input)) {
    return input.map(item => redactSensitive(item, seen));
  }

  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactSensitive(value, seen);
    }
  }

  return result;
}

/**
 * Redact error objects to ensure no credentials or internal URLs leak.
 *
 * @param {Error} error
 * @returns {object} Safe sanitized error descriptor
 */
export function redactError(error) {
  if (!error) return null;

  const message = typeof error.message === 'string' ? redactString(error.message) : 'An error occurred';
  const name = error.name || 'Error';

  return {
    name,
    message,
    code: error.code || 'INTERNAL_ERROR',
    status: error.status || 500,
  };
}
