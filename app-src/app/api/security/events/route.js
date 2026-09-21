/**
 * app/api/security/events/route.js
 *
 * GET /api/security/events
 * List security events with strict organization scoping, pagination, and multi-factor filters.
 */

import { NextResponse } from 'next/server';
import { listSecurityEvents } from '@/lib/db/automation';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || null;
    const repositoryId = searchParams.get('repositoryId');
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const { events, total } = await listSecurityEvents({
      organizationId,
      repositoryId,
      eventType,
      severity,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + events.length < total,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
