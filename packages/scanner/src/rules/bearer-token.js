/**
 * rules/bearer-token.js — HTTP Bearer and Basic auth token detection.
 * Catches hardcoded Authorization header values in source code.
 */

export const RULES = [
  {
    id: 'HTTP_BEARER_TOKEN',
    name: 'HTTP Bearer Token',
    type: 'HTTP_BEARER_TOKEN',
    category: 'Authentication Tokens',
    // Authorization: Bearer <token>  or  "Bearer <token>"
    pattern: /[Bb]earer\s+([A-Za-z0-9\-_+/=.]{20,})/g,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 3.5,
    minLength: 20,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'Hardcoded Bearer token detected. May grant API access to a protected service.',
    remediation: 'Never hardcode Bearer tokens. Obtain them dynamically and store in secure, ephemeral storage.',
  },
  {
    id: 'HTTP_BASIC_AUTH',
    name: 'HTTP Basic Auth Credentials',
    type: 'HTTP_BASIC_AUTH',
    category: 'Authentication Tokens',
    // Authorization: Basic <base64>
    pattern: /[Bb]asic\s+([A-Za-z0-9+/]{20,}={0,2})\b/g,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 3.0,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'HTTP Basic authentication credentials (base64 encoded). Contains username:password.',
    remediation: 'Never hardcode Basic auth credentials. Use environment variables or a secrets manager.',
  },
  {
    id: 'HTTP_AUTH_HEADER',
    name: 'Authorization Header Value',
    type: 'HTTP_AUTH_HEADER',
    category: 'Authentication Tokens',
    // headers["Authorization"] = "..."  or  Authorization: "..."
    pattern: /[Aa]uthorization\s*[=:]\s*["']?(Bearer|Basic|Token|ApiKey)\s+([A-Za-z0-9\-_+/=.]{16,})["']?/g,
    captureGroup: 2,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 3.0,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'Hardcoded Authorization header value in source code.',
    remediation: 'Generate authorization values dynamically. Store credentials in environment variables.',
  },
];

export { RULES as rules };
