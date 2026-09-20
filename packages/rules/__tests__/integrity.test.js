import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalize,
  computePackIntegrity,
  verifyPackIntegrity,
  signPack,
} from '../src/integrity.js';

describe('@secretshield/rules — Canonical Integrity & Signing', () => {
  it('should compute identical hash regardless of JSON object key ordering', () => {
    const packA = {
      id: 'test-pack',
      version: '1.0.0',
      name: 'Test Pack',
      rules: [{ id: 'rule-1', pattern: 'abc', severity: 'HIGH' }],
    };

    const packB = {
      name: 'Test Pack',
      rules: [{ severity: 'HIGH', pattern: 'abc', id: 'rule-1' }],
      id: 'test-pack',
      version: '1.0.0',
    };

    const hashA = computePackIntegrity(packA);
    const hashB = computePackIntegrity(packB);

    assert.strictEqual(hashA, hashB);
    assert.ok(hashA.startsWith('sha256-'));
  });

  it('should detect and reject tampered manifest content', () => {
    const originalPack = {
      id: 'secure-pack',
      name: 'Secure Pack',
      version: '1.0.0',
      rules: [{ id: 'rule-1', pattern: 'sec_[0-9]+' }],
    };

    const signed = signPack(originalPack, { publisher: 'SecretShield Team' });
    assert.strictEqual(verifyPackIntegrity(signed).valid, true);

    // Tamper with a rule pattern
    const tampered = {
      ...signed,
      rules: [{ id: 'rule-1', pattern: 'tampered_malicious_pattern' }],
    };

    const verifyResult = verifyPackIntegrity(tampered);
    assert.strictEqual(verifyResult.valid, false);
    assert.ok(verifyResult.error.includes('Integrity mismatch'));
  });
});
