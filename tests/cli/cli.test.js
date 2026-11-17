import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const CLI_BIN = fileURLToPath(new URL('../../packages/cli/bin/secretshield.js', import.meta.url));

describe('SecretShield CLI Integration', () => {
  it('displays version 1.0.0', () => {
    const output = execFileSync(process.execPath, [CLI_BIN, '--version'], { encoding: 'utf8' });
    assert.strictEqual(output.trim(), '1.0.0');
  });

  it('runs benchmark command cleanly', () => {
    const output = execFileSync(process.execPath, [CLI_BIN, 'benchmark', '--files', '20'], { encoding: 'utf8' });
    assert.strictEqual(output.includes('Performance Benchmark'), true);
    assert.strictEqual(output.includes('Files:       20'), true);
  });

  it('runs ci command in JSON mode', () => {
    const output = execFileSync(process.execPath, [CLI_BIN, 'ci', '--json'], { encoding: 'utf8' });
    const parsed = JSON.parse(output);
    assert.strictEqual(parsed.tool, 'SecretShield');
    assert.strictEqual(parsed.version, '1.0.0');
    assert.strictEqual(parsed.passed, true);
  });
});
