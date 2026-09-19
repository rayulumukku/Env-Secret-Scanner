/**
 * rules/jwt.js — JSON Web Token detection.
 * JWTs have 3 base64url-encoded segments separated by dots.
 * We validate structure rather than just matching the pattern.
 */

/** Try to decode a JWT header to confirm it looks real */
function isRealJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // Attempt to decode the header
    const header = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const padded = header + '==='.slice(0, (4 - header.length % 4) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    // Must have alg field
    return parsed && typeof parsed.alg === 'string';
  } catch {
    return false;
  }
}

export const RULES = [
  {
    id: 'JWT_TOKEN',
    name: 'JSON Web Token (JWT)',
    type: 'JWT_TOKEN',
    category: 'Authentication Tokens',
    // 3 dot-separated base64url segments
    pattern: /\beyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/=]+\b/g,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 4.0,
    maskOptions: { showPrefix: 12, showSuffix: 4 },
    description: 'Hardcoded JWT detected. JWTs may contain user identity and authorization claims.',
    remediation: 'Never hardcode JWTs. Tokens should be generated dynamically and stored securely (httpOnly cookies or secure storage).',
    // Custom validator used in engine
    validate: isRealJWT,
  },
];

export { RULES as rules };
