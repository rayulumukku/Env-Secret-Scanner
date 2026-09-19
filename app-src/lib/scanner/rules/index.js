/**
 * rules/index.js — Unified Rule Registry
 *
 * Consolidates all provider-specific and generic credential detection rules.
 */

import { RULES as awsRules } from './aws.js';
import { RULES as githubRules } from './github.js';
import { RULES as openaiRules } from './openai.js';
import { RULES as stripeRules } from './stripe.js';
import { RULES as googleRules } from './google.js';
import { RULES as slackRules } from './slack.js';
import { RULES as jwtRules } from './jwt.js';
import { RULES as privateKeyRules } from './private-key.js';
import { RULES as databaseRules } from './database.js';
import { RULES as npmRules } from './npm.js';
import { RULES as bearerRules } from './bearer-token.js';
import { RULES as genericApiKeyRules } from './generic-api-key.js';
import { RULES as genericPasswordRules } from './generic-password.js';

export const PROVIDER_RULES = [
  ...awsRules,
  ...githubRules,
  ...openaiRules,
  ...stripeRules,
  ...googleRules,
  ...slackRules,
  ...jwtRules,
  ...privateKeyRules,
  ...databaseRules,
  ...npmRules,
];

export const GENERIC_RULES = [
  ...bearerRules,
  ...genericApiKeyRules,
  ...genericPasswordRules,
];

export const ALL_RULES = [
  ...PROVIDER_RULES,
  ...GENERIC_RULES,
];

/**
 * Find a rule by its unique ID
 * @param {string} id
 * @returns {object|undefined}
 */
export function getRuleById(id) {
  return ALL_RULES.find(r => r.id === id);
}

/**
 * Filter rules by category
 * @param {string} category
 * @returns {object[]}
 */
export function getRulesByCategory(category) {
  return ALL_RULES.filter(r => r.category === category);
}

/**
 * Filter rules by severity
 * @param {string} severity
 * @returns {object[]}
 */
export function getRulesBySeverity(severity) {
  return ALL_RULES.filter(r => r.severity === severity);
}
