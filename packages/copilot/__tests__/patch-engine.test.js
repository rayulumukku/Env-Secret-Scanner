/**
 * packages/copilot/__tests__/patch-engine.test.js
 *
 * Tests for deterministic safe patch engine.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  isBinaryFile,
  validateSyntax,
  applyActionToContent,
  validatePatch,
  executePatch,
  rollbackPatch,
  PATCH_BACKUP_STORE
} from '../patch-engine/index.js';

describe('@secretshield/copilot — Patch Engine Invariants', () => {
  it('should identify binary files correctly', () => {
    assert.strictEqual(isBinaryFile('image.png'), true);
    assert.strictEqual(isBinaryFile('binary.exe'), true);
    assert.strictEqual(isBinaryFile('archive.zip'), true);
    assert.strictEqual(isBinaryFile('script.js'), false);
    assert.strictEqual(isBinaryFile('.env'), false);
  });

  it('should validate JSON syntax', () => {
    assert.strictEqual(validateSyntax('package.json', '{"name": "test"}').valid, true);
    assert.strictEqual(validateSyntax('package.json', '{"name": invalid}').valid, false);
  });

  it('should validate JS balanced braces syntax', () => {
    assert.strictEqual(validateSyntax('index.js', 'function test() { return 1; }').valid, true);
    assert.strictEqual(validateSyntax('index.js', 'function test() { return 1;').valid, false);
  });

  it('should apply EXTRACT_ENV_VAR action to text content deterministically', () => {
    const raw = 'const STRIPE_KEY = "' + 'sk_live_' + '1234567890abcdef1234567890";';
    const action = {
      type: 'EXTRACT_ENV_VAR',
      line: 1,
      envAccessor: 'process.env.STRIPE_KEY'
    };

    const res = applyActionToContent(action, raw);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.patchedContent, 'const STRIPE_KEY = process.env.STRIPE_KEY;');
  });

  it('should apply ADD_GITIGNORE action cleanly', () => {
    const gitignore = 'node_modules\n.DS_Store';
    const action = {
      type: 'ADD_GITIGNORE',
      patternToAdd: '.env.local'
    };
    const res = applyActionToContent(action, gitignore);
    assert.strictEqual(res.success, true);
    assert.ok(res.patchedContent.includes('.env.local'));
  });

  it('should apply ADD_SUPPRESSION action cleanly', () => {
    const code = 'const apiKey = "synthetic_key";';
    const action = {
      type: 'ADD_SUPPRESSION',
      line: 1,
      suppressionComment: '// secretshield-ignore GENERIC_SECRET reason="test"'
    };
    const res = applyActionToContent(action, code);
    assert.strictEqual(res.success, true);
    assert.ok(res.patchedContent.startsWith('// secretshield-ignore GENERIC_SECRET'));
  });

  it('should validate that a patch resolves secret finding and does not add new ones', () => {
    const orig = 'const AWS_KEY = "AKIA1234567890ABCDEF";';
    const patched = 'const AWS_KEY = process.env.AWS_KEY;';

    const validation = validatePatch('config.js', orig, patched, { ruleId: 'AWS_ACCESS_KEY', line: 1 });
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.errors.length, 0);
  });

  it('should execute patch in dry-run mode without modifying filesystem', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-patch-dry-'));
    const targetFile = path.join(tmpDir, 'test-app.js');
    fs.writeFileSync(targetFile, 'const key = "AKIA1234567890ABCDEF";', 'utf8');

    const action = {
      type: 'EXTRACT_ENV_VAR',
      targetFile,
      line: 1,
      envAccessor: 'process.env.AWS_KEY'
    };

    const res = executePatch({
      action,
      workspaceRoot: tmpDir,
      dryRun: true
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.dryRun, true);
    assert.strictEqual(res.applied, false);

    // Verify file remains unmodified on disk
    const content = fs.readFileSync(targetFile, 'utf8');
    assert.strictEqual(content, 'const key = "AKIA1234567890ABCDEF";');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should execute patch, backup original, and successfully rollback', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-patch-live-'));
    const targetFile = path.join(tmpDir, 'server.js');
    const originalContent = 'const key = "AKIA1234567890ABCDEF";\n';
    fs.writeFileSync(targetFile, originalContent, 'utf8');

    const action = {
      type: 'EXTRACT_ENV_VAR',
      targetFile,
      line: 1,
      envAccessor: 'process.env.AWS_KEY'
    };

    // Apply patch for real
    const res = executePatch({
      action,
      workspaceRoot: tmpDir,
      dryRun: false
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.applied, true);

    const patchedDiskContent = fs.readFileSync(targetFile, 'utf8');
    assert.ok(patchedDiskContent.includes('process.env.AWS_KEY'));

    // Perform rollback
    const rollbackRes = rollbackPatch(res.patchId);
    assert.strictEqual(rollbackRes.success, true);

    const restoredDiskContent = fs.readFileSync(targetFile, 'utf8');
    assert.strictEqual(restoredDiskContent, originalContent);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
