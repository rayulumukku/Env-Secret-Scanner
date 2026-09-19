/**
 * @secretshield/config
 *
 * Unified configuration loader, defaults, and validator for SecretShield.
 * Shared consistently across Web App, CLI, GitHub Action, and VS Code.
 *
 * SECURITY:
 * Validates all inputs to prevent shell injection and malicious payloads in configuration files.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export const DEFAULT_CONFIG = {
  version: '2.0.0',
  severityThreshold: 'low',
  minConfidence: 70,
  ignore: [
    'node_modules/**',
    '.git/**',
    '.next/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.min.js',
    '*.lock',
  ],
  rules: {
    AWS_ACCESS_KEY_ID: true,
    AWS_SECRET_ACCESS_KEY: true,
    GITHUB_PAT: true,
    OPENAI_API_KEY: true,
    STRIPE_SECRET_KEY: true,
    SLACK_TOKEN: true,
    GOOGLE_API_KEY: true,
    PRIVATE_KEY: true,
    DATABASE_URL: true,
    JWT_SECRET: true,
    GENERIC_API_KEY: true,
  },
  scan: {
    history: false,
    maxFileSize: 2 * 1024 * 1024, // 2 MB
    maxFiles: 5000,
  },
};

export const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
export const DEFAULT_CONFIG_FILE = '.secretshield.json';

const SEVERITY_LEVELS = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/**
 * Check if a finding's severity meets or exceeds the configured threshold.
 *
 * @param {string} findingSeverity - 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
 * @param {string} threshold - 'critical' | 'high' | 'medium' | 'low'
 * @returns {boolean}
 */
export function meetsThreshold(findingSeverity, threshold) {
  const findingLevel = SEVERITY_LEVELS[(findingSeverity || '').toLowerCase()] ?? 0;
  const targetLevel = SEVERITY_LEVELS[(threshold || 'low').toLowerCase()] ?? 0;
  return findingLevel >= targetLevel;
}

/**
 * Validate a raw configuration object.
 *
 * @param {object} raw
 * @returns {{ valid: boolean, errors: string[], config: object }}
 */
export function validateConfig(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['Configuration must be a JSON object'], config: { ...DEFAULT_CONFIG } };
  }

  const config = { ...DEFAULT_CONFIG, scan: { ...DEFAULT_CONFIG.scan }, rules: { ...DEFAULT_CONFIG.rules } };

  // 1. Severity threshold
  if (raw.severityThreshold !== undefined) {
    const sev = String(raw.severityThreshold).toLowerCase();
    if (VALID_SEVERITIES.has(sev)) {
      config.severityThreshold = sev;
    } else {
      errors.push(`Invalid severityThreshold "${raw.severityThreshold}". Valid options: low, medium, high, critical.`);
    }
  }

  // 2. Minimum confidence
  if (raw.minConfidence !== undefined) {
    const num = Number(raw.minConfidence);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      config.minConfidence = num;
    } else {
      errors.push('minConfidence must be a number between 0 and 100.');
    }
  }

  // 3. Ignore patterns
  if (raw.ignore !== undefined) {
    if (Array.isArray(raw.ignore)) {
      const sanitized = [];
      for (const p of raw.ignore) {
        if (typeof p === 'string' && p.trim() && !/[;&|`$<>]/.test(p)) {
          sanitized.push(p.trim());
        } else {
          errors.push(`Invalid ignore pattern: "${p}". Patterns must not contain special shell characters.`);
        }
      }
      config.ignore = sanitized;
    } else {
      errors.push('"ignore" must be an array of string glob patterns.');
    }
  }

  // 4. Rule toggles
  if (raw.rules && typeof raw.rules === 'object' && !Array.isArray(raw.rules)) {
    for (const [ruleId, enabled] of Object.entries(raw.rules)) {
      if (typeof enabled === 'boolean') {
        config.rules[ruleId] = enabled;
      }
    }
  }

  // 5. Scan options
  if (raw.scan && typeof raw.scan === 'object' && !Array.isArray(raw.scan)) {
    if (typeof raw.scan.history === 'boolean') {
      config.scan.history = raw.scan.history;
    }
    if (typeof raw.scan.maxFileSize === 'number' && raw.scan.maxFileSize > 0) {
      config.scan.maxFileSize = Math.min(raw.scan.maxFileSize, 50 * 1024 * 1024); // Cap at 50MB
    }
    if (typeof raw.scan.maxFiles === 'number' && raw.scan.maxFiles > 0) {
      config.scan.maxFiles = Math.min(raw.scan.maxFiles, 20000);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    config,
  };
}

/**
 * Load configuration from disk.
 *
 * @param {string} [configPath] - explicit path to config file
 * @param {string} [cwd=process.cwd()] - working directory to search in
 * @returns {{ config: object, source: string, warnings: string[] }}
 */
export function loadConfig(configPath, cwd = process.cwd()) {
  const warnings = [];
  const filePath = configPath
    ? resolve(configPath)
    : resolve(cwd, DEFAULT_CONFIG_FILE);

  if (!existsSync(filePath)) {
    return { config: { ...DEFAULT_CONFIG, scan: { ...DEFAULT_CONFIG.scan } }, source: 'defaults', warnings };
  }

  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    warnings.push(`Cannot read config file ${filePath}: ${err.message}`);
    return { config: { ...DEFAULT_CONFIG, scan: { ...DEFAULT_CONFIG.scan } }, source: 'defaults', warnings };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    warnings.push(`Config file is malformed JSON: ${err.message}`);
    return { config: { ...DEFAULT_CONFIG, scan: { ...DEFAULT_CONFIG.scan } }, source: 'defaults', warnings };
  }

  const { valid, errors, config } = validateConfig(parsed);
  if (!valid) {
    warnings.push(...errors);
  }

  return { config, source: filePath, warnings };
}

/**
 * Generate a sample .secretshield.json configuration file content.
 *
 * @param {object} [overrides]
 * @returns {string} formatted JSON
 */
export function generateSampleConfig(overrides = {}) {
  const sample = {
    $schema: 'https://secretshield.dev/schemas/config.json',
    version: '2.0.0',
    severityThreshold: overrides.severityThreshold || 'low',
    minConfidence: 70,
    ignore: [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      '*.lock',
    ],
    rules: {
      AWS_ACCESS_KEY_ID: true,
      AWS_SECRET_ACCESS_KEY: true,
      GITHUB_PAT: true,
      OPENAI_API_KEY: true,
      STRIPE_SECRET_KEY: true,
      SLACK_TOKEN: true,
      GOOGLE_API_KEY: true,
      PRIVATE_KEY: true,
      DATABASE_URL: true,
      JWT_SECRET: true,
      GENERIC_API_KEY: true,
    },
    scan: {
      history: false,
      maxFileSize: 2097152,
    },
  };

  return JSON.stringify(sample, null, 2);
}
