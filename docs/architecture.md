# SecretShield Architecture Overview

SecretShield is an enterprise-grade, privacy-first secret detection, exposure intelligence, and remediation platform.

```mermaid
graph TD
    Developer[Developer Workstation] -->|VS Code Extension| VSCode[VS Code Extension]
    Developer -->|CLI / Pre-Commit| CLI[@secretshield/cli]
    
    subgraph Shared Core Packages
        Scanner[@secretshield/scanner]
        Rules[@secretshield/rules]
        Copilot[@secretshield/copilot]
        Config[@secretshield/config]
    end
    
    VSCode --> Scanner
    VSCode --> Copilot
    CLI --> Scanner
    CLI --> Rules
    CLI --> Copilot
    
    subgraph Central Management Platform
        WebUI[Next.js App Router Dashboard]
        APIRoutes[Hardened REST APIs]
        ExposureGraph[Exposure Intelligence & Graph Engine]
        RemediationCenter[Remediation & Patch Center]
        TrustCompliance[Trust & Compliance Center]
        Database[(PostgreSQL Database)]
    end
    
    WebUI --> APIRoutes
    APIRoutes --> ExposureGraph
    APIRoutes --> RemediationCenter
    APIRoutes --> TrustCompliance
    APIRoutes --> Database
    APIRoutes --> Scanner
    APIRoutes --> Copilot
```

## Monorepo Architecture

1. **`packages/scanner/`**: Core secret scanning engine. 100% offline, deterministic regex matcher, Shannon entropy calculator, and masking utilities. Zero network calls.
2. **`packages/rules/`**: Declarative Rule Pack registry supporting core, community, and enterprise rules with cryptographic integrity signing and ReDoS protection.
3. **`packages/copilot/`**: Developer Security Copilot, minimal safe context extraction (±5 lines), structured explanation engine, quick-fix generator, and safe patch engine.
4. **`packages/cli/`**: SecretShield command-line interface for terminal workflows, pre-commit hooks, and CI/CD pipelines.
5. **`extensions/vscode/`**: VS Code extension offering real-time in-editor highlighting, status bar indicators, hover diagnostics, and one-click quick fixes.
6. **`app-src/`**: Next.js App Router enterprise security operations console, exposure intelligence graphs, compliance center, and hardened REST APIs.
