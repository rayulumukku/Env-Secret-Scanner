import { NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics/tracker';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

// In-memory support ticket store
const _supportTickets = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { subject, category, message, email } = body;

    if (!subject || !category || !message) {
      return NextResponse.json({ success: false, error: 'Subject, category, and message are required' }, { status: 400 });
    }

    const ticket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      subject: String(subject).slice(0, 200),
      category: String(category).slice(0, 100),
      message: String(message).slice(0, 5000),
      email: email ? String(email).slice(0, 120) : 'anonymous',
      applicationVersion: '1.0.0',
      scannerVersion: '1.0.0',
      requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    _supportTickets.unshift(ticket);

    trackEvent(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
      type: 'support_ticket',
      category: ticket.category,
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        requestId: ticket.requestId,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
      message: 'Support request received. Our team will review your inquiry.',
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
