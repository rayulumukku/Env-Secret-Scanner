import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  maskSecretValue,
  redactSecrets,
  detectFalsePositiveIndicators,
} from '../../packages/copilot/index.js';

describe('Copilot & Remediation Intelligence', () => {
  it('masks sensitive values properly', () => {
    const masked = maskSecretValue('sk_live_1234567890abcdef');
    assert.strictEqual(masked.startsWith('sk_l'), true);
    assert.strictEqual(masked.endsWith('cdef'), true);
    assert.strictEqual(masked.includes('••••'), true);
  });

  it('redacts secret patterns recursively in context objects', () => {
    const redacted = redactSecrets('export AWS_KEY="AKIAIOSFODNN7EXAMPLE";');
    assert.strictEqual(redacted.includes('AKIAIOSFODNN7EXAMPLE'), false);
    assert.strictEqual(redacted.includes('REDACTED'), true);
  });

  it('identifies false positive indicators in test/mock files', () => {
    const indicators = detectFalsePositiveIndicators({
      filePath: '/test/scanner.test.js',
      maskedValue: 'dummy_token_123',
    });
    assert.strictEqual(Array.isArray(indicators), true);
    assert.strictEqual(indicators.length > 0, true);
  });
});
