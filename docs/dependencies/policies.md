# Dependency Policy Rules & CI/CD Gates

SecretShield integrates supply-chain intelligence into the central policy engine.

## Policy Conditions

| Condition Field | Supported Operators | Example Values |
| :--- | :--- | :--- |
| `packageLicense` | `EQUALS`, `IN`, `NOT_IN` | `"GPL-3.0"`, `["AGPL-3.0", "GPL-3.0"]` |
| `packageLicenseDisallowed` | `EQUALS` | `true`, `false` |
| `dependencyVulnerabilitySeverity` | `EQUALS`, `IN`, `GREATER_THAN_OR_EQUAL` | `"CRITICAL"`, `"HIGH"` |
| `criticalVulnerabilityExists` | `EQUALS` | `true`, `false` |
| `dependencyIsDeprecated` | `EQUALS` | `true`, `false` |
| `hasSuspiciousSignal` | `EQUALS` | `true`, `false` |

## Supported Policy Actions

- `REQUIRE_REVIEW`: Prompts human approval for licenses or updates.
- `FAIL_CI`: Exits CI with code 1 upon unsuppressed vulnerabilities.
- `BLOCK_DEPLOYMENT`: Blocks pre-deployment gate when critical supply-chain findings exist.
- `CREATE_ADVISORY`: Emits informational security notifications.

## Example Policy Configuration

```json
{
  "name": "Disallow Strong Copyleft Licenses in Production",
  "scope": "ORGANIZATION",
  "conditions": [
    {
      "field": "packageLicenseDisallowed",
      "operator": "EQUALS",
      "value": true
    }
  ],
  "actions": ["REQUIRE_REVIEW", "FAIL_PR"]
}
```
