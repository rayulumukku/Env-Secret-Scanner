# SecretShield Versioning & Release Policy

SecretShield adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/).

## Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR (e.g. 1.0.0 -> 2.0.0)**: Incompatible rule manifest schema changes, breaking CLI argument changes, or database migration schema breaks requiring manual intervention.
- **MINOR (e.g. 1.0.0 -> 1.1.0)**: Backward-compatible feature additions, new detection rule packs, new CLI commands, new VS Code extension capabilities, or dashboard additions.
- **PATCH (e.g. 1.0.0 -> 1.0.1)**: Backward-compatible bug fixes, false-positive tuning, regex performance optimizations, and documentation corrections.

## Package Version Alignment

All core packages (`@secretshield/scanner`, `@secretshield/rules`, `@secretshield/copilot`, `@secretshield/cli`, `@secretshield/config`, `secretshield-vscode`) release under aligned release tags.
