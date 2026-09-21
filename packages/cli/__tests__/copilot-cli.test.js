/**
 * packages/cli/__tests__/copilot-cli.test.js
 *
 * Unit tests for SecretShield Copilot CLI commands.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  explainCommand,
  whyCommand,
  fixCommand,
  explainCommitCommand,
  copilotCommand
} from '../lib/commands/copilot.js';

describe('@secretshield/cli — Copilot Commands', () => {
  it('should run explain command with JSON output', async () => {
    const code = await explainCommand('AWS_ACCESS_KEY', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should run why command with JSON output', async () => {
    const code = await whyCommand('AWS_ACCESS_KEY', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should run fix command in dry-run mode', async () => {
    const code = await fixCommand('AWS_ACCESS_KEY', { json: true, apply: false });
    assert.strictEqual(code, 0);
  });

  it('should run explain-commit command', async () => {
    const code = await explainCommitCommand('HEAD', { json: true });
    assert.strictEqual(code, 0);
  });

  it('should query copilot offline in local deterministic mode', async () => {
    const code = await copilotCommand({ json: true, query: 'How do I fix findings?' });
    assert.strictEqual(code, 0);
  });
});
