import { NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics/tracker';

export async function POST(request) {
  try {
    const body = await request.json();
    const { event, properties, context } = body;

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event name is required' }, { status: 400 });
    }

    const tracked = trackEvent(event, properties || {}, context || {});
    return NextResponse.json({ success: tracked });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
