import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateRulePackManifest, validateRule, LIMITS } from '../src/schema.js';
import { verifyPackIntegrity, computePackIntegrity } from '../src/integrity.js';

describe('@secretshield/rules — API & Manifest Security Guards', () => {
  it('should enforce MAX_RULES_PER_PACK limit', () => {
    const hugeRules = [];
    for (let i = 0; i <= LIMITS.MAX_RULES_PER_PACK + 5; i++) {
      hugeRules.push({
        id: `rule-${i}`,
        name: `Rule ${i}`,
        description: 'Test rule',
        provider: 'Test',
        category: 'Cloud',
        severity: 'HIGH',
        version: '1.0.0',
        patterns: [`pat_${i}_[0-9]{8}`],
      });
    }

    const hugePack = {
      id: 'oversized-pack',
      name: 'Oversized Pack',
      version: '1.0.0',
      description: 'Pack with too many rules',
      author: 'Tester',
      license: 'MIT',
      rules: hugeRules,
    };

    const val = validateRulePackManifest(hugePack);
    assert.strictEqual(val.valid, false);
    assert.ok(val.errors.some(e => e.includes(`exceeding limit of ${LIMITS.MAX_RULES_PER_PACK}`)));
  });

  it('should enforce MAX_PATTERN_LENGTH limit to prevent buffer abuse', () => {
    const longPattern = 'a'.repeat(LIMITS.MAX_PATTERN_LENGTH + 50);
    const rule = {
      id: 'long-pattern-rule',
      name: 'Long Pattern Rule',
      description: 'Test pattern length',
      provider: 'Test',
      category: 'Cloud',
      severity: 'HIGH',
      version: '1.0.0',
      patterns: [longPattern],
    };

    const val = validateRule(rule);
    assert.strictEqual(val.valid, false);
    assert.ok(val.errors.some(e => e.includes('Pattern safety failure')));
  });

  it('should detect and reject any tampering in signed / canonical manifests', () => {
    const validPack = {
      id: 'signed-pack',
      name: 'Signed Pack',
      version: '1.0.0',
      description: 'Original content',
      author: 'Tester',
      license: 'MIT',
      rules: [
        {
          id: 'test-rule-1',
          name: 'Test Rule',
          description: 'Safe rule',
          provider: 'Test',
          category: 'Cloud',
          severity: 'HIGH',
          version: '1.0.0',
          patterns: ['safe_token_[a-z0-9]{16}'],
        },
      ],
    };

    const integrity = computePackIntegrity(validPack);
    validPack.integrity = integrity;

    // Verify untouched pack passes
    assert.strictEqual(verifyPackIntegrity(validPack).valid, true);

    // Tamper with a rule pattern
    const tamperedPack = JSON.parse(JSON.stringify(validPack));
    tamperedPack.rules[0].patterns = ['tampered_pattern_[0-9]+'];

    const checkTampered = verifyPackIntegrity(tamperedPack);
    assert.strictEqual(checkTampered.valid, false);
    assert.ok(checkTampered.error.includes('Integrity mismatch'));
  });
});
