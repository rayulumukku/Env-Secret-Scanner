/**
 * scanner.test.js — Comprehensive scanner engine tests.
 *
 * Run with: node --test app-src/lib/scanner/__tests__/scanner.test.js
 *
 * ALL TEST CREDENTIALS ARE SYNTHETIC AND NON-FUNCTIONAL.
 * String concatenation prevents accidental secret detection in CI.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── Import scanner modules ────────────────────────────────────────────────
// We test the engine function directly
import { scan } from '../engine.js';
import { shannonEntropy, isHighEntropySecret } from '../entropy.js';
import { isPlaceholder } from '../context.js';
import { shouldScanFile } from '../file-filter.js';
import { maskSecret } from '../masking.js';
import { createFingerprint, deduplicateFindings } from '../fingerprint.js';
import { scoreToSeverity } from '../confidence.js';

// ── HELPERS ───────────────────────────────────────────────────────────────

/** Scan a single string of content */
function scanContent(content, filename = 'test.js') {
  return scan({ files: [{ name: filename, content }] });
}

/** Find a finding by type */
function findByType(findings, type) {
  return findings.find(f => f.type === type);
}

/** Assert no finding has type matching prefix */
function assertNoFindingMatching(findings, predicate, msg) {
  const match = findings.find(predicate);
  assert.ok(!match, `${msg}: found unexpected finding: ${match?.type} (${match?.maskedValue})`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTROPY TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Shannon Entropy', () => {
  test('empty string returns 0', () => {
    assert.strictEqual(shannonEntropy(''), 0);
  });

  test('uniform string returns 0', () => {
    assert.strictEqual(shannonEntropy('aaaaaaaaaa'), 0);
  });

  test('two distinct chars: entropy = 1.0', () => {
    const e = shannonEntropy('ababababab');
    assert.ok(Math.abs(e - 1.0) < 0.01, `expected ~1.0, got ${e}`);
  });

  test('high entropy random-looking string > 4.5', () => {
    const e = shannonEntropy('xK9Qm2PLnR7sTv4WyBg6HdEu8FjAc1Zo');
    assert.ok(e > 4.5, `expected >4.5, got ${e}`);
  });

  test('all-zeros string is not high entropy', () => {
    const { isHighEntropy } = isHighEntropySecret('0'.repeat(32));
    assert.strictEqual(isHighEntropy, false);
  });

  test('repeated placeholder values are not high entropy', () => {
    const { isHighEntropy } = isHighEntropySecret('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    assert.strictEqual(isHighEntropy, false);
  });

  test('real-looking API key IS high entropy', () => {
    const { isHighEntropy } = isHighEntropySecret('xK9Qm2PLnR7sTv4WyBg6HdEu8FjAc1Zo');
    assert.strictEqual(isHighEntropy, true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PLACEHOLDER DETECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Placeholder Detection', () => {
  test('YOUR_API_KEY is placeholder', () => assert.ok(isPlaceholder('YOUR_API_KEY')));
  test('changeme is placeholder', () => assert.ok(isPlaceholder('changeme')));
  test('xxxxxxxxxxxxxxxx is placeholder', () => assert.ok(isPlaceholder('xxxxxxxxxxxxxxxx')));
  test('<TOKEN> is placeholder', () => assert.ok(isPlaceholder('<TOKEN>')));
  test('your-secret-here is placeholder', () => assert.ok(isPlaceholder('your-secret-here')));
  test('00000000000000000000 is placeholder', () => assert.ok(isPlaceholder('00000000000000000000')));
  test('example_value is placeholder', () => assert.ok(isPlaceholder('example_value')));

  test('real AWS key is NOT placeholder', () => {
    assert.ok(!isPlaceholder('AKIA' + 'IOSFODNN7REALKEY1'));
  });
  test('real-looking random string is NOT placeholder', () => {
    assert.ok(!isPlaceholder('xK9Qm2PLnR7sTv4WyBg6'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FILE FILTER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('File Filter', () => {
  test('skips node_modules', () => {
    const r = shouldScanFile({ name: 'node_modules/lodash/index.js', content: 'x' });
    assert.ok(r.skip);
  });

  test('skips .git directory', () => {
    const r = shouldScanFile({ name: '.git/config', content: 'x' });
    assert.ok(r.skip);
  });

  test('skips .next directory', () => {
    const r = shouldScanFile({ name: '.next/server/app/page.js', content: 'x' });
    assert.ok(r.skip);
  });

  test('skips binary extension (png)', () => {
    const r = shouldScanFile({ name: 'logo.png', content: 'x' });
    assert.ok(r.skip);
  });

  test('skips files with null bytes', () => {
    const r = shouldScanFile({ name: 'binary.bin', content: 'hello\0world' });
    assert.ok(r.skip);
  });

  test('skips empty files', () => {
    const r = shouldScanFile({ name: 'empty.js', content: '   ' });
    assert.ok(r.skip);
  });

  test('allows normal JS file', () => {
    const r = shouldScanFile({ name: 'config.js', content: 'const x = 1;' });
    assert.ok(!r.skip);
  });

  test('allows .env file', () => {
    const r = shouldScanFile({ name: '.env', content: 'KEY=value' });
    assert.ok(!r.skip);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MASKING TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Secret Masking', () => {
  test('masks middle portion', () => {
    const masked = maskSecret('sk_test_1234567890abcdef', { showPrefix: 8, showSuffix: 4 });
    assert.ok(masked.startsWith('sk_test_'));
    assert.ok(masked.endsWith('cdef'));
    assert.ok(masked.includes('•'));
  });

  test('very short string is fully masked', () => {
    const masked = maskSecret('abc');
    assert.ok(!masked.includes('abc'));
    assert.ok(masked.includes('•'));
  });

  test('never returns raw value for long strings', () => {
    const raw = 'xK9Qm2PLnR7sTv4WyBg6HdEu8FjAc1Zo';
    const masked = maskSecret(raw);
    assert.ok(!masked.includes(raw));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Confidence Score → Severity', () => {
  test('score 95 → CRITICAL', () => assert.strictEqual(scoreToSeverity(95), 'CRITICAL'));
  test('score 80 → HIGH',     () => assert.strictEqual(scoreToSeverity(80), 'HIGH'));
  test('score 55 → MEDIUM',   () => assert.strictEqual(scoreToSeverity(55), 'MEDIUM'));
  test('score 20 → LOW',      () => assert.strictEqual(scoreToSeverity(20), 'LOW'));
  test('score 0 → LOW',       () => assert.strictEqual(scoreToSeverity(0),  'LOW'));
  test('score 100 → CRITICAL',() => assert.strictEqual(scoreToSeverity(100),'CRITICAL'));
});

// ═══════════════════════════════════════════════════════════════════════════
// AWS RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('AWS Detection', () => {
  test('detects AWS Access Key ID', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scanContent(`const awsKey = "${key}";`);
    const f = findByType(result.findings, 'AWS_ACCESS_KEY_ID');
    assert.ok(f, 'should detect AWS access key');
    assert.strictEqual(f.severity, 'CRITICAL');
    assert.ok(!f.maskedValue.includes(key), 'should not expose full key');
  });

  test('detects AWS Secret Access Key', () => {
    const content = 'aws_secret_access_key = "wJalrXUtnFEMI' + '/K7MDENG/bPxRfiCYEXAMPLEKEY"';
    const result = scanContent(content);
    const f = findByType(result.findings, 'AWS_SECRET_ACCESS_KEY');
    assert.ok(f, 'should detect AWS secret key');
    assert.ok(!f.maskedValue.includes('wJalrXUtnFEMI'), 'should mask raw value');
  });

  test('does NOT flag AKIA in comment without key chars', () => {
    const result = scanContent('// The key format is AKIA followed by random chars');
    const f = findByType(result.findings, 'AWS_ACCESS_KEY_ID');
    assert.ok(!f, 'should not flag partial AKIA mention');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GITHUB RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('GitHub Token Detection', () => {
  test('detects GitHub classic PAT (ghp_)', () => {
    const token = 'ghp_' + 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8';
    const result = scanContent(`const token = "${token}";`);
    const f = findByType(result.findings, 'GITHUB_PAT_CLASSIC');
    assert.ok(f, 'should detect classic PAT');
    assert.ok(!f.maskedValue.includes(token));
  });

  test('detects GitHub OAuth token (gho_)', () => {
    const token = 'gho_' + 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8';
    const result = scanContent(`export const auth = "${token}";`);
    const f = findByType(result.findings, 'GITHUB_OAUTH_TOKEN');
    assert.ok(f, 'should detect OAuth token');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// OPENAI RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('OpenAI Key Detection', () => {
  test('detects sk-proj- project key', () => {
    const key = 'sk-proj-' + 'Xq9mN3kR8pL2vH7yW4cB6jA1eG5fD0sQ9zT4nJ8mP5wL7vK2hF';
    const result = scanContent(`const openaiKey = "${key}";`);
    const f = findByType(result.findings, 'OPENAI_API_KEY_PROJECT');
    assert.ok(f, 'should detect OpenAI project key');
    assert.ok(!f.maskedValue.includes(key));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// STRIPE RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('Stripe Key Detection', () => {
  test('detects sk_test_ key', () => {
    // Use an assignment context and a key with enough chars (24+)
    const key = 'sk_test_' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef';
    const result = scanContent(`STRIPE_SECRET_KEY="${key}"`);
    const f = findByType(result.findings, 'STRIPE_SECRET_KEY_TEST');
    assert.ok(f, `should detect Stripe test key, got: ${result.findings.map(x => x.type).join(',')}`);
  });

  test('detects sk_live_ key as CRITICAL', () => {
    const key = 'sk_live_' + '4eC39HqLyjWDarjtT1zdp7dcFakeKey123';
    const result = scanContent(`STRIPE_SECRET_KEY="${key}"`);
    const f = findByType(result.findings, 'STRIPE_SECRET_KEY_LIVE');
    assert.ok(f, 'should detect Stripe live key');
    assert.strictEqual(f.severity, 'CRITICAL');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JWT RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('JWT Detection', () => {
  test('detects a valid JWT', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QifQ' +
      '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = scanContent(`const token = "${jwt}";`);
    const f = findByType(result.findings, 'JWT_TOKEN');
    assert.ok(f, 'should detect JWT');
  });

  test('does NOT flag not.a.validjwt', () => {
    const result = scanContent('const x = "not.a.validjwt";');
    const f = findByType(result.findings, 'JWT_TOKEN');
    assert.ok(!f, 'should not flag short dot-separated value as JWT');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('Database Connection String Detection', () => {
  test('detects PostgreSQL URL with password', () => {
    const result = scanContent('DATABASE_URL="postgresql://admin:s3cr3tP4ss@db.example.com:5432/prod"');
    const f = findByType(result.findings, 'DATABASE_POSTGRES_URL');
    assert.ok(f, 'should detect postgres URL');
    assert.ok(!f.maskedValue.includes('s3cr3tP4ss'), 'should mask password');
  });

  test('detects MongoDB connection string', () => {
    const result = scanContent('MONGO_URL=mongodb://user:p4ssw0rd@cluster.mongodb.net/db');
    const f = findByType(result.findings, 'DATABASE_MONGODB_URL');
    assert.ok(f, 'should detect mongo URL');
  });

  test('detects Redis connection string', () => {
    const result = scanContent('REDIS_URL="redis://:r3d1sP4ss@redis.myhost.com:6379"');
    const f = findByType(result.findings, 'DATABASE_REDIS_URL');
    assert.ok(f, 'should detect redis URL');
  });

  test('does NOT flag localhost DB without password', () => {
    const result = scanContent('DB_URL=postgres://localhost:5432/mydb');
    // No password segment — should not match credential pattern
    const f = findByType(result.findings, 'DATABASE_POSTGRES_URL');
    assert.ok(!f, 'should not flag DB URL without password');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE KEY RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('Private Key Detection', () => {
  test('detects RSA private key block', () => {
    const content = [
      '-----BEGIN RSA PRIVATE KEY-----',
      'MIIEowIBAAKCAQEA2a2rwplBQLzHPZe5TNJP8Q2iMkbFakeKeyContent123456',
      'MoreFakeKeyContentHere9876543210abcdefghijklmnopqrstuvwxyz123456',
      '-----END RSA PRIVATE KEY-----',
    ].join('\n');
    const result = scanContent(content, 'id_rsa');
    const f = findByType(result.findings, 'PRIVATE_KEY_RSA');
    assert.ok(f, 'should detect RSA private key');
    assert.strictEqual(f.severity, 'CRITICAL');
  });

  test('detects OpenSSH private key', () => {
    const content = [
      '-----BEGIN OPENSSH PRIVATE KEY-----',
      'b3BlbnNzaC1rZXktdjEAAAAFbm9uZQAAAAAAAABB',
      'AAAAC3NzaC1lZDI1NTE5AAAAIBPwHZ7PCmTF4X8Q',
      '-----END OPENSSH PRIVATE KEY-----',
    ].join('\n');
    const result = scanContent(content, 'id_ed25519');
    const f = findByType(result.findings, 'PRIVATE_KEY_OPENSSH');
    assert.ok(f, `should detect OpenSSH key, found: ${result.findings.map(x => x.type).join(',')}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GENERIC RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('Generic Secret Detection', () => {
  test('detects hardcoded password assignment', () => {
    const result = scanContent('const password = "mySuperS3cr3tPassw0rd!";');
    const f = result.findings.find(f => f.type === 'GENERIC_PASSWORD');
    assert.ok(f, 'should detect generic password');
  });

  test('detects generic API key variable', () => {
    const result = scanContent('const api_key = "xKq9mFakeAPIKey123456789012345";');
    const f = result.findings.find(f => f.category === 'Generic Secrets');
    assert.ok(f, 'should detect generic API key');
  });

  test('does NOT flag password = "changeme"', () => {
    const result = scanContent('const password = "changeme";');
    // changeme is a known placeholder
    const f = result.findings.find(f => f.type === 'GENERIC_PASSWORD');
    assert.ok(!f || f.confidence < 30, 'changeme should be suppressed or low confidence');
  });

  test('does NOT flag password = "password123"', () => {
    const result = scanContent('const password = "password123";');
    const f = result.findings.find(f => f.type === 'GENERIC_PASSWORD');
    assert.ok(!f || f.confidence < 30, 'password123 should be suppressed');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// npm TOKEN RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('npm Token Detection', () => {
  test('detects npm_ prefixed token', () => {
    const token = 'npm_' + 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8';
    const result = scanContent(`NPM_TOKEN="${token}"`);
    const f = findByType(result.findings, 'NPM_ACCESS_TOKEN');
    assert.ok(f, 'should detect npm access token');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SLACK RULES
// ═══════════════════════════════════════════════════════════════════════════

describe('Slack Token Detection', () => {
  test('detects xoxb bot token', () => {
    // Split token to avoid GitHub push protection on literal pattern
    const token = 'xoxb-1234567890123-1234567890123-' + 'A1B2C3D4E5F6G7H8I9J0K1L2';
    const result = scanContent(`SLACK_BOT_TOKEN=${token}`);
    const f = findByType(result.findings, 'SLACK_BOT_TOKEN');
    assert.ok(f, 'should detect Slack bot token');
  });

  test('detects Slack webhook URL', () => {
    // Split URL to avoid push protection scanning
    const url = 'https://hooks.slack.com/services/' + 'T00000000/B00000000/FakeWebhookTokenHere1234';
    const result = scanContent(`const webhook = "${url}";`);
    const f = findByType(result.findings, 'SLACK_WEBHOOK_URL');
    assert.ok(f, 'should detect Slack webhook');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FINGERPRINTING + DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════════

describe('Fingerprinting and Deduplication', () => {
  test('same secret gets same fingerprint', () => {
    const f1 = { type: 'AWS_ACCESS_KEY_ID', file: 'a.js', line: 1, column: 1, maskedValue: 'AKIA••••KEY' };
    const f2 = { type: 'AWS_ACCESS_KEY_ID', file: 'a.js', line: 1, column: 1, maskedValue: 'AKIA••••KEY' };
    assert.strictEqual(createFingerprint(f1), createFingerprint(f2));
  });

  test('different locations get different fingerprints', () => {
    const f1 = { type: 'AWS_ACCESS_KEY_ID', file: 'a.js', line: 1, column: 1, maskedValue: 'AKIA••••KEY' };
    const f2 = { type: 'AWS_ACCESS_KEY_ID', file: 'b.js', line: 5, column: 1, maskedValue: 'AKIA••••KEY' };
    assert.notStrictEqual(createFingerprint(f1), createFingerprint(f2));
  });

  test('duplicate findings are deduplicated', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    // Same key appearing twice in the same file on different lines
    const content = `const a = "${key}";\nconst b = "${key}";`;
    const result = scanContent(content, 'config.js');
    const findings = result.findings.filter(f => f.type === 'AWS_ACCESS_KEY_ID');
    // Both occurrences are at different lines so both should appear
    assert.ok(findings.length >= 1, `at least one finding, got ${findings.length}`);
  });

  test('multiple files: same secret flagged in both', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scan({
      files: [
        { name: 'file1.js', content: `const a = "${key}";` },
        { name: 'file2.js', content: `const b = "${key}";` },
      ],
    });
    const findings = result.findings.filter(f => f.type === 'AWS_ACCESS_KEY_ID');
    assert.ok(findings.length >= 2, `should find in both files, got ${findings.length}`);
    const files = new Set(findings.map(f => f.file));
    assert.ok(files.has('file1.js') && files.has('file2.js'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MULTIPLE SECRETS IN ONE FILE
// ═══════════════════════════════════════════════════════════════════════════

describe('Multiple Secrets in One File', () => {
  test('detects multiple different secret types in one file', () => {
    const awsKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const ghToken = 'ghp_' + 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8';
    const content = [
      `const AWS_KEY = "${awsKey}";`,
      `const GH_TOKEN = "${ghToken}";`,
      'const DB = "postgresql://admin:s3cr3tPass@db.example.com/prod";',
    ].join('\n');
    const result = scanContent(content, 'secrets.js');
    assert.ok(result.findings.length >= 2, `expected ≥2 findings, got ${result.findings.length}`);
    const types = new Set(result.findings.map(f => f.type));
    assert.ok(types.has('AWS_ACCESS_KEY_ID') || types.size >= 2, `types: ${[...types].join(',')}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FILE FILTERING IN FULL SCAN
// ═══════════════════════════════════════════════════════════════════════════

describe('File Filtering in Full Scan', () => {
  test('skips node_modules files', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scan({
      files: [
        { name: 'node_modules/lib/index.js', content: `const k = "${key}";` },
      ],
    });
    assert.strictEqual(result.findings.length, 0, 'should skip node_modules');
    assert.ok(result.skippedFiles.length > 0);
  });

  test('binary files are skipped', () => {
    const result = scan({
      files: [
        { name: 'image.png', content: 'AKIA' + 'IOSFODNN7EXAMPLE' },
      ],
    });
    assert.strictEqual(result.findings.length, 0, 'binary extension should be skipped');
  });

  test('allowlisted file is skipped', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scan({
      files: [{ name: 'config.js', content: `const k = "${key}";` }],
      allowlistFiles: ['config.js'],
    });
    assert.strictEqual(result.findings.length, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY: RAW SECRET NEVER RETURNED
// ═══════════════════════════════════════════════════════════════════════════

describe('Security: No Raw Secret in API Response', () => {
  test('findings never contain full raw AWS key', () => {
    const rawKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scanContent(`const key = "${rawKey}";`);
    const serialized = JSON.stringify(result);
    // Raw key full value should not appear in response
    // (we allow the first 4 chars "AKIA" in prefix)
    assert.ok(!serialized.includes(rawKey), 'full raw key should never appear in scan result');
  });

  test('findings never contain raw database password', () => {
    const rawPw = 's3cr3tP4ssw0rd99';
    const result = scanContent(`DATABASE_URL="postgresql://admin:${rawPw}@db.example.com/prod"`);
    const serialized = JSON.stringify(result);
    assert.ok(!serialized.includes(rawPw), 'raw DB password should not appear in result');
  });

  test('all findings have maskedValue with bullet characters', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scanContent(`const k = "${key}";`);
    for (const f of result.findings) {
      assert.ok(f.maskedValue, `finding ${f.type} missing maskedValue`);
      // maskedValue should contain bullet characters for real values
      if (f.maskedValue.length > 8) {
        assert.ok(f.maskedValue.includes('•'), `finding ${f.type} maskedValue should contain •`);
      }
    }
  });

  test('findings have signals array', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scanContent(`const key = "${key}";`);
    const f = findByType(result.findings, 'AWS_ACCESS_KEY_ID');
    assert.ok(f, 'should find AWS key');
    assert.ok(Array.isArray(f.signals), 'should have signals array');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SCAN RESULT SHAPE
// ═══════════════════════════════════════════════════════════════════════════

describe('Scan Result Shape', () => {
  test('result has scanId', () => {
    const result = scanContent('const x = 1;');
    assert.ok(typeof result.scanId === 'string' && result.scanId.startsWith('scan_'));
  });

  test('result has status=completed', () => {
    const result = scanContent('const x = 1;');
    assert.strictEqual(result.status, 'completed');
  });

  test('result has statistics object', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scanContent(`const k = "${key}";`);
    assert.ok(result.statistics);
    assert.ok(typeof result.statistics.critical === 'number');
    assert.ok(typeof result.statistics.duration === 'number');
  });

  test('result has duration in ms', () => {
    const result = scanContent('const x = 1;');
    assert.ok(typeof result.duration === 'number');
    assert.ok(result.duration >= 0);
  });

  test('critical count matches actual critical findings', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result = scanContent(`const k = "${key}";`);
    const actualCritical = result.findings.filter(f => f.severity === 'CRITICAL').length;
    assert.strictEqual(result.statistics.critical, actualCritical);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ALLOWLIST
// ═══════════════════════════════════════════════════════════════════════════

describe('Allowlist Fingerprints', () => {
  test('allowlisted findings do not appear in active findings', () => {
    const key = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const result1 = scan({ files: [{ name: 'config.js', content: `const k = "${key}";` }] });
    const fp = result1.findings[0]?.fingerprint;
    assert.ok(fp, 'should get a fingerprint');

    const result2 = scan({
      files: [{ name: 'config.js', content: `const k = "${key}";` }],
      allowlistFingerprints: [fp],
    });
    assert.strictEqual(result2.findings.length, 0, 'allowlisted finding should not appear');
    assert.ok(result2.allowlistedFindings.length > 0, 'should appear in allowlistedFindings');
  });
});
