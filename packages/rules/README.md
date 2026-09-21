# @secretshield/rules — Rule Packs & Detection Ecosystem

This package defines the formal schema, canonical integrity verification, and declarative rule packs for SecretShield.

## Architecture

- **`core/`**: First-party Core Rule Pack covering 13 detection categories.
- **`community/`**: Verified community-contributed rule packs.
- **`enterprise/`**: Compliance and internal infrastructure token rule packs.
- **`test-fixtures/`**: Synthetic positive and negative test fixtures across all 13 categories.
- **`src/`**: Schema validators, ReDoS protection algorithms, and canonical SHA-256 integrity calculator.

## Security Invariants

1. **Zero Executable Code**: Rules are 100% declarative JSON data.
2. **ReDoS Protected**: All regular expressions are validated for catastrophic backtracking.
3. **Canonical SHA-256 Hashes**: Manifests enforce cryptographic integrity to prevent tampering.
4. **Zero Real Secrets**: All fixtures use obviously fake synthetic placeholders.

## Usage

```javascript
import { validateRulePackManifest, verifyPackIntegrity } from '@secretshield/rules';

const validation = validateRulePackManifest(manifest);
if (validation.valid) {
  const integrity = verifyPackIntegrity(manifest);
  console.log('Integrity match:', integrity.valid);
}
```
