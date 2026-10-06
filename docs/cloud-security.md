# Cloud Security Posture & Privacy

SecretShield provides read-only cloud metadata inspection and security posture assessment across AWS, GCP, Azure, and custom cloud environments.

## Security Boundaries & Least Privilege

- **Read-Only Scopes**: Only metadata-listing permissions are requested (e.g. `s3:GetBucketPublicAccessBlock`, `iam:ListRoles`, `compute.firewalls.list`).
- **Zero Mutation**: SecretShield will never modify, create, or terminate cloud resources.
- **SSRF Protection**: Cloud endpoints are strictly validated against approved provider domains (`*.amazonaws.com`, `*.googleapis.com`, `*.azure.com`). Link-local addresses (`169.254.169.254`) and RFC-1918 private subnets are blocked.
- **Encrypted Credential Storage**: Connection tokens are stored as AES-256-GCM encrypted envelopes at rest and never echoed in API outputs.

## Cloud Configuration Posture Checks

1. **Public Storage**: Detects buckets without Public Access Block or with public read/write ACLs.
2. **Overly Broad IAM**: Flags wildcard `Action: "*"` in IAM policies without boundary controls.
3. **Exposed Service Ports**: Detects `0.0.0.0/0` ingress on sensitive ports (22, 3389, 5432, 27017, 6379).
4. **Missing Environment Tagging**: Flags cloud resources lacking environment categorization.
5. **Insecure Storage**: Checks for unencrypted persistent disk volumes.

## Cloud Finding Category

Cloud posture findings are strictly categorized as `CLOUD_POSTURE` and never conflated with source-code secret findings.
