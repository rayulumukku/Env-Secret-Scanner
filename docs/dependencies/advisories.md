# Vulnerability Advisories & Intelligence

SecretShield queries authoritative security advisories using an extensible provider abstraction.

## Advisory Data Model

Each security advisory contains:
- `advisoryId`: Unique identifier (e.g., `GHSA-p6mc-m468-83gw` or `CVE-2020-28500`)
- `cveId`: Associated Common Vulnerabilities and Exposures record
- `ecosystem`: Target package ecosystem (`npm`, `pypi`, `golang`, etc.)
- `package`: Target package name
- `affectedRange`: Semver range expression defining vulnerable versions
- `fixedVersions`: Array of patched, non-vulnerable versions
- `severity`: Standard severity rating (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
- `summary`: Factual summary of the vulnerability
- `description`: Detailed technical explanation
- `references`: Authoritative upstream documentation URLs
- `source`: Advisory provenance (GitHub Advisory Database, OSV, NVD)

## Finding Classification

Dependency vulnerabilities are recorded as `DEPENDENCY_VULNERABILITY` findings:
- Kept strictly segregated from secret findings (`SECRET_LEAK`).
- Include direct vs transitive classification and full dependency path.
- Include conservative reachability status (`DECLARED`, `INSTALLED`, `IMPORTED`, `POTENTIALLY_REACHABLE`).
- Include recommended fixed version and remediation steps.
