/**
 * app/api/health/route.js
 *
 * Public unauthenticated system health probe.
 *
 * SAFETY RULES:
 * Returns ONLY safe high-level availability status.
 * NEVER leaks environment variables, credentials, secrets, tokens, or stack traces.
 */

import { NextResponse } from 'next/server';
import { getAppVersion } from '@/lib/version';
import { getDb } from '@/lib/db/client';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';

  try {
    const { isPostgres } = await getDb();
    dbStatus = isPostgres ? 'connected' : 'in-memory-active';
  } catch {
    dbStatus = 'unavailable';
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: 'healthy',
      version: getAppVersion(),
      scanner: 'available',
      database: dbStatus,
      responseTimeMs,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
