/**
 * Shannon entropy calculator for secret detection.
 * High entropy strings in assignment contexts are likely secrets.
 */

const CHARSET_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_DIGITS = '0123456789';
const CHARSET_SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
const CHARSET_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const CHARSET_HEX = '0123456789abcdefABCDEF';

/**
 * Calculate Shannon entropy of a string.
 * @param {string} str
 * @returns {number} entropy value (0–6 typical range)
 */
export function shannonEntropy(str) {
  if (!str || str.length === 0) return 0;

  const freq = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Determine which character set a string belongs to.
 * @param {string} str
 * @returns {string}
 */
export function detectCharset(str) {
  const hasLower = /[a-z]/.test(str);
  const hasUpper = /[A-Z]/.test(str);
  const hasDigit = /[0-9]/.test(str);
  const hasSpecial = /[^a-zA-Z0-9]/.test(str);

  if (!hasLower && !hasUpper && hasDigit && !hasSpecial) return 'numeric';
  if (!hasLower && !hasUpper && /^[0-9a-fA-F]+$/.test(str)) return 'hex';
  if (/^[A-Za-z0-9+/=]+$/.test(str)) return 'base64';
  if (hasLower && hasUpper && hasDigit) return 'alphanumeric_mixed';
  return 'generic';
}

/**
 * Check if a string is valid Base64 encoded
 * @param {string} str
 * @returns {boolean}
 */
export function isBase64(str) {
  if (!str || typeof str !== 'string' || str.length < 4) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(str) && str.length % 4 === 0;
}

/**
 * Check if a string is valid Hexadecimal
 * @param {string} str
 * @returns {boolean}
 */
export function isHex(str) {
  if (!str || typeof str !== 'string' || str.length < 4) return false;
  return /^[0-9a-fA-F]+$/.test(str);
}

/**
 * Check if a string is likely a high-entropy secret.
 * @param {string} value
 * @param {object} options
 * @param {number} options.minLength - minimum string length to consider
 * @param {number} options.threshold - entropy threshold (default 4.5)
 * @returns {{ isHighEntropy: boolean, entropy: number, charset: string }}
 */
export function isHighEntropySecret(value, options = {}) {
  const { minLength = 16, threshold = 4.5 } = options;

  if (!value || value.length < minLength) {
    return { isHighEntropy: false, entropy: 0, charset: 'unknown' };
  }

  // Skip common false positives: file paths, URLs, template strings
  if (value.includes('://') || value.startsWith('/') || value.includes('${')) {
    return { isHighEntropy: false, entropy: 0, charset: 'path_or_url' };
  }

  // Skip obvious placeholder values — use exact/prefix match, NOT substring,
  // to avoid false-positives like AKIAIOSFODNN7EXAMPLE matching "example"
  const EXACT_PLACEHOLDERS = [
    'your_api_key', 'your_secret', 'your_token', 'your_password', 'your_key',
    'placeholder', 'changeme', 'change_me',
    'xxxxxxxx', 'yyyyyyyy', '00000000', '11111111',
    'password', 'secret', 'token', 'key', 'demo', 'test',
  ];
  const lower = value.toLowerCase();
  // Only exact match OR value starts with the placeholder word followed by _ or -
  const isExactPlaceholder = EXACT_PLACEHOLDERS.some(p =>
    lower === p || lower.startsWith(p + '_') || lower.startsWith(p + '-')
  );
  if (isExactPlaceholder) {
    return { isHighEntropy: false, entropy: 0, charset: 'placeholder' };
  }
  // All-same character
  if (/^(.)\1{5,}$/.test(value)) {
    return { isHighEntropy: false, entropy: 0, charset: 'uniform' };
  }

  const entropy = shannonEntropy(value);
  const charset = detectCharset(value);

  return {
    isHighEntropy: entropy >= threshold,
    entropy: Math.round(entropy * 100) / 100,
    charset,
  };
}
