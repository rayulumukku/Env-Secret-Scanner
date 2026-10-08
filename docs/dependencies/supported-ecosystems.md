# Supported Package Ecosystems & Manifests

SecretShield deterministically parses manifests and lockfiles across all major software development ecosystems without requiring native toolchains installed.

## Supported Manifests & Lockfiles

| Ecosystem | Manifest File | Lockfile | Direct / Transitive Support |
| :--- | :--- | :--- | :--- |
| **Node.js (npm, yarn, pnpm)** | `package.json` | `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml` | Full transitive paths and exact locked versions |
| **Python (PyPI)** | `requirements.txt`, `Pipfile` | `poetry.lock`, `Pipfile.lock` | Full direct & locked transitive parsing |
| **Go** | `go.mod` | `go.sum` | Direct and `// indirect` dependencies |
| **Rust (Cargo)** | `Cargo.toml` | `Cargo.lock` | Direct specifications and locked crates |
| **Ruby (RubyGems)** | `Gemfile` | `Gemfile.lock` | Direct specs and locked dependencies |
| **PHP (Packagist)** | `composer.json` | `composer.lock` | Direct requirements and locked packages |
| **JVM (Maven & Gradle)** | `pom.xml`, `build.gradle`, `build.gradle.kts` | N/A | Direct dependency extraction with XXE prevention |

## Parser Security Protections

- **Safe XML Parser**: Strips all `<!DOCTYPE>` and `<!ENTITY>` definitions from `pom.xml` to eliminate XML External Entity (XXE) vulnerabilities.
- **Safe YAML Parser**: Parses `pnpm-lock.yaml` using deterministic line-level scanners avoiding arbitrary code execution tags.
- **Max File Size Guards**: Rejects manifests > 5 MB and lockfiles > 25 MB to prevent memory exhaustion and ReDoS denial-of-service vectors.
