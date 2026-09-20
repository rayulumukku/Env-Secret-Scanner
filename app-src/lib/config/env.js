/**
 * lib/config/env.js
 *
 * Safe Environment Configuration Accessor.
 *
 * GUARANTEES:
 *   - Type-safe, validated environment configuration.
 *   - Never exposes secret values in toString, JSON.stringify, or object iteration.
 */

import { validateEnvironment } from './validation.js';

let _cachedConfig = null;

export function getConfig() {
  if (!_cachedConfig) {
    const validation = validateEnvironment(process.env);
    if (!validation.valid && process.env.NODE_ENV === 'production') {
      console.error('[Config] CRITICAL: Production environment validation failed:');
      for (const err of validation.errors) {
        console.error(`  - ${err}`);
      }
    }

    _cachedConfig = {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development',
      isTest: process.env.NODE_ENV === 'test',
      database: {
        hasUrl: Boolean(process.env.DATABASE_URL),
        engine: process.env.DATABASE_URL ? 'postgresql' : 'in-memory',
      },
      auth: {
        configured: Boolean(process.env.AUTH_SECRET),
      },
      encryption: {
        configured: Boolean(process.env.ENCRYPTION_KEY),
      },
      integrations: {
        github: Boolean(process.env.GITHUB_CLIENT_ID || process.env.GITHUB_APP_ID),
        gitlab: Boolean(process.env.GITLAB_CLIENT_ID),
        slack: Boolean(process.env.SLACK_CLIENT_ID || process.env.SLACK_SIGNING_SECRET),
      },
      validation,
    };
  }

  return _cachedConfig;
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment() {
  return process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
}

export function isTest() {
  return process.env.NODE_ENV === 'test';
}
