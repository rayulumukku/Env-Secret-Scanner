/**
 * app/api/security/incidents/route.js
 *
 * GET /api/security/incidents - List organization security incidents
 * POST /api/security/incidents - Bundle a new security incident
 */

import { NextResponse } from 'next/server';
import { listSecurityIncidents, saveSecurityIncident } from '@/lib/db/automation';
import { createSecurityIncident } from '@/lib/automation/incidents';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || null;
    const status = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const incidents = await listSecurityIncidents({ organizationId, status, limit });

    return NextResponse.json({
      success: true,
      data: incidents,
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
    const incidentData = createSecurityIncident({
      organizationId,
      title: body.title,
      severity: body.severity || 'HIGH',
      relatedFingerprints: body.relatedFingerprints || [],
      relatedFindingIds: body.relatedFindingIds || [],
      assignedToId: body.assignedToId || user?.id || null,
    });

    const saved = await saveSecurityIncident(incidentData);

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
