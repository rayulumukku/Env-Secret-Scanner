import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  loadBuiltinPack,
  validateRulePackManifest,
  computePackIntegrity,
} from '../../packages/rules/src/index.js';

describe('Rule Pack Integrity & Validation', () => {
  it('validates core rule pack manifest', () => {
    const pack = loadBuiltinPack('core');
    const result = validateRulePackManifest(pack);
    assert.strictEqual(result.valid, true, `Core pack errors: ${result.errors.join(', ')}`);
    assert.strictEqual(pack.rules.length > 0, true);
  });

  it('validates community rule pack manifest', () => {
    const pack = loadBuiltinPack('community');
    const result = validateRulePackManifest(pack);
    assert.strictEqual(result.valid, true, `Community pack errors: ${result.errors.join(', ')}`);
    assert.strictEqual(pack.rules.length > 0, true);
  });

  it('validates enterprise rule pack manifest', () => {
    const pack = loadBuiltinPack('enterprise');
    const result = validateRulePackManifest(pack);
    assert.strictEqual(result.valid, true, `Enterprise pack errors: ${result.errors.join(', ')}`);
    assert.strictEqual(pack.rules.length > 0, true);
  });

  it('computes and verifies SHA-256 pack integrity signature', () => {
    const pack = loadBuiltinPack('core');
    const hash = computePackIntegrity(pack);
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.startsWith('sha256-'), true);
    assert.strictEqual(hash.length, 71);
  });
});
