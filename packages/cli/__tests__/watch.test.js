/**
 * packages/cli/__tests__/watch.test.js
 *
 * Unit tests for CLI watch and dev commands.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { devCommand } from '../lib/commands/watch.js';

describe('@secretshield/cli — Watch & Dev Commands', () => {
  it('should output dev environment status with --json and return exit code 0', async () => {
    const code = await devCommand('.', { json: true });
    assert.strictEqual(code, 0);
  });
});
