# @secretshield/scanner

> High-speed deterministic secret scanner and entropy engine for developer workflows.

`@secretshield/scanner` is a pure JavaScript, zero-dependency secret detection package designed for developer tools, build pipelines, CLI utilities, and IDE extensions.

---

## Key Features

- **10+ Detection Rule Engines**: AWS, GitHub, Stripe, OpenAI, Slack, Google Cloud, Private Keys (RSA/EC/OpenSSH), Database Connection Strings, JWTs, and Generic Auth tokens.
- **Shannon Entropy Engine**: Identifies unstructured high-entropy credentials.
- **Deterministic & Local**: Pure in-memory execution. **Zero AI API calls**, zero network dependencies, 100% offline.
- **Privacy Guaranteed**: Raw secrets are immediately masked into fingerprints and are **never returned in response objects**.
- **ReDoS Protected**: Regex patterns are analyzed for catastrophic backtracking vulnerabilities before execution.

---

## Installation

```bash
npm install @secretshield/scanner
```

---

## Quickstart

### 1. Scan Text Content

```javascript
import { scanText } from '@secretshield/scanner';

const sourceCode = `
// Synthetic mock demo code
export const config = {
  region: "us-east-1",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE"
};
`;

const result = await scanText(sourceCode, { filename: 'config.js' });

console.log(`Findings detected: ${result.findings.length}`);
for (const finding of result.findings) {
  console.log(`[${finding.severity}] ${finding.ruleName} on line ${finding.line}`);
  console.log(`Masked Value: ${finding.maskedValue}`);
  console.log(`Why detected: ${finding.whyDetected}`);
}
```

### 2. Scan a Single File

```javascript
import { scanFile } from '@secretshield/scanner';

const result = await scanFile('./src/app.js');
```

### 3. Scan a Directory

```javascript
import { scanDirectory } from '@secretshield/scanner';

const result = await scanDirectory('./src', {
  ignorePatterns: ['node_modules', 'dist', '*.test.js'],
  maxFileSize: 5 * 1024 * 1024,
});
```

### 4. Scan Git Diffs

```javascript
import { scanGitDiff } from '@secretshield/scanner';

const diffOutput = `
diff --git a/server.js b/server.js
--- a/server.js
+++ b/server.js
@@ -10,1 +10,2 @@
+const API_KEY = "AKIAIOSFODNN7EXAMPLE";
`;

const result = await scanGitDiff(diffOutput);
```

---

## API Reference

### `scanText(content, options)`
- `content` (`string`): The source text or file content to scan.
- `options` (`object`, optional):
  - `filename` (`string`): Virtual file path for language detection (default `'input.txt'`).
  - `customRules` (`Array<object>`): User-defined regex rules.
  - `allowlistFingerprints` (`string[]`): Suppressed secret fingerprints.

### `scanDirectory(dirPath, options)`
- `dirPath` (`string`): Absolute or relative directory path.
- `options` (`object`, optional):
  - `ignorePatterns` (`string[]`): Substrings or directories to skip.
  - `maxFiles` (`number`): Maximum files to scan (default `5000`).
  - `maxFileSize` (`number`): Maximum single file size in bytes (default `5MB`).

### `scanGitDiff(diffText, options)`
- `diffText` (`string`): Unified diff format string.

---

## Security & Privacy Model

1. **Zero Raw Secret Exposure**: Detected strings are masked in memory (`AKIA••••EXAMPLE`). Raw values are scrubbed immediately.
2. **Local Heuristics**: Shannon entropy, proximity keywords, and syntax context execute in pure Node.js without external cloud telemetry.

---

## License

MIT © SecretShield Contributors
