# Environment Hierarchy & Mapping

SecretShield establishes an explicit four-tier association chain:
`Repository -> Project -> Environment -> Deployment`

## Supported Environments

- `DEVELOPMENT`: Local workstations and shared dev sandboxes.
- `TEST`: Continuous integration and automated test runners.
- `STAGING`: Pre-release mirrors of production.
- `PRODUCTION`: Live customer-facing services.
- `CUSTOM`: Organization-specific deployment targets.

## Critical Invariant: No Name-Based Production Assumptions

SecretShield **never** assumes an environment is production merely because its name contains `"prod"` (e.g. `product-preview`, `reproduce-bug`). Environments must have an explicit `isProduction: true` boolean flag or authoritative mapping in the organization registry.

## Template vs Production Differentiation

Files matching `.env.example`, `sample.env`, or `tests/fixtures/**` are categorized as documentation/test templates. They are never flagged as production exposure unless deployed via an authoritative build manifest.
