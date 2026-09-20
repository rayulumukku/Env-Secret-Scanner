import { NextResponse } from 'next/server';
import { getAllFeatureFlags } from '@/lib/features/flags';
import { isFeatureEnabled } from '@/lib/features/evaluator';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const orgId = searchParams.get('orgId') || undefined;

    const allFlags = getAllFeatureFlags();
    const evaluated = {};

    for (const flag of allFlags) {
      evaluated[flag.key] = isFeatureEnabled(flag.key, { userId, orgId });
    }

    return NextResponse.json({ success: true, features: evaluated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
