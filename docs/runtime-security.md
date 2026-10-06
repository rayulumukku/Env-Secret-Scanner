# Runtime Security & Exposure Intelligence

SecretShield Runtime Exposure Intelligence correlates static source findings with active runtime metadata, deployment configurations, and environments without collecting, storing, or using actual credentials.

## Core Security Invariants

1. **Zero Credential Collection or Authentication**: SecretShield never tests whether a detected secret is active by attempting authentication against third-party systems or cloud providers.
2. **Metadata-Only Storage**: Only non-sensitive resource descriptors, deployment logs, environment names, and cryptographic fingerprints are stored.
3. **No Speculative Production Claims**: A secret is never marked as active in production without authoritative configuration evidence or confirmed deployment logs.
4. **Environment Differentiation**: Template files (e.g. `.env.example`, `mock/**`) are explicitly separated from deployment manifests.

## Exposure Classification States

| State | Definition | Authoritative Requirement |
| :--- | :--- | :--- |
| `SOURCE_EXPOSURE` | Secret exists in active repository files | Scan match in working directory |
| `HISTORICAL_EXPOSURE` | Secret exists in past Git commits | Commit log scan |
| `RUNTIME_ASSOCIATION` | Secret corresponds to runtime asset metadata | Service/container metadata |
| `DEPLOYMENT_ASSOCIATION` | Commit containing secret was deployed | Deployment record match |
| `ACTIVE_STATUS_UNKNOWN` | Activation status unverified (Default) | No authoritative deployment proof |
| `ACTIVE_STATUS_CONFIRMED` | Active deployment configuration confirmed | Verified authoritative metadata |

## What SecretShield Does NOT Verify

- SecretShield does not execute runtime penetration tests.
- SecretShield does not send credentials over external networks.
- SecretShield does not guarantee a secret is invalid simply because it was removed from `HEAD`.
