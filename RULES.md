# SecretShield Rule Specification (v1.0)

This document defines the formal declarative schema and security invariants for SecretShield Rule Packs.

---

## 1. Rule Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique rule identifier (e.g. `aws-access-key-id`). 3-64 chars (`[a-z0-9_-]`). |
| `name` | string | Yes | Human-readable name (e.g. `AWS Access Key ID`). |
| `description` | string | Yes | Clear explanation of the token purpose and leak impact. |
| `provider` | string | Yes | Service provider (e.g. `AWS`, `Stripe`, `OpenAI`). |
| `category` | string | Yes | One of: `Cloud`, `AI`, `Source Control`, `Payments`, `Communication`, `Databases`, `Infrastructure`, `CI/CD`, `Authentication`, `Private Keys`, `Tokens`, `Generic Secrets`, `Configuration Secrets`. |
| `severity` | string | Yes | One of: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`. |
| `confidence` | number | No | Default 0-100 score based on pattern specificity. |
| `version` | string | Yes | Semantic version (e.g. `1.0.0`). |
| `author` | string | Yes | Author name or GitHub handle. |
| `license` | string | Yes | SPDX license identifier (e.g. `Apache-2.0` or `MIT`). |
| `patterns` | array | Yes | Array of safe regular expressions (max 1000 chars per pattern). |
| `keywords` | array | No | Substring anchors used for high-speed AST indexing. |
| `testFixtures` | object | Yes | `{ positive: string[], negative: string[] }` containing synthetic samples. |

---

## 2. RulePack Manifest Schema

```json
{
  "id": "community-rules",
  "name": "Community Verified Rule Pack",
  "version": "1.0.0",
  "description": "Verified detection rules for third-party developer platforms.",
  "author": "SecretShield Open Source Community",
  "license": "MIT",
  "minimumScannerVersion": "1.0.0",
  "integrity": "sha256-...",
  "rules": []
}
```

---

## 3. Precedence Hierarchy

1. **Tier 1**: Core First-Party Rules
2. **Tier 2**: Organization Rule Packs
3. **Tier 3**: Project-Scoped Rules
4. **Tier 4**: Repository Specific Rules
5. **Tier 5**: Local Custom / Lab Rules

Overlapping matches are resolved in tier order. The higher precedence finding wins, preventing duplicate alerts for the same underlying secret.
