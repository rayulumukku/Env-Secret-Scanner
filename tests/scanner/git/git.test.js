import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanGitDiff } from '../../../app-src/lib/repository/diff/diff-scanner.js';
import { parseUnifiedDiff } from '../../../app-src/lib/repository/diff/parser.js';

describe('Scanner Regression Suite: Git Diff & History Engine', () => {
  const KEY = 'AKIAIOSFODNN7EXAMPLE';

  it('detects secrets added in unified diff patch', () => {
    const patch = `
diff --git a/app.js b/app.js
index 83db48f..bf269f4 100644
--- a/app.js
+++ b/app.js
@@ -1,3 +1,4 @@
 const express = require('express');
+const awsKey = "${KEY}";
 const app = express();
`;

    const res = scanGitDiff(patch);
    assert.equal(res.status, 'COMPLETED');
    assert.ok(res.findings.length >= 1, 'Secret added in diff was flagged');
    assert.equal(res.findings[0].file, 'app.js');
    assert.equal(res.findings[0].isIntroducedInDiff, true);
  });

  it('does not generate active findings for deleted secret lines in diffs', () => {
    const patch = `
diff --git a/app.js b/app.js
--- a/app.js
+++ b/app.js
@@ -1,4 +1,3 @@
 const express = require('express');
-const awsKey = "${KEY}";
 const app = express();
`;

    const res = scanGitDiff(patch);
    // Deleted lines should not be flagged as active new findings
    assert.equal(res.findings.length, 0, 'Deleted secret lines should not create active findings');
  });

  it('parses multi-file unified diff structures reliably', () => {
    const multiPatch = `
diff --git a/file1.js b/file1.js
--- a/file1.js
+++ b/file1.js
@@ -1,2 +1,2 @@
-let a = 1;
+let a = 2;
diff --git a/file2.js b/file2.js
--- a/file2.js
+++ b/file2.js
@@ -1,2 +1,2 @@
+const key = "${KEY}";
`;

    const parsed = parseUnifiedDiff(multiPatch);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].newPath, 'file1.js');
    assert.equal(parsed[1].newPath, 'file2.js');

    const res = scanGitDiff(multiPatch);
    assert.equal(res.findings.length, 1);
    assert.equal(res.findings[0].file, 'file2.js');
  });
});

