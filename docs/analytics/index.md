# Security Analytics

This analytics layer is evidence-backed and organization-scoped. It only stores sanitised metadata and never persists raw secrets. All metrics are derived from observed events or snapshots that are explicitly versioned.

## Core principles

- Observed metrics only. No fabricated historical values.
- Event schemas are versioned: v1, v2, future versions.
- Historical replay is read-only.
- API access is scoped to the authenticated organization.
- Raw secrets remain excluded from metadata and exports.

## Metric families

- Findings
- Exposure
- Remediation
- Dependencies
- Policy
- Incidents
- Threat intelligence
- Deployment security

## Query engine

Queries are validated, bounded, paginated, and timeout-protected.
