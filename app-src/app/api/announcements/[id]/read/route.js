import { NextResponse } from 'next/server';
import { getAnnouncementById } from '@/lib/announcements/store';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const announcement = getAnnouncementById(id);
    if (!announcement) {
      return NextResponse.json({ success: false, error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id,
      read: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
