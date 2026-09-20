/**
 * lib/config/validation.js
 *
 * Production Environment Configuration Schema and Validator.
 *
 * SAFETY INVARIANTS:
 *   - NEVER prints or logs secret variable values.
 *   - Validates format/types and flags missing required keys with clear guidance.
 *   - Supports local development fallbacks without requiring paid third-party infrastructure.
 */

export const ENV_SCHEMA = {
  // Application
  NEXT_PUBLIC_APP_URL: {
    category: 'Application',
    required: false,
    productionRequired: true,
    default: 'http://localhost:3000',
    description: 'Public URL of the SecretShield web application',
  },
  NODE_ENV: {
    category: 'Application',
    required: false,
    default: 'development',
    allowedValues: ['development', 'production', 'test'],
    description: 'Node runtime environment',
  },
  PORT: {
    category: 'Application',
    required: false,
    default: '3000',
    description: 'HTTP server listening port',
  },

  // Database
  DATABASE_URL: {
    category: 'Database',
    required: false,
    productionRequired: false, // Fallback to memory store supported
    sensitive: true,
    description: 'PostgreSQL connection URL. Falls back to in-memory store if unset.',
  },

  // Authentication
  AUTH_SECRET: {
    category: 'Authentication',
    required: false,
    productionRequired: true,
    sensitive: true,
    description: 'Secret key for signing authentication sessions and JWT tokens.',
  },

  // Encryption
  ENCRYPTION_KEY: {
    category: 'Encryption',
    required: false,
    productionRequired: true,
    sensitive: true,
    description: '32-byte key for AES-256-GCM encryption of integration tokens at rest.',
  },

  // GitHub Integration
  GITHUB_APP_ID: {
    category: 'GitHub',
    required: false,
    sensitive: false,
    description: 'GitHub App ID for webhook and check run integration.',
  },
  GITHUB_PRIVATE_KEY: {
    category: 'GitHub',
    required: false,
    sensitive: true,
    description: 'GitHub App RSA private key for JWT authentication.',
  },
  GITHUB_CLIENT_ID: {
    category: 'GitHub',
    required: false,
    sensitive: false,
    description: 'GitHub OAuth Client ID.',
  },
  GITHUB_CLIENT_SECRET: {
    category: 'GitHub',
    required: false,
    sensitive: true,
    description: 'GitHub OAuth Client Secret.',
  },
  GITHUB_WEBHOOK_SECRET: {
    category: 'GitHub',
    required: false,
    sensitive: true,
    description: 'Secret for verifying GitHub HMAC webhook signatures.',
  },

  // GitLab Integration
  GITLAB_CLIENT_ID: {
    category: 'GitLab',
    required: false,
    sensitive: false,
    description: 'GitLab OAuth Client ID.',
  },
  GITLAB_CLIENT_SECRET: {
    category: 'GitLab',
    required: false,
    sensitive: true,
    description: 'GitLab OAuth Client Secret.',
  },
  GITLAB_WEBHOOK_SECRET: {
    category: 'GitLab',
    required: false,
    sensitive: true,
    description: 'Secret for verifying GitLab webhook tokens.',
  },

  // Slack Integration
  SLACK_CLIENT_ID: {
    category: 'Slack',
    required: false,
    sensitive: false,
    description: 'Slack OAuth Client ID.',
  },
  SLACK_CLIENT_SECRET: {
    category: 'Slack',
    required: false,
    sensitive: true,
    description: 'Slack OAuth Client Secret.',
  },
  SLACK_SIGNING_SECRET: {
    category: 'Slack',
    required: false,
    sensitive: true,
    description: 'Secret for verifying Slack request signatures.',
  },
};

/**
 * Validate environment configuration against schema.
 *
 * @param {object} [env=process.env]
 * @returns {{ valid: boolean, errors: string[], warnings: string[], summary: object }}
 */
export function validateEnvironment(env = process.env) {
  const isProd = env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];
  const summary = {};

  for (const [key, spec] of Object.entries(ENV_SCHEMA)) {
    const rawValue = env[key];
    const isSet = rawValue !== undefined && rawValue !== null && rawValue.trim() !== '';

    summary[key] = {
      category: spec.category,
      isSet,
      sensitive: Boolean(spec.sensitive),
      required: isProd ? (spec.productionRequired || spec.required) : spec.required,
    };

    if (isProd && spec.productionRequired && !isSet) {
      errors.push(`Missing required production environment variable: [${key}] (${spec.description})`);
    } else if (spec.required && !isSet) {
      errors.push(`Missing required environment variable: [${key}] (${spec.description})`);
    } else if (!isSet && spec.productionRequired && !isProd) {
      warnings.push(`Optional in development, but required in production: [${key}]`);
    }

    if (isSet && spec.allowedValues && !spec.allowedValues.includes(rawValue)) {
      errors.push(`Invalid value for [${key}]. Allowed options: ${spec.allowedValues.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}
