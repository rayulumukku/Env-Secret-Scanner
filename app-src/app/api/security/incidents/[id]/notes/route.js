/**
 * app/api/security/incidents/[id]/notes/route.js
 *
 * POST /api/security/incidents/:id/notes
 * Adds a sanitized, leak-protected investigation note to an incident.
 */

import { NextResponse } from 'next/server';
import { getIncidentById, addIncidentNote } from '@/lib/db/automation';
import { createIncidentNote } from '@/lib/automation/incidents';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const body = await request.json();
    const organizationId = user?.organizationId || 'default-org';

    const incident = await getIncidentById(id, organizationId);
    if (!incident) {
      return NextResponse.json(
        { success: false, error: { message: 'Incident not found' } },
        { status: 404 }
      );
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Note content is required' } },
        { status: 400 }
      );
    }

    const { note, warning } = createIncidentNote({
      incidentId: id,
      organizationId,
      authorId: user?.id || 'analyst',
      authorName: user?.name || user?.email || 'Security Analyst',
      content: body.content,
    });

    const saved = await addIncidentNote(note);

    return NextResponse.json({
      success: true,
      data: saved,
      warning,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
