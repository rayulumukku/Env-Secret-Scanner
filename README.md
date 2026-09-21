# 🛡️ SecretShield (v1.0.0)

> **Zero-Trust, High-Speed Secret Detection, Developer Security Copilot & Exposure Intelligence Platform**

SecretShield is a complete, production-grade developer security platform that prevents credentials, API keys, and sensitive tokens from leaking into source code repositories. It operates seamlessly across **VS Code, terminal CLI, Git pre-commit hooks, CI/CD pipelines, and an enterprise web management console**.

---

## 🔒 Core Security Invariants

SecretShield operates on a strict **Zero-Exposure Policy**:
1. **Never Persist Raw Secrets**: All credentials are processed strictly in volatile memory. Databases store only HMAC-SHA256 fingerprints and masked strings (`sk_l••••4f9a`).
2. **Never Transmit Secrets to External AI**: The Developer Security Copilot operates **100% offline in local deterministic mode**. In optional advisory AI mode, all code snippets pass through multi-pattern secret scrubbers and strict context bounds (±5 lines).
3. **Safe Deterministic Patch Engine**: Automatic quick-fixes (e.g. `process.env.VAR`, `.gitignore`, `.env.example`) validate syntax, rescan with the engine, prevent path traversal, default to `--dry-run`, and support instant rollback.
4. **Declarative Multi-Tenant Isolation**: Scoped organization contexts and an RBAC matrix (`Owner`, `Admin`, `Member`, `Viewer`) prevent cross-tenant access and IDOR vulnerabilities.

---

## 📦 Monorepo Architecture

```
Env-Secret-Scanner/
├── packages/
│   ├── scanner/      # @secretshield/scanner — 100% offline regex & entropy engine
│   ├── rules/        # @secretshield/rules — Declarative signed rule packs & ReDoS guards
│   ├── copilot/      # @secretshield/copilot — Developer Copilot & safe patch engine
│   ├── cli/          # @secretshield/cli — Command line tool & pre-commit hook
│   └── config/       # @secretshield/config — Shared configuration schema
├── extensions/
│   └── vscode/       # secretshield-vscode — Real-time in-editor security intelligence
├── app-src/          # Next.js App Router — Enterprise security console & APIs
└── docs/             # Release documentation, architecture, security model, and DR
```

---

## ⚡ Quickstart

### 1. Developer CLI

```bash
# Scan working directory
npx secretshield scan .

# Scan Git staged files before commit
npx secretshield scan --staged

# Explain finding with evidence & remediation steps
npx secretshield explain <finding-id>

# Propose safe environment variable extraction patch (dry-run preview)
npx secretshield fix <finding-id>

# Apply safe patch to source file (creates instant rollback backup)
npx secretshield fix <finding-id> --apply

# Query offline Developer Security Copilot
npx secretshield copilot --query "How should I rotate an AWS Access Key?"
```

### 2. Git Pre-Commit Hook

Install pre-commit protection locally on developer machines:
```bash
npx secretshield install-hook
```
*Blocks any commit attempting to introduce HIGH or CRITICAL credentials into Git version control.*

### 3. CI/CD Integration & SARIF 2.1.0

```yaml
# .github/workflows/secretshield.yml
name: SecretShield Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx @secretshield/cli scan . --sarif secretshield-results.sarif --fail-on high
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: secretshield-results.sarif
```

### 4. VS Code Extension

- Real-time in-editor secret highlighting and diagnostic squiggles.
- Status bar indicator: `SecretShield: Clean | Findings | Scanning | Error`.
- Safe quick-fix code actions (`Extract to process.env.VAR`, `Add to .gitignore`, `Inline suppression`).
- Hover explanations with masked previews and remediation plans without transmitting code.

---

## 🧪 Testing & Validation

SecretShield includes exhaustive unit, integration, adversarial, and benchmark test suites:

```bash
# Run all workspace test suites (180+ tests)
npm test

# Run Next.js production build check
npm run build:web
```

---

## 📚 Documentation

- [Release Checklist](docs/release-checklist.md)
- [Architecture Overview](docs/architecture.md)
- [Security Model & Invariants](docs/security-model.md)
- [Data Flow](docs/data-flow.md)
- [Disaster Recovery](docs/disaster-recovery.md)
- [Versioning & Release Policy](docs/versioning.md)
- [V2 Roadmap](docs/roadmap-v2.md)
- [Security Disclosure Policy](SECURITY.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## 📄 License

Apache-2.0 © SecretShield Team
