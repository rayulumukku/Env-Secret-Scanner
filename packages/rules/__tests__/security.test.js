import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateRegexSafety } from '../src/schema.js';

describe('@secretshield/rules — ReDoS & Regex Safety Verification', () => {
  it('should accept well-formed, bounded regex patterns', () => {
    const safePatterns = [
      'AKIA[A-Z0-9]{16}',
      'sk_(?:live|test)_[0-9a-zA-Z]{24,32}',
      '(?i)(?:password|secret)\\s*[:=]\\s*[\'"][^\'"]+[\'"]',
      'postgres(?:ql)?://[a-zA-Z0-9_]+:[^@]+@[a-zA-Z0-9_]+:[0-9]+/[a-zA-Z0-9_]+',
    ];

    for (const pat of safePatterns) {
      const res = validateRegexSafety(pat);
      assert.strictEqual(res.safe, true, `Pattern should be safe: ${pat}`);
    }
  });

  it('should reject catastrophic backtracking ReDoS patterns', () => {
    const dangerousPatterns = [
      '([a-zA-Z0-9]+)+',
      '([a-z]*)*',
      '([0-9]+\\+)+',
      '([a-zA-Z0-9_.*+\\-\\\]{1,})+',
    ];

    for (const pat of dangerousPatterns) {
      const res = validateRegexSafety(pat);
      assert.strictEqual(res.safe, false, `Pattern should be rejected: ${pat}`);
      assert.ok(res.error.includes('catastrophic backtracking') || res.error.includes('ReDoS'));
    }
  });

  it('should reject patterns exceeding length limits', () => {
    const oversizedPattern = 'a'.repeat(1001);
    const res = validateRegexSafety(oversizedPattern);
    assert.strictEqual(res.safe, false);
    assert.ok(res.error.includes('exceeds maximum length'));
  });
});
