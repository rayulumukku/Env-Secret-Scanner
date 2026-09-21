# SecretShield Security Model & Invariants

## 1. Zero-Raw-Secret Principle
- Raw secrets are **never** stored in the database, cache, or persistent logs.
- Credentials are represented exclusively as:
  1. **Masked strings**: e.g., `sk_l••••4f9a` or `AKIA••••CDEF`.
  2. **Deterministic fingerprints**: HMAC-SHA256 hashes for correlation and lifecycle tracking without revealing the underlying plaintext.

## 2. Local-First & Air-Gapped Operation
- The scanner engine (`@secretshield/scanner`) and local copilot mode require zero network access.
- Code scanned on a developer workstation or CI runner never leaves the host environment.

## 3. Strict Redaction & Data Minimization
- When queries or snippets are passed to Copilot, context is strictly restricted to ±5 lines around the target line.
- All extracted lines pass through the multi-pattern redaction engine (`@secretshield/copilot/redaction`) before display, logging, or optional advisory AI transmission.

## 4. Safe Patch Engine & Traversal Guards
- Patch operations are strictly confined within the verified repository root boundary.
- Any attempt to escape via path traversal (`../`, absolute paths outside workspace, null bytes) is rejected.
- Patches refuse binary files, perform pre- and post-application syntax checks and scanner re-scans, and default to `--dry-run` with instant rollback capabilities.

## 5. Multi-Tenant Isolation & Role-Based Access Control
- Every database model is scoped to an `organizationId`.
- Every API route enforces ownership checks matching the authenticated user's organization context.
- Declarative RBAC distinguishes `Owner`, `Admin`, `Member`, and `Viewer` permissions.
