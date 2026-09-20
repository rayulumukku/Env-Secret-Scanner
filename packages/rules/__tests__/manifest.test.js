import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRule,
  validateRulePackManifest,
  validateRegexSafety,
  LIMITS,
} from '../src/schema.js';

describe('@secretshield/rules — Manifest & Rule Schema Validation', () => {
  it('should validate a compliant Rule object successfully', () => {
    const validRule = {
      id: 'custom-api-token',
      name: 'Custom API Token',
      description: 'Detects proprietary API token format',
      provider: 'Acme Corp',
      category: 'Cloud',
      severity: 'CRITICAL',
      confidence: 95,
      version: '1.0.0',
      patterns: ['acme_token_[A-Za-z0-9]{32}'],
      keywords: ['acme_token_'],
      testFixtures: {
        positive: ['TOKEN=acme_token_11112222333344445555666677778888'],
        negative: ['TOKEN=acme_token_short'],
      },
    };

    const res = validateRule(validRule);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.errors.length, 0);
  });

  it('should reject rules with invalid ID, missing fields, or invalid category', () => {
    const invalidRule = {
      id: 'inv@lid id!',
      name: 'Bad Rule',
      category: 'NonExistentCategory',
      severity: 'SUPER_CRITICAL',
      version: 'v1',
    };

    const res = validateRule(invalidRule);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.length >= 3);
  });

  it('should reject manifest with duplicate rule IDs', () => {
    const duplicateManifest = {
      id: 'duplicate-pack',
      name: 'Duplicate Rule Pack',
      version: '1.0.0',
      description: 'Pack with duplicate rule ids',
      author: 'Tester',
      license: 'MIT',
      rules: [
        {
          id: 'same-rule-id',
          name: 'Rule 1',
          description: 'Desc 1',
          provider: 'Provider 1',
          category: 'Cloud',
          severity: 'HIGH',
          version: '1.0.0',
          patterns: ['pattern_one_[0-9]{10}'],
        },
        {
          id: 'same-rule-id',
          name: 'Rule 2',
          description: 'Desc 2',
          provider: 'Provider 2',
          category: 'Cloud',
          severity: 'HIGH',
          version: '1.0.0',
          patterns: ['pattern_two_[0-9]{10}'],
        },
      ],
    };

    const res = validateRulePackManifest(duplicateManifest);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some(e => e.includes("Duplicate rule ID 'same-rule-id'")));
  });

  it('should reject manifest exceeding maximum rule count', () => {
    const rules = [];
    for (let i = 0; i <= LIMITS.MAX_RULES_PER_PACK + 1; i++) {
      rules.push({
        id: `rule-${i}`,
        name: `Rule ${i}`,
        description: 'Description',
        provider: 'Provider',
        category: 'Cloud',
        severity: 'HIGH',
        version: '1.0.0',
        patterns: ['pattern_[0-9]+'],
      });
    }

    const oversizedManifest = {
      id: 'oversized-pack',
      name: 'Oversized Pack',
      version: '1.0.0',
      description: 'Too many rules',
      author: 'Tester',
      license: 'MIT',
      rules,
    };

    const res = validateRulePackManifest(oversizedManifest);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('exceeding limit')));
  });
});
