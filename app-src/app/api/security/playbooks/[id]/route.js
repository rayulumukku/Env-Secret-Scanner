/**
 * app/api/security/playbooks/[id]/route.js
 *
 * GET /api/security/playbooks/:id - Get playbook details
 * PATCH /api/security/playbooks/:id - Update playbook
 * DELETE /api/security/playbooks/:id - Delete playbook
 */

import { NextResponse } from 'next/server';
import { getPlaybookById, updatePlaybook, deletePlaybook } from '@/lib/db/automation';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const organizationId = user?.organizationId || null;

    const playbook = await getPlaybookById(id, organizationId);
    if (!playbook) {
      return NextResponse.json(
        { success: false, error: { message: 'Playbook not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: playbook,
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

    const updated = await updatePlaybook(id, organizationId, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: 'Playbook not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const organizationId = user?.organizationId || null;

    const ok = await deletePlaybook(id, organizationId);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: { message: 'Playbook not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Playbook deleted' },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
