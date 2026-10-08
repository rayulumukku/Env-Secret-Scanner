# Custom metrics

Custom metrics are declarative and restricted to supported dimensions and metrics. No arbitrary SQL or free-form query expressions are allowed.

## Example

- unresolved_critical_findings_older_than_14_days
- policy_violations_last_30d
- repeated_fingerprints_by_repository

All custom metrics must resolve to observed evidence or sanitized snapshots.
