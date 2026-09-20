/**
 * packages/rules/src/index.js
 *
 * Main entry point for @secretshield/rules.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  RULE_CATEGORIES,
  RULE_SEVERITIES,
  LIMITS,
  validateRule,
  validateRulePackManifest,
  validateRegexSafety,
} from './schema.js';

import {
  canonicalize,
  computePackIntegrity,
  verifyPackIntegrity,
  signPack,
} from './integrity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load built-in pack JSON files safely
export function loadBuiltinPack(packName) {
  const manifestPath = join(__dirname, '..', packName, 'pack.json');
  try {
    const raw = readFileSync(manifestPath, 'utf8');
    const pack = JSON.parse(raw);
    const integrity = computePackIntegrity(pack);
    pack.integrity = integrity;
    return pack;
  } catch (err) {
    throw new Error(`Failed to load built-in rule pack '${packName}': ${err.message}`);
  }
}

export {
  RULE_CATEGORIES,
  RULE_SEVERITIES,
  LIMITS,
  validateRule,
  validateRulePackManifest,
  validateRegexSafety,
  canonicalize,
  computePackIntegrity,
  verifyPackIntegrity,
  signPack,
};
