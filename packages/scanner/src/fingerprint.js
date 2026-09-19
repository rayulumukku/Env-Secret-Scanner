/**
 * Fingerprinting for findings — used for deduplication and allowlist matching.
 * Uses a deterministic hash so the same secret at the same location
 * always gets the same fingerprint without storing the raw secret.
 */

/**
 * Simple djb2-style hash for browser + Node.js compatibility
 * (avoids needing the crypto module on the client side).
 *
 * @param {string} str
 * @returns {string} hex-like fingerprint string
 */
function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to unsigned hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Create a stable fingerprint for a finding.
 * Does NOT include the raw secret value — only masked value + metadata.
 * Supports both object parameter `{ type, file, line, maskedValue, column }` and positional arguments.
 *
 * @param {object|string} findingOrType
 * @param {string} [file='']
 * @param {number} [line=0]
 * @param {string} [maskedValue='']
 * @param {number} [column=0]
 * @returns {string} fingerprint string like "aws_a1b2c3d4_config.js_42"
 */
export function createFingerprint(findingOrType, file = '', line = 0, maskedValue = '', column = 0) {
  if (typeof findingOrType === 'object' && findingOrType !== null) {
    const { type = '', file: f = '', line: l = 0, maskedValue: m = '', column: c = 0 } = findingOrType;
    const raw = `${type}|${f}|${l}|${c}|${m}`;
    const hash = djb2Hash(raw);
    const typePrefix = type.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 12);
    return `${typePrefix}_${hash}`;
  }

  const type = String(findingOrType || '');
  const raw = `${type}|${file}|${line}|${column}|${maskedValue}`;
  const hash = djb2Hash(raw);
  const typePrefix = type.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 12);
  return `${typePrefix}_${hash}`;
}

/**
 * Check if two findings are duplicates based on their fingerprints.
 *
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
export function areDuplicates(a, b) {
  return (
    a.type === b.type &&
    a.file === b.file &&
    a.line === b.line &&
    a.maskedValue === b.maskedValue
  );
}

/**
 * Deduplicate an array of findings.
 *
 * @param {object[]} findings
 * @returns {object[]}
 */
export function deduplicateFindings(findings) {
  const seen = new Set();
  return findings.filter(finding => {
    if (seen.has(finding.fingerprint)) return false;
    seen.add(finding.fingerprint);
    return true;
  });
}
