# Historical replay

Historical replay reconstructs observable state as of a timestamp without mutating current records.

## Labels

Historical state — YYYY-MM-DD

## Rules

- Always read-only.
- Calculates metrics from event history up to the selected timestamp.
- Never fabricates unavailable data.
