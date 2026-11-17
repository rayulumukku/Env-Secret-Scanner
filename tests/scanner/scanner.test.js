import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  scan,
  shannonEntropy,
  maskSecret,
  isPlaceholder,
  ALL_RULES,
  runBenchmark,
} from '../../packages/scanner/src/index.js';

describe('Secret Detection Engine', () => {
  it('detects AWS access key ID and masks raw secret immediately', () => {
    const testContent = 'const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";';
    const result = scan({ files: [{ name: 'config.js', content: testContent }] });

    assert.strictEqual(result.findings.length > 0, true, 'Should detect AWS key');
    const finding = result.findings[0];
    assert.strictEqual(finding.ruleId, 'AWS_ACCESS_KEY_ID');
    assert.strictEqual(finding.maskedValue.includes('••••'), true, 'Should mask the key');
    assert.strictEqual(finding.rawValue, undefined, 'Raw value must never be exposed');
  });

  it('detects GitHub Personal Access Tokens', () => {
    const testContent = 'const GITHUB_TOKEN = "ghp_111122223333444455556666777788889999";';
    const result = scan({ files: [{ name: 'auth.js', content: testContent }] });

    assert.strictEqual(result.findings.length > 0, true, 'Should detect GitHub token');
    const finding = result.findings.find(f => f.ruleId === 'GITHUB_PAT_CLASSIC');
    assert.strictEqual(Boolean(finding), true);
    assert.strictEqual(finding.severity, 'CRITICAL');
  });

  it('correctly ignores template placeholders', () => {
    assert.strictEqual(isPlaceholder('changeme'), true);
    assert.strictEqual(isPlaceholder('your_api_key'), true);
    assert.strictEqual(isPlaceholder('<API_KEY>'), true);
    assert.strictEqual(isPlaceholder('placeholder'), true);
  });

  it('calculates Shannon entropy accurately', () => {
    const lowEntropy = shannonEntropy('aaaaaaaaaa');
    const highEntropy = shannonEntropy('gH8#vL9$qP2!wK5*');
    assert.strictEqual(lowEntropy < 1.0, true);
    assert.strictEqual(highEntropy > 3.0, true);
  });

  it('runs synthetic benchmark with clean metrics', async () => {
    const res = await runBenchmark({ fileCount: 50, linesPerFile: 10 });
    assert.strictEqual(res.filesCount, 50);
    assert.strictEqual(res.durationMs >= 0, true);
    assert.strictEqual(res.filesPerSec > 0, true);
  });
});
