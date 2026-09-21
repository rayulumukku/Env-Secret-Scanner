/**
 * app/api/security/automation/route.js
 *
 * GET /api/security/automation
 * Lists automation actions, approval queues, and recent execution statuses.
 */

import { NextResponse } from 'next/server';
import { listAutomationActions, listApprovalRequests } from '@/lib/db/automation';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || null;
    const status = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const [actions, approvalRequests] = await Promise.all([
      listAutomationActions({ organizationId, status, limit }),
      listApprovalRequests({ organizationId, status: 'PENDING_APPROVAL' }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        actions,
        pendingApprovals: approvalRequests,
        totalActions: actions.length,
        totalPendingApprovals: approvalRequests.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
