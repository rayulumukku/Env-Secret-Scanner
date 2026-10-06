# Deployments Model & Correlation

SecretShield tracks deployment metadata to link Git commits with the environments in which they are deployed.

## Deployment Data Model

Tracked fields:
- `commitSha`: Associated Git commit SHA.
- `repositoryId`: Target repository.
- `environment`: Target deployment environment (`DEVELOPMENT`, `TEST`, `STAGING`, `PRODUCTION`, `CUSTOM`).
- `provider`: Deployment system (`github_actions`, `gitlab_ci`, `vercel`, `aws_ecs`, `k8s`, `docker`).
- `status`: Deployment state (`SUCCESS`, `FAILED`, `IN_PROGRESS`, `ROLLED_BACK`).
- `actor`: Build trigger or deployment initiator.
- `buildIdentifier`: External build/run ID.

## Zero Credential Storage Invariant

Deployment records contain metadata only. Source secrets and build environment variables are never stored in deployment records.

## Historical Deployment Exposure

When a vulnerable commit is retired or a secret is removed from HEAD, SecretShield traces historical deployments to verify whether past active builds still contain the compromised commit.
