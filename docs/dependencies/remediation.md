# Safe Dependency Remediation & Update Engine

SecretShield guides engineers to upgrade vulnerable dependencies safely without unconstrained package manager execution.

## Remediation Workflow

1. **Advisory Resolution**: Identifies the minimal non-vulnerable fixed version that resolves the security advisory.
2. **Path Analysis**: Indicates whether the vulnerable package is directly declared or introduced through transitive dependencies.
3. **Safe Patch Preview**:
   - Generates a standard unified diff against the declared manifest (`package.json`, `requirements.txt`, etc.).
   - Validates that the manifest syntax remains syntactically valid (e.g. valid JSON).
   - Validates that the file path remains strictly within the repository boundary (path traversal prevention).
4. **Human Confirmation**: SecretShield never alters files or installs binaries without explicit developer approval.

## CLI Dry-Run

```bash
# Preview safe update diff without altering files
secretshield dependencies update --package lodash --to 4.17.21 --dry-run
```
