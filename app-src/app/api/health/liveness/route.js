/**
 * app/api/health/liveness/route.js
 *
 * Lightweight Process Liveness Probe.
 *
 * SAFETY INVARIANT:
 *   - Only indicates whether the Node.js event loop and process are alive.
 *   - Zero internal configuration, database URLs, or memory addresses are returned.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
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
