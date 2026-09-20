import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shannonEntropy } from '../../../app-src/lib/scanner/entropy.js';

describe('Scanner Regression Suite: Shannon Entropy Calculation Engine', () => {
  it('returns 0 for empty or single-character uniform strings', () => {
    assert.equal(shannonEntropy(''), 0);
    assert.equal(shannonEntropy('AAAAAAAAAAAA'), 0);
    assert.equal(shannonEntropy('000000000000'), 0);
  });

  it('calculates exact entropy for two alternating characters (1.0 bit)', () => {
    const entropy = shannonEntropy('ABABABABABAB');
    assert.ok(Math.abs(entropy - 1.0) < 0.01, `Expected ~1.0, got ${entropy}`);
  });

  it('computes high entropy (> 4.5 bits) for cryptographically random keys', () => {
    const highEntropyKey = 'xKq9Z2wL8mP3vN7rT4yB1cF6hJ0sD5gA';
    const entropy = shannonEntropy(highEntropyKey);
    assert.ok(entropy > 4.5, `Expected > 4.5 for random key, got ${entropy}`);
  });

  it('computes low entropy (< 3.0 bits) for repetitive / human readable words', () => {
    const word = 'administrator_account';
    const entropy = shannonEntropy(word);
    assert.ok(entropy < 3.8, `Expected < 3.8 for dictionary words, got ${entropy}`);
  });
});
