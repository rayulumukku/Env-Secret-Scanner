/**
 * app/api/health/route.js
 *
 * Safe Public System Health Probe.
 *
 * SAFETY RULES:
 *   - Returns ONLY safe high-level status, version, and timestamp.
 *   - NEVER leaks environment variables, credentials, secrets, tokens, or internal paths.
 */

import { NextResponse } from 'next/server';
import { getAppVersion } from '@/lib/version';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      version: getAppVersion(),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
