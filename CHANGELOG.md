# Changelog

All notable changes to SecretShield are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-21 - Production Release

### Added
- **Developer Security Copilot (`@secretshield/copilot`)**:
  - Local-first 100% offline deterministic intelligence engine.
  - Safe context extraction bounded to ±5 lines around target code.
  - Multi-pattern secret scrubber & deep data sanitizer (`@secretshield/copilot/redaction`).
  - Deterministic safe patch engine with dry-run default, pre/post syntax & scanner validation, and rollback support.
  - Repository-level factual security scorecards (no individual developer ranking).
- **Rule Pack & Community Ecosystem (`@secretshield/rules`)**:
  - Declarative JSON rule packs for core, community, and enterprise detectors.
  - Canonical SHA-256 manifest signing and ReDoS vulnerability verification.
  - 5-tier precedence hierarchy and finding deduplication.
- **Enterprise Trust & Evidence Center**:
  - Audit trail logging (`COPILOT_QUERY`, `COPILOT_PATCH_APPLIED`, `SCAN_COMPLETED`).
  - Declarative RBAC permission matrix for `Owner`, `Admin`, `Member`, and `Viewer`.
  - Strict tenant isolation and IDOR prevention guards.
- **CLI & VS Code Intelligence**:
  - CLI commands: `secretshield explain`, `why`, `fix`, `review`, `explain-commit`, `copilot`.
  - VS Code extension real-time diagnostics, status bar, hover markdown, and quick fixes.
  - Pre-commit git hook with instant explanation guidance.
  - SARIF 2.1.0 output support for GitHub Actions and GitLab CI.

### Security
- Zero raw secrets stored in database, logs, error stacks, API payloads, or client bundles.
- Strict environment variable categorization (`PUBLIC`, `SERVER_ONLY`, `SECRET`, `OPTIONAL`).
- Verified path traversal and null-byte guards across all file reading and patch operations.
