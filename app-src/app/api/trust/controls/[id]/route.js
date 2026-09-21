/**
 * app/api/trust/controls/[id]/route.js
 *
 * GET /api/trust/controls/:id - Get control details with evidence mappings
 */

import { NextResponse } from 'next/server';
import { getControlByIdDb } from '@/lib/db/trust';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const organizationId = user?.organizationId || 'default-org';

    const control = await getControlByIdDb(id, organizationId);
    if (!control) {
      return NextResponse.json(
        { success: false, error: { message: 'Control not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: control,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
