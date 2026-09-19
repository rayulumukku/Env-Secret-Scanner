/**
 * lib/providers/github/app.js
 *
 * GitHub App Authentication & API client.
 *
 * Environment variables:
 *   GITHUB_APP_ID         — GitHub App numeric ID
 *   GITHUB_PRIVATE_KEY    — GitHub App PEM private key
 *   GITHUB_WEBHOOK_SECRET — Webhook HMAC-SHA256 secret
 *   GITHUB_CLIENT_ID      — GitHub App Client ID (for OAuth)
 *   GITHUB_CLIENT_SECRET  — GitHub App Client Secret
 *
 * SECURITY:
 *   - Private key is never sent to browser or logged.
 *   - JWTs and installation access tokens are generated and cached server-side only.
 *   - Uses Node.js native crypto for RS256 signing (no third-party JWT dependency required).
 */

import crypto from 'crypto';

const GITHUB_API = 'https://api.github.com';

// In-memory token cache: installationId -> { token, expiresAt }
const tokenCache = new Map();

/**
 * Check whether GitHub App credentials are fully configured.
 */
export function isGitHubAppConfigured() {
  return !!(
    process.env.GITHUB_APP_ID &&
    process.env.GITHUB_PRIVATE_KEY
  );
}

/**
 * Base64URL encoding helper.
 */
function base64UrlEncode(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate a signed RS256 JWT for GitHub App authentication.
 *
 * @param {string|number} appId
 * @param {string} privateKeyPem
 * @returns {string} Signed JWT
 */
export function generateGitHubAppJwt(appId = process.env.GITHUB_APP_ID, privateKeyPem = process.env.GITHUB_PRIVATE_KEY) {
  if (!appId || !privateKeyPem) {
    throw new Error('GitHub App ID and Private Key are required to generate JWT.');
  }

  // Format private key correctly if passed with escaped newlines
  const formattedKey = privateKeyPem.includes('\\n')
    ? privateKeyPem.replace(/\\n/g, '\n')
    : privateKeyPem;

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iat: now - 60,       // 60 seconds in the past for clock drift
    exp: now + (9 * 60), // 9 minutes expiry (GitHub allows max 10m)
    iss: String(appId),
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(formattedKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signature}`;
}

/**
 * Get an installation access token for a given installation ID.
 * Tokens are cached in-memory until 5 minutes before expiration.
 *
 * @param {string|number} installationId
 * @returns {Promise<string>} Installation token
 */
export async function getInstallationAccessToken(installationId) {
  const cached = tokenCache.get(String(installationId));
  if (cached && cached.expiresAt > Date.now() + (5 * 60 * 1000)) {
    return cached.token;
  }

  if (!isGitHubAppConfigured()) {
    throw new Error('GitHub App is not configured. Set GITHUB_APP_ID and GITHUB_PRIVATE_KEY.');
  }

  const jwt = generateGitHubAppJwt();
  const res = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (res.status === 401) {
    throw new Error('GitHub App JWT was rejected. Verify GITHUB_APP_ID and GITHUB_PRIVATE_KEY.');
  }
  if (res.status === 404) {
    throw new Error(`GitHub App installation ${installationId} not found or app was uninstalled.`);
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to get GitHub installation token: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const token = data.token;
  const expiresAt = new Date(data.expires_at).getTime();

  tokenCache.set(String(installationId), { token, expiresAt });
  return token;
}

/**
 * Make an authenticated GitHub REST API call.
 * Handles rate limits, timeouts, and error sanitization.
 *
 * @param {string} endpoint - API path or full URL
 * @param {string} token - Installation token or OAuth token
 * @param {object} options - Fetch options
 */
export async function githubAppRequest(endpoint, token, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'SecretShield-GitHubApp/2.0',
      ...(options.headers || {}),
    },
    signal: options.signal || AbortSignal.timeout(15000), // 15s timeout
  });

  // Handle rate limits
  if (res.status === 403) {
    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0') {
      const resetTime = res.headers.get('x-ratelimit-reset');
      const waitSeconds = resetTime ? Math.max(0, parseInt(resetTime, 10) - Math.floor(Date.now() / 1000)) : 60;
      throw new Error(`GitHub API rate limit exceeded. Resets in ${waitSeconds}s.`);
    }
    throw new Error('GitHub API permission denied or insufficient App scopes.');
  }

  if (res.status === 401) {
    throw new Error('GitHub token expired or revoked.');
  }

  if (res.status === 404) {
    throw new Error(`GitHub resource not found: ${endpoint}`);
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`GitHub API error ${res.status}: ${errorBody.slice(0, 300)}`);
  }

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
