import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, unlinkSync } from 'fs';
import { rulesCommand } from '../lib/commands/rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('@secretshield/cli — Rules Pack Commands', () => {
  it('should list installed rule packs and return exit code 0', async () => {
    const code = await rulesCommand('list', '', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should search detection catalog by keyword', async () => {
    const code = await rulesCommand('search', 'aws', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should return error code 1 when searching with empty query', async () => {
    const code = await rulesCommand('search', '');
    assert.strictEqual(code, 1);
  });

  it('should validate a compliant RulePack manifest file', async () => {
    const corePackPath = join(__dirname, '..', '..', 'rules', 'core', 'pack.json');
    const code = await rulesCommand('validate', corePackPath);
    assert.strictEqual(code, 0);
  });

  it('should fail validation on malformed manifest file', async () => {
    const tmpPath = join(__dirname, 'tmp-bad-manifest.json');
    writeFileSync(tmpPath, JSON.stringify({ id: 'bad', name: 'X' }), 'utf8');
    try {
      const code = await rulesCommand('validate', tmpPath);
      assert.strictEqual(code, 1);
    } finally {
      try { unlinkSync(tmpPath); } catch {}
    }
  });

  it('should test a known core rule with synthetic test fixtures', async () => {
    const code = await rulesCommand('test', 'aws-access-key-id', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should fail test command on nonexistent rule ID', async () => {
    const code = await rulesCommand('test', 'nonexistent-fake-rule-12345');
    assert.strictEqual(code, 1);
  });

  it('should retrieve detailed information about a rule pack', async () => {
    const code = await rulesCommand('info', 'core-rules', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should install, lock, update, and remove an optional rule pack', async () => {
    const communityPackPath = join(__dirname, '..', '..', 'rules', 'community', 'pack.json');

    // 1. Install
    const installCode = await rulesCommand('install', communityPackPath);
    assert.strictEqual(installCode, 0);

    // 2. Lock version
    const lockCode = await rulesCommand('lock', 'community-rules', { lock: '1.0.0' });
    assert.strictEqual(lockCode, 0);

    // 3. Update check
    const updateCode = await rulesCommand('update', 'community-rules');
    assert.strictEqual(updateCode, 0);

    // 4. Remove
    const removeCode = await rulesCommand('remove', 'community-rules');
    assert.strictEqual(removeCode, 0);
  });
});
