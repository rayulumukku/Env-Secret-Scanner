import { NextResponse } from 'next/server';
import { getAllFeatureFlags, updateFeatureFlag } from '@/lib/features/flags';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET() {
  try {
    const flags = getAllFeatureFlags();
    return NextResponse.json({ success: true, flags });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { key, enabled, rules, adminEmail } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Feature flag key is required' }, { status: 400 });
    }

    const updated = updateFeatureFlag(key, { enabled, rules });

    logAdminAction('Feature flag changed', {
      target: key,
      enabled: updated.enabled,
    }, adminEmail || 'admin@secretshield.local');

    return NextResponse.json({ success: true, flag: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
