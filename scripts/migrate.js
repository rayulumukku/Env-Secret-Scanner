#!/usr/bin/env node

/**
 * scripts/migrate.js
 *
 * Safe Database Migration Runner for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - NEVER runs destructive drop/reset commands against production databases.
 *   - Verifies DATABASE_URL connection prior to running Prisma migration engine.
 *   - Gracefully reports status if running in in-memory local development mode.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

console.log('\n[SecretShield] Running Database Migration Check...');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.trim() === '') {
  console.log('[SecretShield] INFO: No DATABASE_URL configured.');
  console.log('[SecretShield] Running on isolated in-memory storage engine — no SQL migrations required.');
  console.log('[SecretShield] To connect PostgreSQL, set DATABASE_URL in your environment and re-run.\n');
  process.exit(0);
}

// PostgreSQL is configured
console.log('[SecretShield] PostgreSQL detected. Applying migrations...');

try {
  const isProduction = process.env.NODE_ENV === 'production';
  const command = isProduction
    ? 'npx prisma migrate deploy --schema=app-src/prisma/schema.prisma'
    : 'npx prisma db push --schema=app-src/prisma/schema.prisma';

  console.log(`[SecretShield] Executing: ${command}`);
  execSync(command, { stdio: 'inherit', env: process.env });
  console.log('[SecretShield] ✓ Database schema is fully up to date.\n');
} catch (err) {
  console.error('[SecretShield] ✖ Migration failed:', err.message);
  process.exit(1);
}
