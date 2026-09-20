import { NextResponse } from 'next/server';
import { reviewRuleSubmission } from '@/lib/db/rule-packs';
import { getCurrentUser } from '@/lib/auth/session';
import { isGlobalAdmin } from '@/lib/auth/rbac';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!isGlobalAdmin(user)) {
      return NextResponse.json(
        { success: false, error: { message: 'Only global administrators can review and approve community rule submissions' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.status || !['APPROVED', 'PUBLISHED', 'REJECTED'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: { message: "Status must be 'APPROVED', 'PUBLISHED', or 'REJECTED'" } },
        { status: 400 }
      );
    }

    const updated = await reviewRuleSubmission(id, {
      status: body.status,
      reviewer: user.email || user.name || 'admin',
      comments: body.comments || '',
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Submission status updated to ${body.status}`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
