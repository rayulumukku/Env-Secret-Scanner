/**
 * app/api/health/readiness/route.js
 *
 * Safe Kubernetes / Container Readiness Probe.
 *
 * Verifies:
 *   - Database connection / storage layer readiness
 *   - Scanner engine readiness
 *   - Configuration readiness
 *
 * SAFETY INVARIANT:
 *   - NEVER exposes credentials, database passwords, or connection strings.
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { ALL_RULES } from '@/lib/scanner/rules/index';
import { validateEnvironment } from '@/lib/config/validation';
import { getAppVersion } from '@/lib/version';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'ready';
  let dbMessage = 'In-memory fallback store active';
  let scannerStatus = 'ready';
  let configStatus = 'ready';
  const checks = {};

  // 1. Database Check
  try {
    const { isPostgres } = await getDb();
    if (isPostgres) {
      dbMessage = 'PostgreSQL connection active';
    }
  } catch (err) {
    dbStatus = 'degraded';
    dbMessage = 'Database connection error';
  }
  checks.database = { status: dbStatus, message: dbMessage };

  // 2. Scanner Engine Check
  try {
    const rulesLoaded = ALL_RULES.length;
    if (rulesLoaded > 0) {
      checks.scanner = { status: 'ready', rulesLoaded };
    } else {
      checks.scanner = { status: 'unhealthy', message: 'No detection rules loaded' };
      scannerStatus = 'unhealthy';
    }
  } catch {
    checks.scanner = { status: 'unhealthy', message: 'Scanner engine initialization failed' };
    scannerStatus = 'unhealthy';
  }

  // 3. Configuration Check
  try {
    const val = validateEnvironment();
    if (val.valid) {
      checks.configuration = { status: 'ready' };
    } else {
      checks.configuration = { status: 'warning', errorsCount: val.errors.length };
      if (process.env.NODE_ENV === 'production') {
        configStatus = 'degraded';
      }
    }
  } catch {
    checks.configuration = { status: 'warning' };
  }

  const isReady = dbStatus !== 'unhealthy' && scannerStatus === 'ready';
  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isReady ? 'ready' : 'not_ready',
      version: getAppVersion(),
      timestamp: new Date().toISOString(),
      responseTimeMs,
      checks,
    },
    {
      status: isReady ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
