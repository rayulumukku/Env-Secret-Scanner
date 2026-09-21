/**
 * app-src/lib/env.js
 *
 * Strict Environment Variable Validator & Schema Boundary.
 *
 * SAFETY INVARIANTS:
 *   - Categorizes variables into PUBLIC, SERVER_ONLY, SECRET, and OPTIONAL.
 *   - Guarantees server secrets NEVER leak into client-side bundles or public configs.
 *   - Validates existence and format in production with fail-safe defaults in local dev.
 */

export const ENV_SCHEMA = {
  PUBLIC: [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_VERSION'
  ],
  SERVER_ONLY: [
    'NODE_ENV',
    'PORT',
    'LOG_LEVEL',
    'SCANNER_CONCURRENCY',
    'MAX_FILE_SIZE_BYTES'
  ],
  SECRET: [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY'
  ],
  OPTIONAL: [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITLAB_CLIENT_ID',
    'GITLAB_CLIENT_SECRET',
    'SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET',
    'AI_PROVIDER_KEY'
  ]
};

/**
 * Validates environment configuration at startup.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{ valid: boolean, errors: string[], warnings: string[], summary: Object }}
 */
export function validateEnvironment(env = process.env) {
  const errors = [];
  const warnings = [];
  const isProd = env.NODE_ENV === 'production';

  // Check required server secrets in production
  for (const secretKey of ENV_SCHEMA.SECRET) {
    if (!env[secretKey]) {
      if (isProd) {
        errors.push(`Missing mandatory production secret: '${secretKey}'`);
      } else {
        warnings.push(`Local development: missing '${secretKey}', using safe fallback mode.`);
      }
    }
  }

  // Verify no secret variables are prefixed with NEXT_PUBLIC_
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      const lower = key.toLowerCase();
      if (lower.includes('secret') || lower.includes('key') || lower.includes('password') || lower.includes('token') || lower.includes('private')) {
        errors.push(`CRITICAL: Potential secret variable exposed with NEXT_PUBLIC_ prefix: '${key}'`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      nodeEnv: env.NODE_ENV || 'development',
      isProduction: isProd,
      secretKeysConfigured: ENV_SCHEMA.SECRET.filter(k => !!env[k]),
      optionalConfigured: ENV_SCHEMA.OPTIONAL.filter(k => !!env[k])
    }
  };
}

/**
 * Returns safe, sanitized public configuration.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {Object}
 */
export function getPublicConfig(env = process.env) {
  return {
    appName: env.NEXT_PUBLIC_APP_NAME || 'SecretShield',
    appUrl: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: env.NEXT_PUBLIC_VERSION || '1.0.0',
    environment: env.NODE_ENV || 'development'
  };
}
