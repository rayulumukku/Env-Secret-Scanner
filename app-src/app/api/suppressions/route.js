/**
 * app/api/suppressions/route.js
 *
 * GET  - List suppressions
 * POST - Create smart ignore / false positive suppression
 * DELETE - Undo / remove suppression
 */

import { NextResponse } from 'next/server';
import { addSuppression, listSuppressions, deleteSuppression } from '@/lib/db/suppressions.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId') || 'org_default';
    const projectId = searchParams.get('projectId');

    const suppressions = await listSuppressions(orgId, projectId);
    return NextResponse.json({ suppressions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationId = 'org_default', projectId, type, target, reason, userEmail } = body;

    if (!target || !type) {
      return NextResponse.json({ error: 'Target and suppression type are required' }, { status: 400 });
    }

    const created = await addSuppression({
      organizationId,
      projectId,
      type,
      target,
      reason,
      userEmail: userEmail || 'developer@acme.corp',
    });

    return NextResponse.json({ suppression: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Suppression ID is required' }, { status: 400 });
    }

    const deleted = await deleteSuppression(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
