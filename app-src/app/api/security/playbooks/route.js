/**
 * app/api/security/playbooks/route.js
 *
 * GET /api/security/playbooks - List organization playbooks
 * POST /api/security/playbooks - Create a new declarative playbook
 */

import { NextResponse } from 'next/server';
import { listPlaybooks, createPlaybook } from '@/lib/db/automation';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || null;
    const isEnabled = searchParams.get('isEnabled') !== null
      ? searchParams.get('isEnabled') === 'true'
      : null;

    const playbooks = await listPlaybooks({ organizationId, isEnabled });

    return NextResponse.json({
      success: true,
      data: playbooks,
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
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { message: 'Playbook name is required' } },
        { status: 400 }
      );
    }

    const created = await createPlaybook({
      organizationId,
      name: body.name,
      description: body.description,
      isEnabled: body.isEnabled !== false,
      conditions: body.conditions || [],
      actions: body.actions || [],
      approvalRequired: Boolean(body.approvalRequired),
    });

    return NextResponse.json({
      success: true,
      data: created,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
