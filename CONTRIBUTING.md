# Contributing to SecretShield

Thank you for your interest in making SecretShield better! We welcome contributions from developers of all backgrounds.

---

## Contributing Detection Rules

SecretShield rules are **100% declarative JSON**. You do not need to understand scanner internals or write JavaScript execution logic to add a new secret detector.

### Step 1: Create a Rule JSON

Add your rule definition into `packages/rules/community/pack.json` or create a standalone rule JSON file following [`RULES.md`](./RULES.md):

```json
{
  "id": "datadog-api-key",
  "name": "Datadog API Key",
  "description": "32-character hexadecimal Datadog API authentication token",
  "provider": "Datadog",
  "category": "Cloud",
  "severity": "CRITICAL",
  "confidence": 96,
  "version": "1.0.0",
  "author": "your-github-handle",
  "license": "MIT",
  "documentationUrl": "https://docs.datadoghq.com/account_management/api-app-keys/",
  "patterns": [
    "(?:datadog_api_key|dd_api_key)\\s*[:=]\\s*['\"]?[a-f0-9]{32}['\"]?"
  ],
  "keywords": ["datadog_api_key", "dd_api_key"],
  "testFixtures": {
    "positive": [
      "DATADOG_API_KEY=11112222333344445555666677778888"
    ],
    "negative": [
      "DATADOG_API_KEY=placeholder_dummy"
    ]
  }
}
```

### Step 2: Validate Your Rule

Run the built-in CLI validator:

```bash
node packages/cli/bin/secretshield.js rules validate ./my-rule.json
```

### Step 3: Run Fixture Quality Tests

Verify that positive fixtures match and negative fixtures pass:

```bash
node packages/cli/bin/secretshield.js rules test ./my-rule.json
```

### Step 4: Security Invariants Checklist

- [ ] **NO real secrets**: Test fixtures must use obvious dummy placeholders (e.g. `111122223333...` or `xxxx`).
- [ ] **NO ReDoS constructs**: No nested quantifiers `(a+)+` or catastrophic backtracking patterns.
- [ ] **At least 2 negative fixtures**: Prevent false positives on mock variables or template strings.
- [ ] **Pattern length < 1000 characters**: Keep regular expressions clean, bounded, and auditable.

---

## Running Workspace Tests

```bash
# Run all workspace test suites
npm test

# Run Next.js production build check
npm run build:web
```
