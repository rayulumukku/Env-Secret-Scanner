/**
 * JWT (JSON Web Token) detection rules.
 */

import { maskSecret } from '../masking.js';
import { shannonEntropy } from '../entropy.js';

// JWT pattern: three base64url-encoded segments separated by dots
const JWT_PATTERN = /\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b/g;

/**
 * Attempt to determine JWT severity based on its contents.
 * We only look at the header (first segment) which is not sensitive.
 *
 * @param {string} token
 * @returns {{ severity, confidence, details }}
 */
function analyzeJWT(token) {
  try {
    const [headerB64] = token.split('.');
    // Pad base64url to standard base64
    const padded = headerB64.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (padded.length % 4)) % 4;
    const base64 = padded + '='.repeat(padding);

    let header;
    if (typeof Buffer !== 'undefined') {
      header = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } else {
      header = JSON.parse(atob(base64));
    }

    const alg = header.alg || '';
    const typ = header.typ || '';

    // None algorithm = dangerous
    if (alg.toLowerCase() === 'none') {
      return {
        severity: 'CRITICAL',
        confidence: 95,
        details: 'JWT uses "none" algorithm — authentication bypass possible',
      };
    }

    if (alg.startsWith('RS') || alg.startsWith('ES')) {
      return { severity: 'HIGH', confidence: 88, details: `JWT with ${alg} algorithm` };
    }

    return { severity: 'MEDIUM', confidence: 80, details: `JWT with ${alg} algorithm` };
  } catch {
    return { severity: 'MEDIUM', confidence: 70, details: 'JWT token detected' };
  }
}

/**
 * Detect JWTs in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  const regex = new RegExp(JWT_PATTERN.source, JWT_PATTERN.flags);
  let match;

  while ((match = regex.exec(content)) !== null) {
    const rawValue = match[0];

    // Minimum viable JWT is 3 segments, each with content
    const parts = rawValue.split('.');
    if (parts.length !== 3 || parts.some(p => p.length < 4)) continue;

    // High entropy check on the signature portion
    const sig = parts[2];
    const entropy = shannonEntropy(sig);
    if (entropy < 3.5) continue; // Too low entropy, likely a false positive

    const { severity, confidence, details } = analyzeJWT(rawValue);

    const upToMatch = content.slice(0, match.index);
    const line = upToMatch.split('\n').length;
    const lastNewline = upToMatch.lastIndexOf('\n');
    const column = match.index - lastNewline;

    // For JWTs, show header + payload prefix, mask signature
    const maskedValue = `${parts[0]}.${maskSecret(parts[1], { showPrefix: 4, showSuffix: 0 })}.••••••••`;

    findings.push({
      type: 'JWT_TOKEN',
      name: 'JSON Web Token (JWT)',
      category: 'Authentication Tokens',
      severity,
      confidence,
      line,
      column,
      file: filename,
      maskedValue,
      description: `${details}. JWTs may contain encoded user data and grant API access.`,
      remediation: 'Verify this JWT is not a real production token. JWTs should never be hardcoded. Use environment variables.',
      lineContent: lines[line - 1] || '',
    });
  }

  return findings;
}
