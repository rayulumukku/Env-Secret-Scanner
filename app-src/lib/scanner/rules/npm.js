/**
 * rules/npm.js — npm access token detection.
 */

export const RULES = [
  {
    id: 'NPM_ACCESS_TOKEN',
    name: 'npm Access Token',
    type: 'NPM_ACCESS_TOKEN',
    category: 'Package Registry',
    // npm_  prefix + 36 chars (UUID-like)
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'npm access token detected. Grants publish/read access to npm packages.',
    remediation: 'Revoke at https://www.npmjs.com/settings/~/tokens and rotate dependent CI/CD pipelines.',
  },
  {
    id: 'NPM_LEGACY_TOKEN',
    name: 'npm Legacy Token (in .npmrc)',
    type: 'NPM_LEGACY_TOKEN',
    category: 'Package Registry',
    // //registry.npmjs.org/:_authToken=<token>
    pattern: /\/\/registry\.npmjs\.org\/:_authToken\s*=\s*([A-Za-z0-9\-]{8,})/g,
    captureGroup: 1,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'npm auth token in .npmrc file. Grants registry access.',
    remediation: 'Ensure .npmrc is in .gitignore. Rotate the token at npmjs.com.',
  },
];

export { RULES as rules };
