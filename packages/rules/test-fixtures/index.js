/**
 * packages/rules/test-fixtures/index.js
 *
 * Synthetic test fixtures catalog across all 13 detection categories.
 * Strict zero-exposure guarantee: Contains ONLY obviously fake synthetic strings.
 */

import cloudFixtures from './cloud.json' with { type: 'json' };
import aiFixtures from './ai.json' with { type: 'json' };
import sourceControlFixtures from './source-control.json' with { type: 'json' };
import paymentsFixtures from './payments.json' with { type: 'json' };
import communicationFixtures from './communication.json' with { type: 'json' };
import databasesFixtures from './databases.json' with { type: 'json' };
import infrastructureFixtures from './infrastructure.json' with { type: 'json' };
import cicdFixtures from './cicd.json' with { type: 'json' };
import authFixtures from './authentication.json' with { type: 'json' };
import privateKeyFixtures from './private-keys.json' with { type: 'json' };
import tokenFixtures from './tokens.json' with { type: 'json' };
import genericFixtures from './generic.json' with { type: 'json' };
import configFixtures from './config.json' with { type: 'json' };

export const ALL_CATEGORY_FIXTURES = [
  cloudFixtures,
  aiFixtures,
  sourceControlFixtures,
  paymentsFixtures,
  communicationFixtures,
  databasesFixtures,
  infrastructureFixtures,
  cicdFixtures,
  authFixtures,
  privateKeyFixtures,
  tokenFixtures,
  genericFixtures,
  configFixtures,
];

export function getFixturesByRuleId(ruleId) {
  for (const cat of ALL_CATEGORY_FIXTURES) {
    const found = (cat.fixtures || []).find(f => f.ruleId === ruleId);
    if (found) return found;
  }
  return null;
}

export function getAllSyntheticFixtures() {
  const all = [];
  for (const cat of ALL_CATEGORY_FIXTURES) {
    for (const f of (cat.fixtures || [])) {
      all.push({
        category: cat.category,
        ...f,
      });
    }
  }
  return all;
}
