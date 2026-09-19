/**
 * lib/scanner/intelligence/entropy-engine.js
 *
 * Multi-factor Shannon entropy analysis for cryptographic and random secret detection.
 *
 * SECURITY INVARIANT:
 *   - Evaluates statistical randomness without logging or storing raw tokens.
 *   - High entropy alone is NEVER classified as a critical secret without corroborating context.
 */

/**
 * Calculate standard Shannon Entropy in bits per character.
 *
 * @param {string} str - input string
 * @returns {number} entropy bits (0.0 to 8.0)
 */
export function calculateShannonEntropy(str = '') {
  if (!str || typeof str !== 'string') return 0;
  const len = str.length;
  if (len === 0) return 0;

  const frequencies = new Map();
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return Math.round(entropy * 100) / 100;
}

/**
 * Determine the character set composition of a string.
 *
 * @param {string} str
 * @returns {'hex' | 'base64' | 'base64url' | 'alphanumeric' | 'alphanumeric_mixed' | 'ascii' | 'numeric' | 'alpha'}
 */
export function analyzeCharset(str = '') {
  if (!str) return 'ascii';
  if (/^[0-9]+$/.test(str)) return 'numeric';
  if (/^[a-fA-F0-9]+$/.test(str)) return 'hex';
  if (/^[A-Za-z0-9+/=]+$/.test(str)) return 'base64';
  if (/^[A-Za-z0-9_-]+$/.test(str)) return 'base64url';
  if (/^[a-z0-9]+$/i.test(str)) return 'alphanumeric';
  return 'ascii';
}

/**
 * Perform comprehensive multi-factor entropy evaluation.
 *
 * @param {string} token - candidate secret string
 * @param {object} [options]
 * @param {number} [options.threshold=3.5] - base threshold
 * @param {number} [options.minLength=8] - minimum token length
 * @param {string} [options.language='unknown'] - file language
 * @param {boolean} [options.hasSecretContext=false] - nearby credential keyword
 * @returns {{
 *   isHighEntropy: boolean,
 *   isVeryHighEntropy: boolean,
 *   entropy: number,
 *   length: number,
 *   charset: string,
 *   score: number,
 *   signals: Array<{ label: string, score: number, positive: boolean }>
 * }}
 */
export function evaluateEntropy(token = '', options = {}) {
  const {
    threshold = 3.5,
    minLength = 8,
    hasSecretContext = false,
  } = options;

  if (!token || typeof token !== 'string' || token.length < minLength) {
    return {
      isHighEntropy: false,
      isVeryHighEntropy: false,
      entropy: 0,
      length: token?.length || 0,
      charset: 'ascii',
      score: 0,
      signals: [],
    };
  }

  const entropy = calculateShannonEntropy(token);
  const length = token.length;
  const charset = analyzeCharset(token);
  const signals = [];

  // Character diversity penalty: if only lowercase letters or all digits, lower score
  const isUniformCase = /^[a-z0-9_.-]+$/.test(token) || /^[A-Z0-9_.-]+$/.test(token);
  const hasMixedCase = /[a-z]/.test(token) && /[A-Z]/.test(token);
  const hasDigits = /[0-9]/.test(token);
  const hasSpecial = /[^A-Za-z0-9]/.test(token);

  // Dynamic threshold adjustment: longer strings require slightly lower entropy to be significant
  let dynamicThreshold = threshold;
  if (length >= 32) dynamicThreshold -= 0.3;
  if (length >= 64) dynamicThreshold -= 0.5;

  let isHigh = entropy >= dynamicThreshold;
  let isVeryHigh = entropy >= 5.0 || (entropy >= 4.5 && length >= 32 && hasMixedCase && hasDigits);

  let entropyScore = 0;
  if (isVeryHigh) {
    entropyScore = 20;
    signals.push({
      label: `Very high entropy (${entropy.toFixed(1)} bits, ${charset})`,
      score: 20,
      positive: true,
    });
  } else if (isHigh) {
    entropyScore = 15;
    signals.push({
      label: `High entropy (${entropy.toFixed(1)} bits, ${charset})`,
      score: 15,
      positive: true,
    });
  }

  if (hasMixedCase && hasDigits) {
    signals.push({
      label: 'Mixed-case alphanumeric token structure',
      score: 5,
      positive: true,
    });
  }

  return {
    isHighEntropy: isHigh,
    isVeryHighEntropy: isVeryHigh,
    entropy,
    length,
    charset,
    score: entropyScore,
    signals,
  };
}
