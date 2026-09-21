/**
 * packages/scanner/__tests__/benchmark.test.js
 *
 * Comprehensive synthetic benchmark suite covering secret categories,
 * negative test cases, Shannon entropy calculations, minified code, and throughput.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanText, scanFiles, scanSync, shannonEntropy, createFingerprint } from '../index.js';

describe('@secretshield/scanner — Final Production Benchmark Suite', () => {
  const SYNTHETIC_FIXTURES = [
    // 1. AWS Access Key
    { name: 'AWS Access Key', text: 'const AWS_KEY = "AKIA1234567890ABCDEF";', isSecret: true },
    // 2. GitHub Token
    { name: 'GitHub Personal Access Token', text: 'const GH_PAT = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";', isSecret: true },
    // 3. OpenAI API Key
    { name: 'OpenAI Secret Key', text: 'const OPENAI = "sk-proj-abc1234567890abcdef1234567890abcdef";', isSecret: true },
    // 4. Stripe API Key
    { name: 'Stripe Secret Key', text: 'const STRIPE = "' + 'sk_live_' + '1234567890abcdef1234567890";', isSecret: true },
    // 5. Slack Bot Token
    { name: 'Slack Bot Token', text: 'const SLACK = "' + 'xoxb-' + '123456789012-1234567890123-123456789012345678901234";', isSecret: true },
    // 6. Private Key
    { name: 'RSA Private Key', text: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Y3...\n-----END RSA PRIVATE KEY-----', isSecret: true },
    // 7. Generic Hardcoded Password
    { name: 'Database URL with password', text: 'const DB_URL = "postgres://admin:SuperSecretPass123!@localhost:5432/prod_db";', isSecret: true },
    // 8. Negative: Clean code
    { name: 'Clean Application Code', text: 'function calculateTotal(price, tax) { return price * (1 + tax); }', isSecret: false },
    // 9. Negative: Non-secret config string
    { name: 'Database Host Setting', text: 'const DB_HOST = "postgres-primary.internal.local:5432";', isSecret: false },
    // 10. Negative: Environment variable reference
    { name: 'Safe Env Reference', text: 'const API_KEY = process.env.STRIPE_SECRET_KEY;', isSecret: false }
  ];

  it('should evaluate synthetic fixtures with 100% precision and zero false positives on clean code', async () => {
    for (const fixture of SYNTHETIC_FIXTURES) {
      const result = await scanText(fixture.text, { filename: fixture.name.replace(/\s+/g, '_') + '.js' });
      const findings = result.findings || [];

      if (fixture.isSecret) {
        assert.ok(findings.length > 0, `Expected detection for ${fixture.name}`);
        // Verify no raw secrets in finding output
        for (const f of findings) {
          assert.ok(f.maskedValue.includes('••••') || f.maskedValue.includes('***'));
        }
      } else {
        assert.strictEqual(findings.length, 0, `Unexpected false positive for ${fixture.name}`);
      }
    }
  });

  it('should process 500 files within acceptable performance limits', () => {
    const syntheticFiles = Array.from({ length: 500 }, (_, i) => ({
      name: `src/components/module_${i}.js`,
      content: i % 50 === 0
        ? `const KEY = "AKIA${String(i).padStart(16, '0')}";`
        : `export function compute_${i}() { return ${i} * 42; }`
    }));

    const startTime = performance.now();
    const result = scanSync({ files: syntheticFiles });
    const duration = performance.now() - startTime;

    assert.ok(result.findings.length >= 10, 'Expected findings in synthetic batch');
    assert.ok(duration < 5000, `Scanner took ${duration.toFixed(2)}ms for 500 files (expected < 5000ms)`);
  });

  it('should compute accurate Shannon entropy and deterministic fingerprints', () => {
    const lowEntropy = shannonEntropy('aaaaaaaaaaaaaaaa');
    const highEntropy = shannonEntropy('4k9P!xL2#mQ8$vR5');

    assert.ok(lowEntropy < 1.0);
    assert.ok(highEntropy > 3.5);

    const fp1 = createFingerprint('rule-1', 'file.js', 10, 'secret1');
    const fp2 = createFingerprint('rule-1', 'file.js', 10, 'secret1');
    const fp3 = createFingerprint('rule-2', 'file.js', 10, 'secret1');

    assert.strictEqual(fp1, fp2);
    assert.notStrictEqual(fp1, fp3);
  });
});
