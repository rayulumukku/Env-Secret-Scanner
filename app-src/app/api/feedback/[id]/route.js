import { NextResponse } from 'next/server';
import { getFeedbackById, updateFeedbackStatus } from '@/lib/feedback/store';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const item = getFeedbackById(id);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, feedback: item });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminEmail } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const updated = updateFeedbackStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Feedback not found' }, { status: 404 });
    }

    logAdminAction('Feedback status changed', {
      target: id,
      newStatus: status,
      category: updated.category,
    }, adminEmail || 'admin@secretshield.local');

    return NextResponse.json({ success: true, feedback: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
