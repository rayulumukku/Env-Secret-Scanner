# Security Policy & Responsible Disclosure

## Reporting a Vulnerability

The SecretShield maintainers take security issues seriously. If you believe you have found a security vulnerability in SecretShield, please report it responsibly so we can resolve it before public disclosure.

### How to Report

Please report security issues via GitHub Security Advisories on this repository:
- Navigate to the **Security** tab of the repository
- Click **Report a vulnerability** to open a private advisory draft
- Or email the security team (if an authorized security contact is designated for your deployment)

### What to Include

Please provide:
1. Type of issue (e.g. Zip Slip, ReDoS in custom rules, buffer exhaustion, authorization bypass).
2. Step-by-step instructions or proof-of-concept (POC) to reproduce the vulnerability.
3. Affected versions of SecretShield.
4. Any potential mitigations you have identified.

### Responsible Disclosure Guidelines

- Please give us reasonable time to investigate and patch the issue before publishing details.
- Do not exploit the vulnerability beyond what is strictly necessary to demonstrate the proof-of-concept.
- Do not access, modify, or destroy user data.

---

## Core Security Commitments

1. **Zero External AI Processing**: SecretShield never transmits source code to external AI model APIs (e.g., OpenAI, Anthropic).
2. **Deterministic In-Memory Masking**: Raw secret values are immediately masked into fingerprints in volatile memory and are never persisted.
3. **Archive Extraction Hardening**: Strict guards prevent Zip Slip path traversal, Zip bombs, nested archive attacks, and symlink exploits.
4. **ReDoS Safety**: Custom regular expressions are evaluated against catastrophic backtracking algorithms before registration.
