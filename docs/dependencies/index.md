# Software Supply-Chain Security & Dependency Intelligence

SecretShield expands beyond source-code secret detection and runtime exposure into a comprehensive, privacy-first software supply-chain security layer.

## Core Security Invariants

- **No Code Execution**: SecretShield parses manifests and lockfiles statically without executing package installation scripts (`preinstall`, `postinstall`, `setup.py`, etc.).
- **Zero Secret Transmission**: SecretShield never transmits source secrets, environment variables, or discovered credentials to external vulnerability databases or third-party APIs.
- **Evidence-Backed Attribution**: Every vulnerability finding, dependency path, and license classification maintains strict provenance.
- **Distinct Risk Classification**:
  - **Known Vulnerability**: Authoritative security advisory (CVE / GHSA) with confirmed affected version ranges and CVE references.
  - **Potential Risk**: Copyleft licenses, deprecated packages, or unpinned dependencies.
  - **Heuristic Signal (`SUSPICIOUS_SIGNAL`)**: Typosquatting name similarity or suspicious install commands. These are heuristic warnings, NOT authoritative claims of maliciousness.
  - **Confirmed Evidence**: Direct lockfile integrity hashes and manifest line references.

## Key Capabilities

1. **Normalized Software Bill of Materials (SBOM)**: CycloneDX 1.5, SPDX 2.3, and native JSON output without credential leaks.
2. **Deterministic Version Matching**: Bounded semantic version resolution handling caret, tilde, wildcards, and pre-release precedence.
3. **Conservative Reachability Analysis**: Distinguishes whether a dependency is merely declared, installed, imported, or referenced in active source files.
4. **License Governance**: Automated classification into Permissive, Copyleft, Weak Copyleft, and Missing with factual policy evaluations.
5. **Safe Update Patch Engine**: Proposes non-breaking updates with unified diffs without executing package managers.
