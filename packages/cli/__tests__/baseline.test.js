/**
 * __tests__/baseline.test.js
 *
 * Baseline management tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlinkSync, existsSync, readFileSync } from 'fs';

import {
  createBaselineFromFindings,
  filterAgainstBaseline,
  loadBaseline,
  saveBaseline,
  removeFingerprint,
} from '../lib/baseline.js';

// ── HELPERS ───────────────────────────────────────────────────────────────────

function tmpFile(name) {
  return join(tmpdir(), `secretshield-test-${name}-${Date.now()}.json`);
}

function cleanup(path) {
  try { if (existsSync(path)) unlinkSync(path); } catch { /* ignore */ }
}

function fakeFinding(overrides = {}) {
  return {
    fingerprint: 'aabbccdd11223344aabbccdd11223344',
    type:        'AWS_ACCESS_KEY_ID',
    severity:    'CRITICAL',
    file:        'src/config.js',
    description: 'AWS key detected',
    maskedValue: 'AKIA••••••••••••••••',
    ...overrides,
  };
}

// ── TESTS ─────────────────────────────────────────────────────────────────────

describe('createBaselineFromFindings', () => {
  test('creates entries from findings', () => {
    const findings = [fakeFinding()];
    const entries  = createBaselineFromFindings(findings);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].fingerprint, 'aabbccdd11223344aabbccdd11223344');
  });

  test('deduplicates same fingerprint', () => {
    const findings = [fakeFinding(), fakeFinding()]; // same fingerprint
    const entries  = createBaselineFromFindings(findings);
    assert.strictEqual(entries.length, 1);
  });

  test('skips findings with no fingerprint', () => {
    const findings = [fakeFinding({ fingerprint: null })];
    const entries  = createBaselineFromFindings(findings);
    assert.strictEqual(entries.length, 0);
  });

  test('skips findings with invalid fingerprint', () => {
    const findings = [fakeFinding({ fingerprint: '../../../etc/passwd' })];
    const entries  = createBaselineFromFindings(findings);
    assert.strictEqual(entries.length, 0);
  });

  test('stores type, severity, file', () => {
    const entries = createBaselineFromFindings([fakeFinding()]);
    assert.strictEqual(entries[0].type,     'AWS_ACCESS_KEY_ID');
    assert.strictEqual(entries[0].severity, 'CRITICAL');
    assert.strictEqual(entries[0].file,     'src/config.js');
  });

  test('never stores rawValue or maskedValue as fingerprint', () => {
    const entries = createBaselineFromFindings([fakeFinding()]);
    for (const e of entries) {
      assert.ok(!e.rawValue,    'must not store rawValue');
      assert.ok(!e.maskedValue, 'must not store maskedValue');
    }
  });
});

describe('filterAgainstBaseline', () => {
  test('returns all findings when baseline is empty', () => {
    const findings = [fakeFinding()];
    const { active, suppressed } = filterAgainstBaseline(findings, new Set());
    assert.strictEqual(active.length, 1);
    assert.strictEqual(suppressed, 0);
  });

  test('suppresses matching fingerprint', () => {
    const findings = [fakeFinding()];
    const baseline = new Set(['aabbccdd11223344aabbccdd11223344']);
    const { active, suppressed } = filterAgainstBaseline(findings, baseline);
    assert.strictEqual(active.length, 0);
    assert.strictEqual(suppressed, 1);
  });

  test('does not suppress non-matching fingerprint', () => {
    const findings = [fakeFinding({ fingerprint: 'different1234567890abcdef1234567890abcdef' })];
    const baseline = new Set(['aabbccdd11223344aabbccdd11223344']);
    const { active, suppressed } = filterAgainstBaseline(findings, baseline);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(suppressed, 0);
  });

  test('handles null baseline gracefully', () => {
    const findings = [fakeFinding()];
    const { active, suppressed } = filterAgainstBaseline(findings, null);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(suppressed, 0);
  });

  test('new finding passes when baseline has other entries', () => {
    const baseline  = new Set(['aabbccdd11223344aabbccdd11223344']);
    const newFinding = fakeFinding({ fingerprint: 'new1234567890abcdef1234567890abcdef' });
    const { active } = filterAgainstBaseline([newFinding], baseline);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].fingerprint, 'new1234567890abcdef1234567890abcdef');
  });
});

describe('loadBaseline / saveBaseline', () => {
  test('saves and loads baseline correctly', () => {
    const file = tmpFile('save-load');
    try {
      const entries = createBaselineFromFindings([fakeFinding()]);
      saveBaseline(file, entries);
      const { entries: loaded, fingerprints } = loadBaseline(file);
      assert.strictEqual(loaded.length, 1);
      assert.ok(fingerprints.has('aabbccdd11223344aabbccdd11223344'));
    } finally {
      cleanup(file);
    }
  });

  test('returns empty baseline when file does not exist', () => {
    const { entries, fingerprints, source } = loadBaseline('/nonexistent/path.json');
    assert.strictEqual(entries.length, 0);
    assert.strictEqual(source, null);
  });

  test('saved baseline has _note about no raw secrets', () => {
    const file = tmpFile('note');
    try {
      saveBaseline(file, createBaselineFromFindings([fakeFinding()]));
      const content = JSON.parse(readFileSync(file, 'utf8'));
      assert.ok(content._note?.includes('fingerprints only'));
    } finally {
      cleanup(file);
    }
  });
});

describe('removeFingerprint', () => {
  test('removes existing fingerprint', () => {
    const file = tmpFile('remove');
    try {
      const entries = createBaselineFromFindings([
        fakeFinding(),
        fakeFinding({ fingerprint: 'bbbbcccc11223344bbbbcccc11223344' }),
      ]);
      saveBaseline(file, entries);
      const removed = removeFingerprint(file, 'aabbccdd11223344aabbccdd11223344');
      assert.ok(removed);
      const { fingerprints } = loadBaseline(file);
      assert.ok(!fingerprints.has('aabbccdd11223344aabbccdd11223344'));
      assert.ok(fingerprints.has('bbbbcccc11223344bbbbcccc11223344'));
    } finally {
      cleanup(file);
    }
  });

  test('returns false when fingerprint not found', () => {
    const file = tmpFile('remove-miss');
    try {
      saveBaseline(file, createBaselineFromFindings([fakeFinding()]));
      const removed = removeFingerprint(file, 'deadbeef12345678deadbeef12345678');
      assert.ok(!removed);
    } finally {
      cleanup(file);
    }
  });

  test('throws on invalid fingerprint format', () => {
    assert.throws(() => {
      removeFingerprint('/any/file.json', '../../../etc/passwd');
    }, /Invalid fingerprint format/);
  });

  test('throws on shell-injection attempt in fingerprint', () => {
    assert.throws(() => {
      removeFingerprint('/any/file.json', 'abc; rm -rf /');
    }, /Invalid fingerprint format/);
  });
});
