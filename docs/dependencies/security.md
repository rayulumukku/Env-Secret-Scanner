# Supply-Chain Security Hardening & Threat Model

SecretShield treats all scanned repositories, manifests, and lockfiles as untrusted inputs.

## Threat Defenses

### 1. No Code Execution
SecretShield does not invoke `npm install`, `pip install`, `mvn compile`, or package lifecycle scripts (`preinstall`, `postinstall`, `prepare`). All dependency trees are computed statically from declarative files.

### 2. XML & YAML Hardening
- XML parsers strip `<!DOCTYPE>` and external entity definitions to prevent XML External Entity (XXE) data exfiltration attacks.
- YAML parsers use line-based tokenizers that reject unsafe YAML tags (`!!js/function`, `!!python/object`).

### 3. Path Traversal & Boundary Enforcement
All file paths are validated against the workspace root. Any input containing directory traversal tokens (`../`) is rejected.

### 4. ReDoS & Input Bounds
Strict regex bounds, non-backtracking patterns, and file size limits (5 MB manifest, 25 MB lockfile) prevent denial-of-service via resource exhaustion.

### 5. Multi-Tenant Organization Isolation
All stored dependencies, findings, and scans enforce `organizationId` scoping with composite database indexes.
