/**
 * app/api/security/actions/[id]/approve/route.js
 *
 * POST /api/security/actions/:id/approve
 * Approves a pending automation action or approval request.
 */

import { NextResponse } from 'next/server';
import { updateApprovalRequestStatus } from '@/lib/db/automation';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const body = await request.json().catch(() => ({}));
    const organizationId = user?.organizationId || null;

    const updated = await updateApprovalRequestStatus(
      id,
      organizationId,
      'APPROVED',
      user?.name || user?.email || 'Authorized Administrator',
      body.comment || 'Approved via Security Console'
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: 'Approval request not found or unauthorized' } },
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
      { status: 500 }
    );
  }
}
