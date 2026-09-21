/**
 * app/api/security/schedules/route.js
 *
 * GET /api/security/schedules - List repository scan schedules
 * POST /api/security/schedules - Create or update a continuous repository scan schedule
 */

import { NextResponse } from 'next/server';
import { listScheduledScans, saveScheduledScan } from '@/lib/db/automation';
import { createScheduledScan } from '@/lib/automation/scheduler';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || null;
    const repositoryId = searchParams.get('repositoryId');

    const schedules = await listScheduledScans({ organizationId, repositoryId });

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const organizationId = body.organizationId || user?.organizationId || 'default-org';
    if (!body.repositoryId) {
      return NextResponse.json(
        { success: false, error: { message: 'repositoryId is required' } },
        { status: 400 }
      );
    }

    const scheduleObj = createScheduledScan({
      organizationId,
      repositoryId: body.repositoryId,
      schedule: body.schedule || 'daily',
      cronExpression: body.cronExpression,
    });

    const saved = await saveScheduledScan(scheduleObj);

    return NextResponse.json({
      success: true,
      data: saved,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
