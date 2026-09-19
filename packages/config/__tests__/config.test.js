import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG,
  meetsThreshold,
  validateConfig,
  generateSampleConfig,
} from '../index.js';

describe('@secretshield/config Package Tests', () => {
  test('DEFAULT_CONFIG has required properties', () => {
    assert.ok(DEFAULT_CONFIG.version);
    assert.ok(Array.isArray(DEFAULT_CONFIG.ignore));
    assert.ok(typeof DEFAULT_CONFIG.rules === 'object');
    assert.equal(DEFAULT_CONFIG.severityThreshold, 'low');
  });

  test('meetsThreshold evaluates severity hierarchy', () => {
    assert.equal(meetsThreshold('CRITICAL', 'low'), true);
    assert.equal(meetsThreshold('CRITICAL', 'high'), true);
    assert.equal(meetsThreshold('CRITICAL', 'critical'), true);
    assert.equal(meetsThreshold('HIGH', 'critical'), false);
    assert.equal(meetsThreshold('MEDIUM', 'high'), false);
    assert.equal(meetsThreshold('LOW', 'low'), true);
  });

  test('validateConfig sanitizes invalid inputs', () => {
    const invalid = {
      severityThreshold: 'super-critical',
      ignore: ['node_modules', 'evil; rm -rf /'],
    };

    const result = validateConfig(invalid);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 2);
    // Malicious shell pattern stripped
    assert.ok(!result.config.ignore.includes('evil; rm -rf /'));
  });

  test('generateSampleConfig outputs valid JSON', () => {
    const raw = generateSampleConfig({ severityThreshold: 'high' });
    const parsed = JSON.parse(raw);
    assert.equal(parsed.severityThreshold, 'high');
    assert.ok(parsed.rules.AWS_ACCESS_KEY_ID);
  });
});
