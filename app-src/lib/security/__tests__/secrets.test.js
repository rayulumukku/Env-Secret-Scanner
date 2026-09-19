import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  redactSensitiveKeys
} from '../secrets.js';

test('secrets - encrypts and decrypts string using AES-256-GCM correctly', () => {
  const secret = 'ghp_SUPER_SECRET_TOKEN_1234567890';
  const envelope = encryptSecret(secret);

  assert.ok(envelope.ciphertext);
  assert.ok(envelope.iv);
  assert.ok(envelope.authTag);
  assert.equal(envelope.algorithm, 'aes-256-gcm');
  assert.notEqual(envelope.ciphertext, secret);

  const decrypted = decryptSecret(envelope);
  assert.equal(decrypted, secret);
});

test('secrets - fails decryption when ciphertext or authTag is tampered with', () => {
  const secret = 'stripe_sk_live_secret_value_12345';
  const envelope = encryptSecret(secret);

  // Tamper ciphertext
  const tamperedEnvelope = {
    ...envelope,
    ciphertext: envelope.ciphertext.slice(0, -4) + 'abcd'
  };

  assert.throws(() => {
    decryptSecret(tamperedEnvelope);
  });
});

test('secrets - maskSecret masks middle of token while preserving short prefix/suffix', () => {
  assert.equal(maskSecret('ghp_1234567890abcdef'), 'ghp_••••••••cdef');
  assert.equal(maskSecret('short'), '••••••••');
  assert.equal(maskSecret(''), '••••••••');
  assert.equal(maskSecret(null), '••••••••');
});

test('secrets - redactSensitiveKeys recursively sanitizes sensitive keys', () => {
  const obj = {
    name: 'GitHub App',
    token: 'ghp_secret_token_12345',
    nested: {
      apiKey: 'sk_live_stripe_98765',
      repoName: 'backend-api'
    }
  };

  const sanitized = redactSensitiveKeys(obj);
  assert.equal(sanitized.name, 'GitHub App');
  assert.equal(sanitized.token, 'ghp_••••••••2345');
  assert.equal(sanitized.nested.apiKey, 'sk_l••••••••8765');
  assert.equal(sanitized.nested.repoName, 'backend-api');
});
