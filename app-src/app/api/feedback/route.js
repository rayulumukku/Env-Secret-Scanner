import { NextResponse } from 'next/server';
import { listFeedback, createFeedback, getFeedbackCategories } from '@/lib/feedback/store';
import { trackEvent } from '@/lib/analytics/tracker';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const feedback = listFeedback({ category, status, search });
    const categories = getFeedbackCategories();

    return NextResponse.json({
      success: true,
      feedback,
      categories,
      count: feedback.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const item = createFeedback(body);

    trackEvent(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
      category: item.category,
      hasSyntheticExample: Boolean(item.syntheticExample),
      ruleId: item.ruleId,
    });

    return NextResponse.json({ success: true, feedback: item }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
