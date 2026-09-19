/**
 * rules/google.js — Google API credential detection.
 * Detects: API keys, OAuth client secrets, service account keys.
 */

export const RULES = [
  {
    id: 'GOOGLE_API_KEY',
    name: 'Google API Key',
    type: 'GOOGLE_API_KEY',
    category: 'Cloud Credentials',
    // AIza prefix, 39 chars total
    pattern: /\bAIza[A-Za-z0-9\-_]{35}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'Google API key detected. May grant access to Google Cloud APIs.',
    remediation: 'Restrict the key to specific APIs and IPs in Google Cloud Console. Rotate if exposed.',
  },
  {
    id: 'GOOGLE_OAUTH_CLIENT_SECRET',
    name: 'Google OAuth Client Secret',
    type: 'GOOGLE_OAUTH_CLIENT_SECRET',
    category: 'Cloud Credentials',
    // GOCSPX- prefix
    pattern: /\bGOCSPX-[A-Za-z0-9\-_]{28}\b/g,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'Google OAuth client secret. Can be used to impersonate your OAuth application.',
    remediation: 'Regenerate the client secret in Google Cloud Console OAuth credentials.',
  },
  {
    id: 'GOOGLE_SERVICE_ACCOUNT_KEY',
    name: 'Google Service Account Key',
    type: 'GOOGLE_SERVICE_ACCOUNT_KEY',
    category: 'Cloud Credentials',
    // Service account JSON contains "private_key_id"
    pattern: /"private_key_id"\s*:\s*"([A-Za-z0-9]{40})"/g,
    captureGroup: 1,
    severity: 'CRITICAL',
    isProviderRule: true,
    maskOptions: { showPrefix: 8, showSuffix: 4 },
    description: 'Google service account key ID detected in JSON. Full key may be present.',
    remediation: 'Revoke the service account key in Google Cloud IAM and generate a new one.',
  },
  {
    id: 'GOOGLE_REFRESH_TOKEN',
    name: 'Google OAuth Refresh Token',
    type: 'GOOGLE_REFRESH_TOKEN',
    category: 'Cloud Credentials',
    // 1// prefix, long alphanumeric+dash
    pattern: /\b1\/\/[A-Za-z0-9\-_]{40,}\b/g,
    severity: 'HIGH',
    isProviderRule: true,
    maskOptions: { showPrefix: 6, showSuffix: 4 },
    description: 'Google OAuth refresh token. Can generate new access tokens indefinitely.',
    remediation: 'Revoke at https://myaccount.google.com/permissions and regenerate tokens.',
  },
];

export { RULES as rules };
