/**
 * rules/github.js — GitHub credential detection rules.
 * Detects: Personal Access Tokens, OAuth tokens, App tokens, fine-grained PATs.
 */

export const RULES = [
  {
    id: 'GITHUB_PAT_CLASSIC',
    name: 'GitHub Personal Access Token (Classic)',
    type: 'GITHUB_PAT_CLASSIC',
    category: 'Source Control',
    // ghp_ prefix, 36 chars
    pattern: /\bghp_[A-Za-z0-9]{36}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'GitHub classic Personal Access Token. Grants repository and API access.',
    remediation: 'Revoke at https://github.com/settings/tokens. Rotate affected systems.',
  },
  {
    id: 'GITHUB_PAT_FINE',
    name: 'GitHub Fine-Grained Personal Access Token',
    type: 'GITHUB_PAT_FINE',
    category: 'Source Control',
    // github_pat_ prefix
    pattern: /\bgithub_pat_[A-Za-z0-9_]{82}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 12, showSuffix: 4 },
    description: 'GitHub fine-grained Personal Access Token with scoped repository access.',
    remediation: 'Revoke at https://github.com/settings/tokens and rotate all dependent systems.',
  },
  {
    id: 'GITHUB_OAUTH_TOKEN',
    name: 'GitHub OAuth Access Token',
    type: 'GITHUB_OAUTH_TOKEN',
    category: 'Source Control',
    // gho_ prefix, 36 chars
    pattern: /\bgho_[A-Za-z0-9]{36}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'GitHub OAuth access token. May grant access to user or organization resources.',
    remediation: 'Revoke in GitHub OAuth app settings and rotate the token in your application.',
  },
  {
    id: 'GITHUB_APP_TOKEN',
    name: 'GitHub App Installation Token',
    type: 'GITHUB_APP_TOKEN',
    category: 'Source Control',
    // ghs_ prefix, 36 chars
    pattern: /\bghs_[A-Za-z0-9]{36}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'GitHub App installation access token.',
    remediation: 'App installation tokens expire but regenerate them and audit for misuse.',
  },
  {
    id: 'GITHUB_REFRESH_TOKEN',
    name: 'GitHub OAuth Refresh Token',
    type: 'GITHUB_REFRESH_TOKEN',
    category: 'Source Control',
    // ghr_ prefix
    pattern: /\bghr_[A-Za-z0-9]{76}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'GitHub OAuth refresh token. Can be used to obtain new access tokens.',
    remediation: 'Revoke the associated OAuth application token and rotate secrets.',
  },
];

export { RULES as rules };
