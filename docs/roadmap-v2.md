# SecretShield V2 Foundation & Roadmap

> [!NOTE]
> The items below represent architectural foundations and candidate areas for future SecretShield major releases. They are not part of SecretShield 1.0.0.

## 1. Additional SCM & Forge Integrations
- Bitbucket Server / Cloud deep integration with native PR decoration.
- Azure DevOps Repos and Pipeline tasks.
- Self-hosted Gitea / Forgejo webhook receivers.

## 2. Additional IDE & Editor Extensions
- JetBrains plugin suite (IntelliJ IDEA, WebStorm, PyCharm, GoLand).
- Neovim / Vim LSP integration via `secretshield lsp`.
- Visual Studio native extension.

## 3. Deeper Cloud & Secret Manager Integrations
- Direct AWS Secrets Manager / Parameter Store automated token synchronization.
- HashiCorp Vault dynamic secret lease monitoring.
- Google Secret Manager & Azure Key Vault one-click migration workflows.

## 4. Advanced Language & Semantic AST Analyzers
- Tree-sitter / AST semantic flow tracking to trace secret assignments across function calls.
- Deobfuscation and multi-stage decoding detection (Base64 + hex + reverse).
- Container image filesystem layer scanning.
