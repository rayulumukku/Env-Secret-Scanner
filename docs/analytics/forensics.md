# Forensic timeline

The forensic timeline is a chronological stream of observed events for a repository, fingerprint, finding, or deployment. It is read-only and does not infer missing events.

## Supported scopes

- repository
- fingerprint
- finding
- deployment
- incident
- threat

## Safety rules

- Only sanitized metadata is used.
- No raw secrets or sensitive diffs are displayed.
- Every event retains evidence references and organization scope.
