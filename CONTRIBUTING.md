# Contributing to SecretShield 🛡️

Thank you for your interest in contributing to SecretShield! We are committed to building a developer-first, privacy-respecting secret detection platform.

---

## 🏛️ Architecture & Principles

SecretShield follows a strict core design principle:

> **ONE SCANNER ENGINE** across all clients:
> `packages/scanner` (`@secretshield/scanner`) powers:
> - Web Platform (`app-src`)
> - CLI Tool (`packages/cli`)
> - Git Pre-commit Hooks (`secretshield install-hook`)
> - GitHub Action (`action.yml`)
> - VS Code Extension (`extensions/vscode`)

**Detection logic must NEVER be duplicated.** All regex patterns, entropy thresholds, validation checks, and context rules live exclusively within `@secretshield/scanner`.

---

## 🔒 Security & Safe Testing Guidelines

When creating tests or adding rules:

1. **NO REAL SECRETS**: Never commit live API keys, active tokens, or real private keys — even for testing.
2. **USE SYNTHETIC SECRETS ONLY**: All test fixtures and regex validation tests must use synthetic, non-functional placeholders (e.g., `AKIAIOSFODNN7EXAMPLE`, `ghp_EXAMPLETOKEN12345678901234567890`).
3. **AUTOMATIC MASKING**: Ensure all outputs, error logs, and diagnostics contain ONLY masked representations (`AKIA••••••••MPLE`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/rayulumukku/Env-Secret-Scanner.git
cd Env-Secret-Scanner

# Install dependencies across all workspaces
npm install
```

### Running Tests
```bash
# Run scanner package tests
npm run test:scanner

# Run CLI package tests
npm run test:cli

# Run configuration tests
npm run test:config

# Run VS Code extension tests
npm run test:vscode

# Run all workspace tests
npm test
```

---

## 📝 Adding a Detection Rule

All detection rules are defined under `packages/scanner/src/rules/`:

1. Locate the appropriate category file (e.g., `aws.js`, `github.js`, `database.js`) or create a new category.
2. Define the rule object with required JSDoc typing:
   ```javascript
   /** @type {Rule} */
   export const MY_PROVIDER_RULE = {
     id: 'MY_PROVIDER_API_KEY',
     name: 'MyProvider API Key',
     category: 'API Keys',
     severity: 'HIGH',
     pattern: /myprov_[a-zA-Z0-9]{32}/g,
     keywords: ['myprov', 'api_key', 'token'],
     minEntropy: 3.5,
     description: 'Authentication credential for MyProvider APIs.',
     remediationGuidance: 'Revoke the key in the MyProvider Developer Portal and move to environment variables.'
   };
   ```
3. Add unit test cases with synthetic keys to `packages/scanner/__tests__/`.
4. Run `npm test` to verify.

---

## 📜 Code Style

- Pure JavaScript with JSDoc typing (`@param`, `@returns`, `@typedef`). No TypeScript compilation step required.
- ESM modules (`import` / `export`) throughout.
- Keep dependencies minimal and zero-cloud.

---

## 📄 Pull Request Process

1. Fork the repo and create your feature branch: `git checkout -b feature/awesome-detection`.
2. Ensure all tests pass (`npm test`).
3. Submit a Pull Request describing the changes, motivation, and test coverage.
