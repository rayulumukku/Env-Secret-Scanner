/**
 * Generic secret detection rules.
 * Catches: password assignments, generic API keys, bearer tokens,
 * high-entropy strings in assignment contexts, .env-style variables.
 */

import { maskSecret } from '../masking.js';
import { isHighEntropySecret } from '../entropy.js';

const GENERIC_RULES = [
  {
    name: 'Password Assignment',
    type: 'GENERIC_PASSWORD',
    category: 'Generic Secrets',
    // Matches password = "value" or password: "value" in various forms
    pattern: /(?:password|passwd|pwd|pass)\s*[=:]\s*["']([^"'\s]{8,})["']/gi,
    severity: 'HIGH',
    confidence: 75,
    description: 'Hardcoded password detected in source code.',
    remediation: 'Never hardcode passwords. Use environment variables or a secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.).',
    captureGroup: 1,
    minEntropy: 2.5,
  },
  {
    name: 'Generic API Key',
    type: 'GENERIC_API_KEY',
    category: 'Generic Secrets',
    pattern: /(?:api[_-]?key|apikey|api[_-]?token|api[_-]?secret)\s*[=:]\s*["']([A-Za-z0-9\-_+/]{20,})["']/gi,
    severity: 'HIGH',
    confidence: 70,
    description: 'Generic API key or token detected in source code.',
    remediation: 'Move to environment variables. Rotate the key if it has been exposed.',
    captureGroup: 1,
    minEntropy: 3.5,
  },
  {
    name: 'Bearer Token',
    type: 'GENERIC_BEARER_TOKEN',
    category: 'Generic Secrets',
    pattern: /[Bb]earer\s+([A-Za-z0-9\-_+/=.]{20,})/g,
    severity: 'HIGH',
    confidence: 72,
    description: 'Bearer token detected in source code. May grant API access.',
    remediation: 'Bearer tokens should never be hardcoded. Regenerate and rotate.',
    captureGroup: 1,
    minEntropy: 3.5,
  },
  {
    name: 'Secret Key Assignment',
    type: 'GENERIC_SECRET_KEY',
    category: 'Generic Secrets',
    pattern: /(?:secret[_-]?key|secret[_-]?token|app[_-]?secret|client[_-]?secret)\s*[=:]\s*["']([A-Za-z0-9\-_+/]{16,})["']/gi,
    severity: 'HIGH',
    confidence: 75,
    description: 'Secret key assignment detected.',
    remediation: 'Use environment variables or a secrets manager. Never hardcode secret keys.',
    captureGroup: 1,
    minEntropy: 3.0,
  },
  {
    name: 'Authorization Header',
    type: 'GENERIC_AUTH_HEADER',
    category: 'Generic Secrets',
    pattern: /[Aa]uthorization\s*[=:]\s*["']?(?:Bearer|Basic|Token)\s+([A-Za-z0-9+/=\-_]{20,})["']?/g,
    severity: 'HIGH',
    confidence: 72,
    description: 'Authorization header value hardcoded in source code.',
    remediation: 'Generate authorization tokens dynamically. Never hardcode them.',
    captureGroup: 1,
    minEntropy: 3.0,
  },
  {
    name: '.env Secret Variable',
    type: 'DOTENV_SECRET',
    category: 'Environment Variables',
    // Match lines in .env format with high-entropy values
    pattern: /^(?:[A-Z_]+(?:SECRET|TOKEN|KEY|PASSWORD|PASSWD|PWD|AUTH|CREDENTIAL|CERT|PRIVATE))\s*=\s*(.{10,})/gm,
    severity: 'MEDIUM',
    confidence: 65,
    description: 'Sensitive-looking .env variable with a value detected.',
    remediation: 'Ensure .env files are in .gitignore. Use .env.example for templates.',
    captureGroup: 1,
    minEntropy: 3.0,
  },
  {
    name: 'High Entropy String',
    type: 'HIGH_ENTROPY_STRING',
    category: 'Generic Secrets',
    // Match strings that look like they could be secrets in variable assignment contexts
    pattern: /(?:=|:)\s*["']([A-Za-z0-9+/\-_]{32,64})["']/g,
    severity: 'MEDIUM',
    confidence: 60,
    description: 'High-entropy string detected that may be a secret.',
    remediation: 'Review this value. If it is a secret, move it to environment variables.',
    captureGroup: 1,
    minEntropy: 4.5,
    requireHighEntropy: true,
  },
];

// Common false-positive values to skip
const FALSE_POSITIVE_PATTERNS = [
  /^[a-f0-9]{32,}$/i,  // Git SHAs (all hex)
  /^[0-9]+$/,           // Pure numbers
  /^https?:\/\//,       // URLs
  /\.(js|ts|css|html|json|md|txt)$/i, // File extensions
  /^[a-z_]+$/i,         // Pure identifiers
  /^(true|false|null|undefined|none|null)$/i,
];

function isFalsePositive(value) {
  return FALSE_POSITIVE_PATTERNS.some(p => p.test(value));
}

/**
 * Detect generic secrets in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of GENERIC_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const rawValue = rule.captureGroup ? match[rule.captureGroup] : match[0];
      if (!rawValue || rawValue.length < 8) continue;
      if (isFalsePositive(rawValue)) continue;

      // Entropy check
      const { isHighEntropy, entropy } = isHighEntropySecret(rawValue, {
        threshold: rule.minEntropy || 3.5,
        minLength: 8,
      });

      if (rule.requireHighEntropy && !isHighEntropy) continue;
      if (rule.minEntropy && entropy < rule.minEntropy && rawValue.length < 32) continue;

      const upToMatch = content.slice(0, match.index);
      const line = upToMatch.split('\n').length;
      const lastNewline = upToMatch.lastIndexOf('\n');
      const column = match.index - lastNewline;

      const maskedValue = maskSecret(rawValue, { showPrefix: 4, showSuffix: 4 });

      // Adjust confidence based on entropy
      const confidence = Math.min(
        rule.confidence + Math.floor((entropy - (rule.minEntropy || 3.5)) * 5),
        95
      );

      findings.push({
        type: rule.type,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        confidence: Math.max(confidence, 50),
        line,
        column,
        file: filename,
        maskedValue,
        description: rule.description,
        remediation: rule.remediation,
        lineContent: lines[line - 1] || '',
        entropy: Math.round(entropy * 100) / 100,
      });
    }
  }

  return findings;
}
