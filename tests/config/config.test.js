import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_CONFIG,
  meetsThreshold,
  validateConfig,
  generateSampleConfig,
} from '../../packages/config/index.js';

describe('SecretShield Configuration', () => {
  it('standardizes on version 1.0.0', () => {
    assert.strictEqual(DEFAULT_CONFIG.version, '1.0.0');
    const sample = JSON.parse(generateSampleConfig());
    assert.strictEqual(sample.version, '1.0.0');
  });

  it('correctly evaluates severity thresholds', () => {
    assert.strictEqual(meetsThreshold('CRITICAL', 'high'), true);
    assert.strictEqual(meetsThreshold('HIGH', 'high'), true);
    assert.strictEqual(meetsThreshold('MEDIUM', 'high'), false);
    assert.strictEqual(meetsThreshold('LOW', 'high'), false);
  });

  it('validates configuration objects and detects invalid options', () => {
    const valid = validateConfig({
      version: '1.0.0',
      severityThreshold: 'medium',
      ignore: ['node_modules/**'],
    });
    assert.strictEqual(valid.valid, true);

    const invalid = validateConfig({
      severityThreshold: 'invalid-severity',
    });
    assert.strictEqual(invalid.valid, false);
  });
});
