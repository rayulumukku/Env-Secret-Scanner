/**
 * Secret masking utilities.
 * NEVER expose full secret values in UI, logs, or API responses.
 */

/**
 * Mask a secret value, revealing only partial prefix/suffix.
 * e.g. "sk-proj-abcdefghij1234567890" → "sk-proj-••••••••••1234"
 *
 * @param {string} value - the raw secret string
 * @param {object} options
 * @param {number} options.showPrefix - chars to show at start (default 8)
 * @param {number} options.showSuffix - chars to show at end (default 4)
 * @returns {string} masked value
 */
export function maskSecret(value, options = {}) {
  if (!value || typeof value !== 'string') return '••••••••';

  const { showPrefix = 8, showSuffix = 4 } = options;
  const len = value.length;

  // If string is very short, mask entirely
  if (len <= showPrefix + showSuffix) {
    return '•'.repeat(Math.min(len, 12));
  }

  const prefix = value.slice(0, showPrefix);
  const suffix = value.slice(-showSuffix);
  const maskedMiddle = '•'.repeat(Math.min(len - showPrefix - showSuffix, 12));

  return `${prefix}${maskedMiddle}${suffix}`;
}

/**
 * Mask a secret within a line of source code.
 * Replaces only the matched secret portion with bullets.
 *
 * @param {string} line - full source line
 * @param {string} secret - the raw secret to mask
 * @param {object} options
 * @returns {string} line with secret masked
 */
export function maskSecretInLine(line, secret, options = {}) {
  if (!line || !secret) return line;

  const { showPrefix = 6, showSuffix = 4 } = options;
  const len = secret.length;

  let maskedSecret;
  if (len <= showPrefix + showSuffix) {
    maskedSecret = '•'.repeat(Math.min(len, 10));
  } else {
    const prefix = secret.slice(0, showPrefix);
    const suffix = secret.slice(-showSuffix);
    maskedSecret = `${prefix}${'•'.repeat(8)}${suffix}`;
  }

  // Replace all occurrences of the secret in the line
  return line.split(secret).join(maskedSecret);
}

/**
 * Create a masked context snippet showing lines around a finding.
 *
 * @param {string[]} lines - all lines of the file
 * @param {number} targetLine - 1-indexed line number of the finding
 * @param {string} secret - raw secret to mask
 * @param {number} contextLines - number of lines above/below to include
 * @returns {{ lines: Array<{lineNo, content, isTarget}> }}
 */
export function createMaskedContext(lines, targetLine, secret, contextLines = 3) {
  const start = Math.max(0, targetLine - 1 - contextLines);
  const end = Math.min(lines.length - 1, targetLine - 1 + contextLines);

  const result = [];
  for (let i = start; i <= end; i++) {
    const isTarget = i === targetLine - 1;
    result.push({
      lineNo: i + 1,
      content: isTarget ? maskSecretInLine(lines[i], secret) : lines[i],
      isTarget,
    });
  }

  return { lines: result };
}

/**
 * Mask multiple secrets in a single string.
 * @param {string} str
 * @param {string[]} secrets
 * @param {object} options
 * @returns {string}
 */
export function maskAllInString(str, secrets = [], options = {}) {
  let result = str;
  for (const secret of secrets) {
    if (secret) {
      result = maskSecretInLine(result, secret, options);
    }
  }
  return result;
}
