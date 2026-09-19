/**
 * lib/config.js
 *
 * Load and validate .secretshield.json configuration.
 *
 * Security:
 *   - Never trusts values without validation
 *   - ignorePatterns are validated as non-shell-injectable strings
 *   - If config is malformed, falls back to safe defaults
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── DEFAULTS ──────────────────────────────────────────────────────────────────

export const DEFAULT_CONFIG = {
  severityThreshold: 'low',
  ignore: [],
  rules: {},
  scan: {
    history:     false,
    maxFileSize: 2 * 1024 * 1024, // 2 MB
  },
};

const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
const DEFAULT_CONFIG_FILE = '.secretshield.json';

// ── LOADER ────────────────────────────────────────────────────────────────────

/**
 * Load configuration from disk.
 * Falls back to defaults if the file doesn't exist or is invalid.
 *
 * @param {string} [configPath] - explicit path to config file
 * @param {string} [cwd]        - working directory to search in
 * @returns {{ config: object, source: string, warnings: string[] }}
 */
export function loadConfig(configPath, cwd = process.cwd()) {
  const warnings = [];

  // Determine path to config file
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
    warnings.push(`Config file ${filePath} is not valid JSON: ${err.message}`);
    return { config: { ...DEFAULT_CONFIG, scan: { ...DEFAULT_CONFIG.scan } }, source: 'defaults', warnings };
  }

  // Validate and merge
  const config = validateConfig(parsed, warnings);
  return { config, source: filePath, warnings };
}

/**
 * Validate a raw config object against the schema.
 * Returns a safe, merged config with defaults for missing/invalid fields.
 */
function validateConfig(raw, warnings = []) {
  const config = {
    severityThreshold: DEFAULT_CONFIG.severityThreshold,
    ignore:            [],
    rules:             {},
    scan:              { ...DEFAULT_CONFIG.scan },
  };

  // severityThreshold
  if (raw.severityThreshold !== undefined) {
    const t = String(raw.severityThreshold).toLowerCase();
    if (VALID_SEVERITIES.has(t)) {
      config.severityThreshold = t;
    } else {
      warnings.push(`Invalid severityThreshold "${raw.severityThreshold}". Using "low".`);
    }
  }

  // ignore patterns
  if (Array.isArray(raw.ignore)) {
    for (const pattern of raw.ignore) {
      if (typeof pattern === 'string' && pattern.length > 0 && pattern.length < 256) {
        // Validate: no shell-dangerous chars beyond glob syntax
        if (!/[|;&`$<>!{}]/.test(pattern)) {
          config.ignore.push(pattern);
        } else {
          warnings.push(`Ignoring unsafe ignore pattern: "${pattern}"`);
        }
      }
    }
  }

  // rules (object of ruleId → boolean)
  if (raw.rules && typeof raw.rules === 'object' && !Array.isArray(raw.rules)) {
    for (const [k, v] of Object.entries(raw.rules)) {
      if (/^[a-z0-9-]+$/.test(k) && typeof v === 'boolean') {
        config.rules[k] = v;
      }
    }
  }

  // scan options
  if (raw.scan && typeof raw.scan === 'object') {
    if (typeof raw.scan.history === 'boolean') {
      config.scan.history = raw.scan.history;
    }
    if (typeof raw.scan.maxFileSize === 'number' && raw.scan.maxFileSize > 0) {
      config.scan.maxFileSize = Math.min(raw.scan.maxFileSize, 50 * 1024 * 1024); // cap at 50MB
    }
  }

  return config;
}

/**
 * Check if a finding's severity meets or exceeds the configured threshold.
 *
 * @param {string} findingSeverity - CRITICAL | HIGH | MEDIUM | LOW
 * @param {string} threshold       - critical | high | medium | low
 * @returns {boolean}
 */
export function meetsThreshold(findingSeverity, threshold) {
  const ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  const THRESH = { low: 0, medium: 1, high: 2, critical: 3 };

  const findingLevel = ORDER[findingSeverity?.toUpperCase()] ?? 0;
  const threshLevel  = THRESH[threshold?.toLowerCase()] ?? 0;

  return findingLevel >= threshLevel;
}

/**
 * Generate a sample .secretshield.json content.
 * @returns {string}
 */
export function generateSampleConfig(options = {}) {
  const sample = {
    severityThreshold: options.severityThreshold || 'high',
    ignore: options.ignore || ['fixtures/**', 'docs/examples/**', '**/*.test.js'],
    rules: {
      'aws-access-key':   true,
      'github-token':     true,
      'openai-api-key':   true,
      'stripe-secret-key': true,
      'private-key':      true,
      'database-url':     true,
      'bearer-token':     options.bearerToken !== false,
      'generic-api-key':  options.genericApiKey !== false,
      'generic-password': options.genericPassword ?? false,
    },
    scan: {
      history:     options.history    ?? false,
      maxFileSize: options.maxFileSize ?? 2097152,
    },
  };
  return JSON.stringify(sample, null, 2);
}
