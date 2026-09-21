/**
 * app/api/trust/controls/route.js
 *
 * GET /api/trust/controls - List organization security controls
 * POST /api/trust/controls - Create a custom documented security control
 */

import { NextResponse } from 'next/server';
import { listControlsDb, saveControlDb } from '@/lib/db/trust';
import { createControl } from '@/lib/trust/controls';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || 'default-org';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const controls = await listControlsDb({ organizationId, category, status });

    return NextResponse.json({
      success: true,
      data: controls,
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
    const controlRecord = createControl({
      organizationId,
      code: body.code,
      name: body.name,
      description: body.description,
      category: body.category,
      implementationStatus: body.implementationStatus,
      owner: body.owner,
      isPublic: Boolean(body.isPublic),
      evidenceRequirements: body.evidenceRequirements || [],
    });

    const saved = await saveControlDb(controlRecord);

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
