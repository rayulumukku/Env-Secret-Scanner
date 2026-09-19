# SecretShield for VS Code 🛡️

**Zero-Cloud, Real-Time Secret & Credential Scanner for Visual Studio Code.**

Catch exposed API keys, access tokens, database connection strings, and private keys directly inside your editor — before they ever get committed to Git or pushed to GitHub.

---

## Features

- ⚡ **Instant Real-Time Scanning**: Identifies sensitive secrets on save with microsecond latency.
- 🔒 **100% Offline & Private**: Zero code transmitted over the network or sent to external AI services. Scans purely within your local machine.
- 🎯 **High-Precision Multi-Stage Intelligence**: Shannon entropy scoring, provider regexes, keyword proximity, and heuristic false-positive suppression.
- 📁 **Sidebar Findings Explorer**: Dedicated Activity Bar view grouping all workspace and file findings by severity.
- 💡 **Rich Hover Tooltips**: Inspect finding details, masked secret representations, entropy scores, and remediation steps without leaving your editor.
- ⚙️ **Configurable Thresholds**: Honors `.secretshield.json` or VS Code workspace settings.

---

## Extension Settings

| Setting | Default | Description |
| :--- | :--- | :--- |
| `secretshield.enabled` | `true` | Toggle active scanning on or off. |
| `secretshield.scanOnSave` | `true` | Automatically scan files whenever they are saved. |
| `secretshield.scanOnChange` | `false` | Scan files on every keystroke (debounced). |
| `secretshield.severityThreshold` | `"LOW"` | Minimum severity to display as problem diagnostics (`"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"`). |
| `secretshield.configPath` | `".secretshield.json"` | Relative path to custom configuration. |
| `secretshield.maxFileSize` | `5242880` | Maximum file size in bytes to inspect (default 5MB). |

---

## Commands

- `SecretShield: Scan Current File` — Run an immediate scan on the active editor buffer.
- `SecretShield: Scan Entire Workspace` — Scan all workspace files and populate problem diagnostics.
- `SecretShield: Focus Findings Sidebar` — Open the SecretShield sidebar panel in the Activity Bar.
- `SecretShield: Clear All Findings` — Clear active diagnostics and reset sidebar state.

---

## Security Guarantees

1. **Zero Raw Secret Ingestion**: Raw secrets are never saved in editor diagnostic metadata, logs, or workspace state.
2. **Deterministic Fingerprints**: All secrets are masked immediately upon detection.
3. **Pure JavaScript**: Built on `@secretshield/scanner` with no native binary dependencies.

---

## License

MIT © [SecretShield](https://secretshield.dev)
