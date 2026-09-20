import { NextResponse } from 'next/server';
import { getMaintenanceState, setMaintenanceMode } from '@/lib/maintenance/state';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET() {
  try {
    const state = getMaintenanceState();
    return NextResponse.json({ success: true, maintenance: state });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { enabled, message, estimatedEndTime, adminEmail } = body;

    const state = setMaintenanceMode(enabled, { message, estimatedEndTime, adminEmail });

    logAdminAction(enabled ? 'Maintenance enabled' : 'Maintenance disabled', {
      target: 'system',
      message: state.message,
    }, adminEmail || 'admin@secretshield.local');

    return NextResponse.json({ success: true, maintenance: state });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
