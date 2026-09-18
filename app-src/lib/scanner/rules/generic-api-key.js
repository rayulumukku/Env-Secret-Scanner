/**
 * rules/generic-api-key.js — Generic API key variable assignment detection.
 * Catches: API_KEY=value, apiKey: "value", api-token = "value", etc.
 */

export const RULES = [
  {
    id: 'GENERIC_API_KEY',
    name: 'Generic API Key',
    type: 'GENERIC_API_KEY',
    category: 'Generic Secrets',
    pattern: /(?:api[_\-]?key|apikey|api[_\-]?token|x[\-_]api[\-_]key)\s*[=:]\s*["']([A-Za-z0-9\-_+/]{16,})["']/gi,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 3.5,
    minLength: 16,
    maskOptions: { showPrefix: 4, showSuffix: 4 },
    description: 'Generic API key assigned in source code.',
    remediation: 'Move to environment variables. Rotate the key if it has been exposed in version control.',
  },
  {
    id: 'GENERIC_SECRET_KEY',
    name: 'Generic Secret Key',
    type: 'GENERIC_SECRET_KEY',
    category: 'Generic Secrets',
    pattern: /(?:secret[_\-]?key|app[_\-]?secret|client[_\-]?secret|signing[_\-]?secret)\s*[=:]\s*["']([A-Za-z0-9\-_+/]{16,})["']/gi,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: false,
    entropyThreshold: 3.0,
    maskOptions: { showPrefix: 4, showSuffix: 4 },
    description: 'Generic secret key assignment detected in source code.',
    remediation: 'Use environment variables or a secrets manager. Rotate any exposed keys.',
  },
  {
    id: 'DOTENV_SECRET_VAR',
    name: '.env Secret Variable',
    type: 'DOTENV_SECRET_VAR',
    category: 'Environment Variables',
    // Matches: SOME_SECRET_KEY=value or SOME_TOKEN=value in .env style
    pattern: /^(?:[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|PASSWD|AUTH|CREDENTIAL|PRIVATE)(?:[_A-Z0-9]*)?)\s*=\s*(.{8,})/gm,
    captureGroup: 1,
    severity: 'MEDIUM',
    isProviderRule: false,
    entropyThreshold: 3.0,
    maskOptions: { showPrefix: 4, showSuffix: 4 },
    description: 'Sensitive-looking .env variable with a non-empty value.',
    remediation: 'Ensure .env files are in .gitignore. Use .env.example with placeholder values.',
  },
  {
    id: 'HIGH_ENTROPY_ASSIGNMENT',
    name: 'High Entropy Secret Assignment',
    type: 'HIGH_ENTROPY_ASSIGNMENT',
    category: 'Generic Secrets',
    // const x = "...high-entropy-string..."
    pattern: /(?:=|:)\s*["']([A-Za-z0-9+/\-_]{32,64})["']/g,
    captureGroup: 1,
    severity: 'MEDIUM',
    isProviderRule: false,
    entropyThreshold: 4.5,
    requireHighEntropy: true,
    minLength: 32,
    maskOptions: { showPrefix: 4, showSuffix: 4 },
    description: 'High-entropy string in assignment context — may be a secret.',
    remediation: 'Review this value. If it is a secret, move to environment variables.',
  },
];

export { RULES as rules };
