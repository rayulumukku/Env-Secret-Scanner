/**
 * __tests__/config.test.js
 *
 * Configuration loading and validation tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

import { loadConfig, meetsThreshold, generateSampleConfig, DEFAULT_CONFIG } from '../lib/config.js';

function tmpFile(name, content) {
  const path = join(tmpdir(), `secretshield-config-test-${name}-${Date.now()}.json`);
  writeFileSync(path, content, 'utf8');
  return path;
}
function cleanup(p) { try { if (existsSync(p)) unlinkSync(p); } catch {} }

// ── LOAD CONFIG ───────────────────────────────────────────────────────────────

describe('loadConfig', () => {
  test('returns defaults when no config file exists', () => {
    const { config, source } = loadConfig(null, '/nonexistent/dir');
    assert.strictEqual(config.severityThreshold, 'low');
    assert.deepStrictEqual(config.ignore, []);
    assert.strictEqual(source, 'defaults');
  });

  test('loads valid config file', () => {
    const file = tmpFile('valid', JSON.stringify({
      severityThreshold: 'high',
      ignore: ['fixtures/**'],
    }));
    try {
      const { config, source } = loadConfig(file);
      assert.strictEqual(config.severityThreshold, 'high');
      assert.deepStrictEqual(config.ignore, ['fixtures/**']);
      assert.strictEqual(source, file);
    } finally {
      cleanup(file);
    }
  });

  test('rejects invalid severityThreshold', () => {
    const file = tmpFile('invalid-sev', JSON.stringify({ severityThreshold: 'extreme' }));
    try {
      const { config, warnings } = loadConfig(file);
      assert.strictEqual(config.severityThreshold, 'low'); // fallback to default
      assert.ok(warnings.some(w => w.includes('severityThreshold')));
    } finally {
      cleanup(file);
    }
  });

  test('rejects shell-injectable ignore patterns', () => {
    const file = tmpFile('dangerous-ignore', JSON.stringify({
      ignore: ['safe/**', 'evil; rm -rf /', '$(cat /etc/passwd)', '`whoami`'],
    }));
    try {
      const { config, warnings } = loadConfig(file);
      assert.deepStrictEqual(config.ignore, ['safe/**']);
      assert.ok(warnings.length > 0, 'Should warn about unsafe patterns');
    } finally {
      cleanup(file);
    }
  });

  test('rejects invalid rule keys', () => {
    const file = tmpFile('bad-rules', JSON.stringify({
      rules: {
        'valid-rule': true,
        '../../../etc/passwd': true,  // invalid key
        'UPPERCASE-RULE': true,       // invalid key
      },
    }));
    try {
      const { config } = loadConfig(file);
      assert.ok('valid-rule' in config.rules);
      assert.ok(!('../../../etc/passwd' in config.rules));
    } finally {
      cleanup(file);
    }
  });

  test('caps maxFileSize at 50MB', () => {
    const file = tmpFile('huge-size', JSON.stringify({
      scan: { maxFileSize: 1000 * 1024 * 1024 }, // 1 GB attempt
    }));
    try {
      const { config } = loadConfig(file);
      assert.ok(config.scan.maxFileSize <= 50 * 1024 * 1024);
    } finally {
      cleanup(file);
    }
  });

  test('handles malformed JSON gracefully', () => {
    const file = tmpFile('bad-json', '{ this is not json');
    try {
      const { config, source, warnings } = loadConfig(file);
      assert.strictEqual(source, 'defaults');
      assert.ok(warnings.length > 0);
    } finally {
      cleanup(file);
    }
  });
});

// ── MEETS THRESHOLD ───────────────────────────────────────────────────────────

describe('meetsThreshold', () => {
  test('CRITICAL >= low', () => assert.ok(meetsThreshold('CRITICAL', 'low')));
  test('CRITICAL >= medium', () => assert.ok(meetsThreshold('CRITICAL', 'medium')));
  test('CRITICAL >= high', () => assert.ok(meetsThreshold('CRITICAL', 'high')));
  test('CRITICAL >= critical', () => assert.ok(meetsThreshold('CRITICAL', 'critical')));

  test('HIGH >= low', () => assert.ok(meetsThreshold('HIGH', 'low')));
  test('HIGH >= medium', () => assert.ok(meetsThreshold('HIGH', 'medium')));
  test('HIGH >= high', () => assert.ok(meetsThreshold('HIGH', 'high')));
  test('HIGH < critical', () => assert.ok(!meetsThreshold('HIGH', 'critical')));

  test('MEDIUM >= low', () => assert.ok(meetsThreshold('MEDIUM', 'low')));
  test('MEDIUM >= medium', () => assert.ok(meetsThreshold('MEDIUM', 'medium')));
  test('MEDIUM < high', () => assert.ok(!meetsThreshold('MEDIUM', 'high')));
  test('MEDIUM < critical', () => assert.ok(!meetsThreshold('MEDIUM', 'critical')));

  test('LOW >= low', () => assert.ok(meetsThreshold('LOW', 'low')));
  test('LOW < medium', () => assert.ok(!meetsThreshold('LOW', 'medium')));
});

// ── GENERATE SAMPLE CONFIG ────────────────────────────────────────────────────

describe('generateSampleConfig', () => {
  test('produces valid JSON', () => {
    const raw = generateSampleConfig();
    assert.doesNotThrow(() => JSON.parse(raw));
  });

  test('includes required fields', () => {
    const cfg = JSON.parse(generateSampleConfig());
    assert.ok('severityThreshold' in cfg);
    assert.ok('ignore'            in cfg);
    assert.ok('rules'             in cfg);
    assert.ok('scan'              in cfg);
  });

  test('respects severity override', () => {
    const cfg = JSON.parse(generateSampleConfig({ severityThreshold: 'critical' }));
    assert.strictEqual(cfg.severityThreshold, 'critical');
  });
});
