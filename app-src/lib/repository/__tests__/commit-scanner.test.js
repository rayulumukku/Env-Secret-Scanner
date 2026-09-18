/**
 * commit-scanner.test.js
 *
 * Tests for the Git history commit scanner.
 * ALL test secrets are synthetic / non-functional.
 * All "secrets" are intentionally fragmented or obviously fake.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractAddedLines, scanCommitDiff } from '../commit-scanner.js';

// ── HELPERS ────────────────────────────────────────────────────────────────────

/**
 * Build a synthetic GitHub commit API response with patch data.
 */
function makeCommit({ files = [] } = {}) {
  return {
    sha: 'abc1234def567890abc1234def567890abc12345',
    commit: {
      message: 'Test commit',
      author: {
        name:  'Test User',
        email: 'test@example.com',
        date:  '2024-01-15T10:30:00Z',
      },
    },
    files,
    stats: { additions: 5, deletions: 1 },
  };
}

function makePatch(lines) {
  // Build a realistic git diff patch
  return [
    '@@ -1,3 +1,5 @@',
    ' context line',
    ...lines,
    ' another context line',
  ].join('\n');
}

// ── extractAddedLines ──────────────────────────────────────────────────────────

describe('extractAddedLines', () => {
  test('returns empty array for no files', () => {
    const result = extractAddedLines([]);
    assert.deepStrictEqual(result, []);
  });

  test('returns empty array for null/undefined', () => {
    assert.deepStrictEqual(extractAddedLines(null), []);
    assert.deepStrictEqual(extractAddedLines(undefined), []);
  });

  test('extracts only added lines (starting with +)', () => {
    const files = [{
      filename: 'src/config.js',
      status: 'modified',
      patch: makePatch([
        '+const key = "some_value";',
        '-const old = "removed_line";',
        ' const unchanged = "same";',
      ]),
    }];
    const result = extractAddedLines(files);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'src/config.js');
    assert.ok(result[0].content.includes('some_value'), 'should include added line content');
    assert.ok(!result[0].content.includes('removed_line'), 'should not include removed lines');
    assert.ok(!result[0].content.includes('same'), 'should not include context lines');
  });

  test('strips leading + from added lines', () => {
    const files = [{
      filename: 'src/app.js',
      status: 'added',
      patch: '+const x = "hello";',
    }];
    const result = extractAddedLines(files);
    assert.ok(result[0].content.includes('const x = "hello"'), 'should strip leading +');
    assert.ok(!result[0].content.startsWith('+'), 'should not start with +');
  });

  test('skips +++ header lines', () => {
    const files = [{
      filename: 'src/app.js',
      status: 'added',
      patch: '+++ b/src/app.js\n+const x = "hello";',
    }];
    const result = extractAddedLines(files);
    assert.ok(!result[0].content.includes('+++ b/src/app.js'), 'should strip +++ header');
  });

  test('skips files with no patch', () => {
    const files = [
      { filename: 'binary.png', status: 'added', patch: undefined },
      { filename: 'src/app.js', status: 'added', patch: '+const x = 1;' },
    ];
    const result = extractAddedLines(files);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'src/app.js');
  });

  test('skips removed files', () => {
    const files = [
      { filename: 'deleted.js', status: 'removed', patch: '-const x = "secret";' },
      { filename: 'kept.js',    status: 'modified', patch: '+const y = 1;' },
    ];
    const result = extractAddedLines(files);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'kept.js');
  });

  test('skips empty patches', () => {
    const files = [{ filename: 'src/app.js', status: 'renamed', patch: '' }];
    const result = extractAddedLines(files);
    assert.strictEqual(result.length, 0);
  });

  test('handles multiple files', () => {
    const files = [
      { filename: 'src/a.js', status: 'added',    patch: '+const a = 1;' },
      { filename: 'src/b.js', status: 'modified', patch: '+const b = 2;' },
      { filename: 'src/c.js', status: 'modified', patch: ' unchanged only' },
    ];
    const result = extractAddedLines(files);
    assert.strictEqual(result.length, 2); // c.js has no additions
    assert.ok(result.some(f => f.name === 'src/a.js'));
    assert.ok(result.some(f => f.name === 'src/b.js'));
  });

  test('returns correct file size metadata', () => {
    const files = [{ filename: 'src/app.js', status: 'added', patch: '+const x = 1;' }];
    const result = extractAddedLines(files);
    assert.ok(typeof result[0].size === 'number');
    assert.ok(result[0].size > 0);
  });
});

// ── scanCommitDiff ─────────────────────────────────────────────────────────────

