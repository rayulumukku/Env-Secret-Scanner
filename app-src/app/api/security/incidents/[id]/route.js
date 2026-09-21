/**
 * app/api/security/incidents/[id]/route.js
 *
 * GET /api/security/incidents/:id - Get detailed incident
 * PATCH /api/security/incidents/:id - Update incident status / assignment
 */

import { NextResponse } from 'next/server';
import { getIncidentById, listSecurityIncidents } from '@/lib/db/automation';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const organizationId = user?.organizationId || null;

    const incident = await getIncidentById(id, organizationId);
    if (!incident) {
      return NextResponse.json(
        { success: false, error: { message: 'Incident not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const body = await request.json();
    const organizationId = user?.organizationId || null;

    const incident = await getIncidentById(id, organizationId);
    if (!incident) {
      return NextResponse.json(
        { success: false, error: { message: 'Incident not found' } },
        { status: 404 }
      );
    }

    if (body.status) incident.status = body.status;
    if (body.assignedToId) incident.assignedToId = body.assignedToId;
    if (body.title) incident.title = body.title;
    incident.updatedAt = new Date().toISOString();
    if (body.status === 'CLOSED') incident.resolvedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
