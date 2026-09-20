import { NextResponse } from 'next/server';
import { getActivationFunnel } from '@/lib/analytics/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const validDays = [7, 30, 90].includes(days) ? days : 30;

    const funnel = getActivationFunnel(validDays);
    return NextResponse.json({ success: true, funnel });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
