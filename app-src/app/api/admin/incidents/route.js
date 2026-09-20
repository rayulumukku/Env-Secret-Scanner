import { NextResponse } from 'next/server';
import { getIncidents, createIncident, updateIncidentStatus } from '@/lib/incidents/store';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET() {
  try {
    const incidents = getIncidents();
    return NextResponse.json({ success: true, incidents });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const incident = createIncident(body);

    logAdminAction('Incident created', {
      target: incident.id,
      title: incident.title,
      status: incident.status,
    }, body.adminEmail || 'admin@secretshield.local');

    return NextResponse.json({ success: true, incident }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, message, adminEmail } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Incident ID and status required' }, { status: 400 });
    }

    const updated = updateIncidentStatus(id, status, message);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }

    logAdminAction('Incident status updated', {
      target: id,
      status: updated.status,
    }, adminEmail || 'admin@secretshield.local');

    return NextResponse.json({ success: true, incident: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
