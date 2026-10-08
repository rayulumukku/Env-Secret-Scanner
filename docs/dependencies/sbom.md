# Software Bill of Materials (SBOM) Generation

SecretShield exports standardized Software Bill of Materials without exposing secrets or connection credentials.

## Supported Formats

### 1. CycloneDX 1.5 (JSON)
Conforms to OWASP CycloneDX 1.5 JSON specification:
- Components include type, name, version, Package URL (`purl`), licenses, and cryptographic integrity hashes.
- Dependency relationship hierarchy mapped under the `dependencies` key.

### 2. SPDX 2.3 (JSON)
Conforms to Linux Foundation SPDX 2.3 specification:
- Packages include SPDXID, name, versionInfo, concluded licenses, and package manager purl external references.
- Document-level metadata includes CC0-1.0 data license and creation timestamp.

### 3. Native JSON
Normalized JSON format optimized for API ingestion and automated pipelines.

## CLI Usage

```bash
# Export CycloneDX 1.5 JSON to stdout
secretshield sbom

# Export SPDX 2.3 JSON to file
secretshield sbom --format spdx --output sbom-spdx.json

# Export native JSON
secretshield sbom --format json
```
