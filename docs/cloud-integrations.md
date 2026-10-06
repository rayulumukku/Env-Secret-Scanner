# Cloud Provider Integrations

SecretShield provides a vendor-agnostic provider abstraction layer supporting Amazon Web Services (AWS), Google Cloud Platform (GCP), Microsoft Azure, and Generic Kubernetes/Container environments.

## Architecture

The cloud integration layer is located in `app-src/lib/cloud/`:
- `provider.js`: Base interface defining rate limiting, retries, and least-privilege contracts.
- `aws.js`: AWS metadata adapter.
- `gcp.js`: GCP metadata adapter.
- `azure.js`: Azure metadata adapter.
- `generic.js`: Generic cloud & Kubernetes adapter.
- `ssrf.js`: Strict endpoint validator preventing intranet scanning.

## Displaying Required Scopes Prior to Connection

Before any cloud account is connected, SecretShield displays the explicit read-only scopes requested. Administrators must confirm these scopes in the UI or CLI before authorization is completed.

## Encrypted Storage & Zero Credential Exposure

Connection credentials or assumed IAM role tokens are encrypted at rest using AES-256-GCM authenticated envelopes via `encryptSecret`. Plaintext credentials are never echoed in logs, API responses, or Copilot prompts.
