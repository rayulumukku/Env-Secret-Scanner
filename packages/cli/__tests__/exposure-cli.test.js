import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { exposureCommand, historyCommand, graphCommand } from '../lib/commands/exposure.js';

describe('@secretshield/cli — Exposure Intelligence Commands', () => {
  it('should list exposure clusters with --json and return exit code 0', async () => {
    const code = await exposureCommand('list', '', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should list exposure clusters in human readable format and return exit code 0', async () => {
    const code = await exposureCommand('list', '', {});
    assert.strictEqual(code, 0);
  });

  it('should output exposure graph topology with --json and return exit code 0', async () => {
    const code = await graphCommand({ json: true });
    assert.strictEqual(code, 0);
  });

  it('should output exposure graph topology in human format and return exit code 0', async () => {
    const code = await graphCommand({});
    assert.strictEqual(code, 0);
  });

  it('should fail history command if no fingerprint provided', async () => {
    const code = await historyCommand({});
    assert.strictEqual(code, 1);
  });

  it('should return 404/exit 1 when investigating a non-existent cluster', async () => {
    const code = await exposureCommand('investigate', 'non-existent-fingerprint-12345', { json: true });
    assert.strictEqual(code, 1);
  });
});
