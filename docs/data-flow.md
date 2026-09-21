# SecretShield Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant IDE as VS Code / CLI
    participant Scanner as @secretshield/scanner
    participant Copilot as @secretshield/copilot
    participant Server as SecretShield API
    participant DB as PostgreSQL

    Dev->>IDE: Modifies source code with candidate secret
    IDE->>Scanner: scanSync(fileContent)
    Scanner->>Scanner: Regex Matching + Shannon Entropy
    Scanner->>IDE: Returns Findings (Masked + Fingerprint)
    IDE->>Dev: Displays In-Editor Highlight & Status Bar Indicator
    
    Dev->>Copilot: "Explain finding" / "Fix"
    Copilot->>Copilot: Extract safe code window (±5 lines) + Redaction
    Copilot->>IDE: Proposes Safe Patch (process.env.VAR) + Diff Preview
    
    Dev->>Copilot: Approve Patch Application
    Copilot->>Copilot: Validate Syntax + Rescan + Disk Write + Backup
    Copilot->>IDE: Patch Applied Successfully
    
    IDE->>Server: Sync Masked Finding Event (Token / SHA / Metadata)
    Server->>DB: Record Audit Event & Update Exposure Timeline
```

## Data Boundary Invariants

- **Developer Host**: Raw source files are processed strictly in-memory by the local Node.js engine.
- **Network Ingestion**: Only masked strings (`••••••••`), rule IDs, file paths, line numbers, and SHA-256 fingerprints are transmitted over TLS to the central dashboard.
- **Database Storage**: No plaintext secret credentials exist in any table.
