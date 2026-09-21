# Disaster Recovery & Business Continuity Procedure

## 1. Database Backup Strategy
- **Continuous Archiving**: Automated Write-Ahead Logging (WAL) and daily physical snapshots.
- **Logical Backups**: Daily encrypted `pg_dump` exports stored in geographically redundant object storage.
- **Zero-Secret Storage**: Database restores contain no raw credentials; all records are masked fingerprints and policy configurations.

## 2. Restoration Procedure
1. Provision a clean PostgreSQL instance matching the target schema version.
2. Restore database dump using:
   ```bash
   pg_restore --clean --if-exists -d secretshield_db latest_backup.dump
   ```
3. Run Prisma migration verification:
   ```bash
   npx prisma migrate deploy
   ```
4. Start SecretShield server with validated environment variables (`app-src/lib/env.js`).

## 3. Patch Engine Rollback
- Every patch executed with `--apply` stores a pre-patch snapshot in the local backup registry.
- To rollback an applied patch:
  ```bash
  secretshield rollback <patchId>
  ```