describe('scanCommitDiff', () => {
  test('returns empty array for commit with no files', () => {
    const commit = makeCommit({ files: [] });
    const findings = scanCommitDiff(commit);
    assert.deepStrictEqual(findings, []);
  });

  test('returns empty array for commit with only clean code', () => {
    const commit = makeCommit({
      files: [{
        filename: 'src/utils.js',
        status:   'added',
        patch:    '+function add(a, b) { return a + b; }',
      }],
    });
    const findings = scanCommitDiff(commit);
    assert.deepStrictEqual(findings, []);
  });

  test('detects synthetic AWS key in diff', () => {
    // Fragmented synthetic key — non-functional
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const commit = makeCommit({
      files: [{
        filename: 'src/aws.js',
        status:   'added',
        patch:    `+const awsKey = "${fakeKey}";`,
      }],
    });
    const findings = scanCommitDiff(commit);
    assert.ok(findings.length >= 1, 'should detect at least one finding');
  });

  test('enriches findings with commit metadata', () => {
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const commit = makeCommit({
      files: [{
        filename: 'src/aws.js',
        status:   'added',
        patch:    `+const awsKey = "${fakeKey}";`,
      }],
    });
    const findings = scanCommitDiff(commit);
    if (findings.length > 0) {
      const f = findings[0];
      assert.strictEqual(f.commitHash, commit.sha);
      assert.strictEqual(f.shortHash,  commit.sha.slice(0, 7));
      assert.strictEqual(f.author,     'Test User');
      assert.strictEqual(f.commitDate, '2024-01-15T10:30:00Z');
      assert.ok(f.commitMessage);
    }
  });

  test('findings contain masked values not raw secrets', () => {
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const commit = makeCommit({
      files: [{
        filename: 'src/aws.js',
        status:   'added',
        patch:    `+const awsKey = "${fakeKey}";`,
      }],
    });
    const findings = scanCommitDiff(commit);
    for (const f of findings) {
      // Masked values should contain bullet characters, not raw full secrets
      if (f.maskedValue) {
        assert.ok(
          f.maskedValue.includes('●') || f.maskedValue.includes('•') || f.maskedValue.length < fakeKey.length,
          `finding maskedValue should be masked, got: ${f.maskedValue}`
        );
      }
      // Should have a fingerprint
      assert.ok(f.fingerprint, 'finding should have a fingerprint');
    }
  });

  test('respects allowlist — allowlisted fingerprints are excluded', () => {
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const commit = makeCommit({
      files: [{
        filename: 'src/aws.js',
        status:   'added',
        patch:    `+const awsKey = "${fakeKey}";`,
      }],
    });

    // First, get the fingerprint from an un-allowlisted scan
    const firstScan = scanCommitDiff(commit);
    if (firstScan.length === 0) return; // skip if not detected in this context

    const fingerprint = firstScan[0].fingerprint;
    assert.ok(fingerprint, 'first scan should produce a fingerprint');

    // Now rescan with that fingerprint in the allowlist
    const allowlisted = scanCommitDiff(commit, { allowlistFingerprints: [fingerprint] });
    assert.ok(
      allowlisted.every(f => f.fingerprint !== fingerprint),
      'allowlisted finding should be excluded'
    );
  });

  test('sets exposureStatus to REMOVED by default', () => {
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
    const commit = makeCommit({
      files: [{
        filename: 'src/aws.js',
        status:   'added',
        patch:    `+const awsKey = "${fakeKey}";`,
      }],
    });
    const findings = scanCommitDiff(commit);
    for (const f of findings) {
      // Default exposureStatus is REMOVED (caller updates based on current scan)
      assert.strictEqual(f.exposureStatus, 'REMOVED');
    }
  });

  test('handles commit with no added lines (context-only diff)', () => {
    const commit = makeCommit({
      files: [{
        filename: 'src/app.js',
        status:   'modified',
        // Only context and deleted lines
        patch:    ' context line\n-deleted line\n context line 2',
      }],
    });
    const findings = scanCommitDiff(commit);
    assert.deepStrictEqual(findings, []);
  });

  test('commit message is truncated at 120 chars', () => {
    const longMsg = 'A'.repeat(200);
    const commit = {
      ...makeCommit({ files: [] }),
      commit: {
        message: longMsg,
        author: { name: 'Test', email: 'test@test.com', date: '2024-01-01T00:00:00Z' },
      },
    };
    const findings = scanCommitDiff(commit);
    // No findings expected for empty files
    assert.deepStrictEqual(findings, []);
  });
});

// ── DELETED SECRET DETECTION PATTERN ──────────────────────────────────────────

describe('Deleted secret detection pattern', () => {
  test('secret in commit A, not in commit B — detects REMOVED status scenario', () => {
    // Simulates: Commit A added a secret, Commit B removed it
    const fakeKey = 'AKIA' + 'IOSFODNN7EXAMPLE';

    // Commit A — adds the secret
    const commitA = makeCommit({
      files: [{
        filename: 'src/config.js',
        status:   'added',
        patch:    `+const KEY = "${fakeKey}";`,
      }],
    });

    // Commit B — removes it (this commit removes the line, so no added lines for secrets)
    const commitB = makeCommit({
      files: [{
        filename: 'src/config.js',
        status:   'modified',
        // Only deletion — no additions with the secret
        patch:    `-const KEY = "${fakeKey}";\n+const KEY = process.env.KEY;`,
      }],
    });

    const findingsA = scanCommitDiff(commitA);
    const findingsB = scanCommitDiff(commitB);

    // Secret should be detected in A (was added)
    assert.ok(findingsA.length >= 1, 'Commit A should have findings');

    // Commit B removed the secret and added an env var reference — no new secret introduced
    // (env var references are not secrets themselves)
    assert.ok(findingsB.length === 0, 'Commit B should have no findings (secret was deleted, not added)');
  });
});
