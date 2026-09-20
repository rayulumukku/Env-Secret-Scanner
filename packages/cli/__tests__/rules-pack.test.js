import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
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

  it('should validate a compliant RulePack manifest file', async () => {
    const corePackPath = join(__dirname, '..', '..', 'rules', 'core', 'pack.json');
    const code = await rulesCommand('validate', corePackPath);
    assert.strictEqual(code, 0);
  });

  it('should test a known core rule with synthetic test fixtures', async () => {
    const code = await rulesCommand('test', 'aws-access-key-id', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should retrieve detailed information about a rule pack', async () => {
    const code = await rulesCommand('info', 'core-rules', { json: true });
    assert.strictEqual(code, 0);
  });
});
