/**
 * rules/private-key.js — Private key / PEM block detection.
 * Detects RSA, EC, OpenSSH, generic PEM private key blocks.
 */

export const RULES = [
  {
    id: 'PRIVATE_KEY_RSA',
    name: 'RSA Private Key',
    type: 'PRIVATE_KEY_RSA',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 27, showSuffix: 25 },
    description: 'RSA private key block detected. Full private keys expose TLS certificates, SSH access, and signing capabilities.',
    remediation: 'Revoke and regenerate the key immediately. Rotate any certificates signed by this key.',
  },
  {
    id: 'PRIVATE_KEY_EC',
    name: 'EC Private Key',
    type: 'PRIVATE_KEY_EC',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN EC PRIVATE KEY-----[\s\S]*?-----END EC PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 25, showSuffix: 23 },
    description: 'EC (Elliptic Curve) private key detected.',
    remediation: 'Revoke and regenerate immediately.',
  },
  {
    id: 'PRIVATE_KEY_OPENSSH',
    name: 'OpenSSH Private Key',
    type: 'PRIVATE_KEY_OPENSSH',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]*?-----END OPENSSH PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 30, showSuffix: 28 },
    description: 'OpenSSH private key detected. Provides SSH access to servers.',
    remediation: 'Remove from all authorized_keys immediately. Regenerate the key pair.',
  },
  {
    id: 'PRIVATE_KEY_GENERIC',
    name: 'Generic PEM Private Key',
    type: 'PRIVATE_KEY_GENERIC',
    category: 'Cryptographic Keys',
    // PKCS#8, unencrypted
    pattern: /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 24, showSuffix: 22 },
    description: 'Generic unencrypted private key (PKCS#8 format) detected.',
    remediation: 'Rotate immediately. Store private keys encrypted and outside version control.',
  },
  {
    id: 'PRIVATE_KEY_ENCRYPTED',
    name: 'Encrypted PEM Private Key',
    type: 'PRIVATE_KEY_ENCRYPTED',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN ENCRYPTED PRIVATE KEY-----[\s\S]*?-----END ENCRYPTED PRIVATE KEY-----/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 34, showSuffix: 32 },
    description: 'Encrypted private key detected. Lower risk than unencrypted, but still should not be in source.',
    remediation: 'Store encrypted private keys outside version control. Use a secrets manager.',
  },
  {
    id: 'PGP_PRIVATE_KEY',
    name: 'PGP Private Key Block',
    type: 'PGP_PRIVATE_KEY',
    category: 'Cryptographic Keys',
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]*?-----END PGP PRIVATE KEY BLOCK-----/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 32, showSuffix: 30 },
    description: 'PGP private key block detected.',
    remediation: 'Revoke at any keyserver and regenerate. Never commit PGP private keys.',
  },
];

export { RULES as rules };
