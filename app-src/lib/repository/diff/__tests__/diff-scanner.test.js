/**
 * @file diff-scanner.test.js
 * @description Unit tests for Git Diff Engine & Diff Scanner
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseUnifiedDiff } from '../parser.js';
import { getChangedFiles, filterScannableFiles } from '../changed-files.js';
import { getChangedLinesByFile } from '../changed-lines.js';
import { scanGitDiff } from '../diff-scanner.js';

describe('Git Diff Engine', () => {
  const sampleDiff = `
diff --git a/src/config.js b/src/config.js
index e69de29..d95f3ad 100644
--- a/src/config.js
+++ b/src/config.js
@@ -1,3 +1,5 @@
 const env = process.env.NODE_ENV || 'development';
-const oldKey = "old_dummy_value";
+const awsKey = "AKIAIOSFODNN7EXAMPLE";
+const region = "us-east-1";
 export default { env, region };
diff --git a/deleted-file.js b/deleted-file.js
deleted file mode 100644
index d95f3ad..0000000
--- a/deleted-file.js
+++ /dev/null
@@ -1,2 +0,0 @@
-const deletedKey = "AKIAIOSFODNN7EXAMPLE";
diff --git a/docs/logo.png b/docs/logo.png
new file mode 100644
index 0000000..d95f3ad
Binary files /dev/null and b/docs/logo.png differ
`;

  it('parseUnifiedDiff parses additions, deletions, and binary files', () => {
    const files = parseUnifiedDiff(sampleDiff);
    assert.strictEqual(files.length, 3);

    const config = files[0];
    assert.strictEqual(config.oldPath, 'src/config.js');
    assert.strictEqual(config.newPath, 'src/config.js');
    assert.strictEqual(config.status, 'MODIFIED');
    assert.strictEqual(config.addedLines.length, 2);

    const deleted = files[1];
    assert.strictEqual(deleted.status, 'DELETED');
  });

  it('getChangedFiles accurately summarizes changes and flags binary', () => {
    const summary = getChangedFiles(sampleDiff);
    assert.strictEqual(summary.length, 3);

    const config = summary.find(s => s.filePath === 'src/config.js');
    assert.ok(config);
    assert.strictEqual(config.additions, 2);
    assert.strictEqual(config.deletions, 1);
    assert.strictEqual(config.isBinary, false);

    const binary = summary.find(s => s.filePath === 'docs/logo.png');
    assert.ok(binary);
    assert.strictEqual(binary.isBinary, true);

    const scannable = filterScannableFiles(summary);
    assert.strictEqual(scannable.length, 1);
    assert.strictEqual(scannable[0].filePath, 'src/config.js');
  });

  it('getChangedLinesByFile indexes added lines with correct 1-based line numbers', () => {
    const linesMap = getChangedLinesByFile(sampleDiff);
    const configLines = linesMap.get('src/config.js');
    assert.ok(configLines);
    assert.strictEqual(configLines.length, 2);
    assert.strictEqual(configLines[0].line, 2);
    assert.match(configLines[0].content, /AKIAIOSFODNN7EXAMPLE/);
    assert.strictEqual(configLines[1].line, 3);
  });

  it('scanGitDiff detects secret in added lines and attributes line number', () => {
    const result = scanGitDiff(sampleDiff);

    assert.strictEqual(result.status, 'COMPLETED');
    assert.strictEqual(result.filesChanged, 3);
    assert.strictEqual(result.filesScanned, 1);
    assert.strictEqual(result.findings.length, 1);

    const finding = result.findings[0];
    assert.strictEqual(finding.ruleId, 'AWS_ACCESS_KEY_ID');
    assert.strictEqual(finding.severity, 'CRITICAL');
    assert.strictEqual(finding.file, 'src/config.js');
    assert.strictEqual(finding.line, 2);
    assert.match(finding.maskedValue, /AKIA/);
    assert.strictEqual(finding.isIntroducedInDiff, true);
    assert.ok(result.ruleVersion);
    assert.ok(result.scannerVersion);
  });

  it('scanGitDiff does not flag secrets in deleted files/lines', () => {
    const deletedDiff = `
diff --git a/legacy.js b/legacy.js
deleted file mode 100644
--- a/legacy.js
+++ /dev/null
@@ -1,2 +0,0 @@
-const awsKey = "AKIAIOSFODNN7EXAMPLE";
`;
    const result = scanGitDiff(deletedDiff);
    assert.strictEqual(result.findings.length, 0);
  });

  it('scanGitDiff passes on clean diff', () => {
    const cleanDiff = `
diff --git a/src/math.js b/src/math.js
--- a/src/math.js
+++ b/src/math.js
@@ -1,2 +1,3 @@
+export function add(a, b) { return a + b; }
`;
    const result = scanGitDiff(cleanDiff);
    assert.strictEqual(result.findings.length, 0);
    assert.strictEqual(result.statistics.total, 0);
  });
});
