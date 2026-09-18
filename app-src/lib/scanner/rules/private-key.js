/**
 * Private key detection rules.
 * Detects: RSA, EC, DSA, OpenSSH, PGP private keys.
 */

import { maskSecret } from '../masking.js';

const PRIVATE_KEY_RULES = [
  {
    name: 'RSA Private Key',
    type: 'PRIVATE_KEY_RSA',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'RSA private key detected. Can decrypt data and forge signatures.',
    remediation: 'Revoke all certificates signed by this key. Generate a new key pair and update all services.',
  },
  {
    name: 'EC Private Key',
    type: 'PRIVATE_KEY_EC',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN EC PRIVATE KEY-----[\s\S]*?-----END EC PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'EC (Elliptic Curve) private key detected.',
    remediation: 'Revoke and replace immediately. Audit for any data encrypted with this key.',
  },
  {
    name: 'OpenSSH Private Key',
    type: 'PRIVATE_KEY_OPENSSH',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]*?-----END OPENSSH PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'OpenSSH private key detected. Can be used to SSH into servers.',
    remediation: 'Remove the key\'s public portion from all authorized_keys files. Generate a new SSH key pair.',
  },
  {
    name: 'DSA Private Key',
    type: 'PRIVATE_KEY_DSA',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN DSA PRIVATE KEY-----[\s\S]*?-----END DSA PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'DSA private key detected.',
    remediation: 'Revoke and replace. DSA is also deprecated — consider switching to ED25519.',
  },
  {
    name: 'PGP Private Key Block',
    type: 'PRIVATE_KEY_PGP',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]*?-----END PGP PRIVATE KEY BLOCK-----/g,
    severity: 'CRITICAL',
    confidence: 99,
    description: 'PGP private key detected. Can decrypt PGP-encrypted messages and forge signatures.',
    remediation: 'Revoke the key on public keyservers. Generate a new PGP key pair.',
  },
  {
    name: 'Generic Private Key',
    type: 'PRIVATE_KEY_GENERIC',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    confidence: 97,
    description: 'Private key (PKCS#8 format) detected.',
    remediation: 'Identify what this key is used for and revoke/replace it immediately.',
  },
  {
    name: 'Certificate Private Key',
    type: 'PRIVATE_KEY_CERTIFICATE',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN ENCRYPTED PRIVATE KEY-----[\s\S]*?-----END ENCRYPTED PRIVATE KEY-----/g,
    severity: 'HIGH',
    confidence: 95,
    description: 'Encrypted private key detected. While encrypted, the passphrase may be nearby.',
    remediation: 'Remove from source control. Ensure no passphrase is stored alongside this key.',
  },
];

/**
 * Detect private keys in file content.
 *
 * @param {string} content
 * @param {string} filename
 * @returns {object[]}
 */
export function detect(content, filename) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of PRIVATE_KEY_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      const rawValue = match[0];

      const upToMatch = content.slice(0, match.index);
      const line = upToMatch.split('\n').length;
      const lastNewline = upToMatch.lastIndexOf('\n');
      const column = match.index - lastNewline;

      // For private keys, just show the header line
      const maskedValue = rawValue.split('\n')[0] + '\n[key body redacted]\n' + rawValue.split('\n').slice(-1)[0];

      findings.push({
        type: rule.type,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        line,
        column,
        file: filename,
        maskedValue: maskedValue.slice(0, 60) + '...',
        description: rule.description,
        remediation: rule.remediation,
        lineContent: lines[line - 1] || '',
      });
    }
  }

  return findings;
}
