import { NextResponse } from 'next/server';
import { getAdminAuditLogs } from '@/lib/admin/audit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const logs = getAdminAuditLogs(Math.min(limit, 500));

    return NextResponse.json({ success: true, logs, count: logs.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
