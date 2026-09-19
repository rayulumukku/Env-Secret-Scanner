/**
 * rules/generic-password.js — Generic password assignment detection.
 * Catches: password = "...", passwd: "...", pwd: "...", etc.
 */

export const RULES = [
  {
    id: 'GENERIC_PASSWORD',
    name: 'Hardcoded Password',
    type: 'GENERIC_PASSWORD',
    category: 'Generic Secrets',
    pattern: /(?:password|passwd|pwd|pass)\s*[=:]\s*["']([^"'\s]{6,})["']/gi,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 2.5,
    minLength: 6,
    maskOptions: { showPrefix: 3, showSuffix: 3 },
    description: 'Hardcoded password detected in source code.',
    remediation: 'Never hardcode passwords. Use environment variables or a secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.).',
  },
  {
    id: 'GENERIC_PRIVATE_KEY_VAR',
    name: 'Private Key Variable',
    type: 'GENERIC_PRIVATE_KEY_VAR',
    category: 'Generic Secrets',
    // private_key = "MII..."  or  privateKey: "..."
    pattern: /(?:private[_\-]?key|privatekey)\s*[=:]\s*["']([A-Za-z0-9+/=\-_]{16,})["']/gi,
    captureGroup: 1,
    severity: 'CRITICAL',
    isProviderRule: false,
    entropyThreshold: 3.5,
    maskOptions: { showPrefix: 4, showSuffix: 4 },
    description: 'Private key value assigned in source code.',
    remediation: 'Store private keys in environment variables or a hardware security module. Never commit them.',
  },
  {
    id: 'GENERIC_ACCESS_TOKEN',
    name: 'Generic Access Token',
    type: 'GENERIC_ACCESS_TOKEN',
    category: 'Generic Secrets',
    pattern: /(?:access[_\-]?token|auth[_\-]?token|refresh[_\-]?token)\s*[=:]\s*["']([A-Za-z0-9\-_+/=.]{20,})["']/gi,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 3.5,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'Generic access or refresh token hardcoded in source code.',
    remediation: 'Tokens should be obtained dynamically and stored in secure, ephemeral storage.',
  },
];

export { RULES as rules };
