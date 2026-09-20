import { NextResponse } from 'next/server';
import { listAnnouncements, createAnnouncement } from '@/lib/announcements/store';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const announcements = listAnnouncements({ type });

    return NextResponse.json({
      success: true,
      announcements,
      count: announcements.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const announcement = createAnnouncement(body);

    logAdminAction('Announcement created', {
      target: announcement.id,
      title: announcement.title,
      type: announcement.type,
    }, body.adminEmail || 'admin@secretshield.local');

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
