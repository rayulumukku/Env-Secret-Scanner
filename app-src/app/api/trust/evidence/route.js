/**
 * app/api/trust/evidence/route.js
 *
 * GET /api/trust/evidence - List control evidence records
 * POST /api/trust/evidence - Attach evidence record to a control
 */

import { NextResponse } from 'next/server';
import { listControlEvidenceDb, saveControlEvidenceDb } from '@/lib/db/trust';
import { createControlEvidence } from '@/lib/trust/evidence-mapping';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || 'default-org';
    const controlId = searchParams.get('controlId');
    const isPublic = searchParams.get('isPublic') !== null
      ? searchParams.get('isPublic') === 'true'
      : null;

    const evidence = await listControlEvidenceDb({ organizationId, controlId, isPublic });

    return NextResponse.json({
      success: true,
      data: evidence,
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
    const evidenceObj = createControlEvidence({
      controlId: body.controlId,
      organizationId,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      title: body.title,
      summary: body.summary,
      validityDays: body.validityDays || 90,
      isPublic: Boolean(body.isPublic),
      metadata: body.metadata || {},
    });

    const saved = await saveControlEvidenceDb(evidenceObj);

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
