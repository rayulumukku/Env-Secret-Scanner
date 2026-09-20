/**
 * app/api/exposure/[fingerprint]/timeline/route.js
 *
 * GET /api/exposure/[fingerprint]/timeline
 * Retrieves the chronological evidence-backed timeline for a secret fingerprint.
 */

import { NextResponse } from 'next/server';
import { getExposureTimeline } from '@/lib/db/exposure';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    const { fingerprint } = await params;

    if (!fingerprint) {
      return NextResponse.json(
        { success: false, error: { message: 'Fingerprint is required' } },
        { status: 400 }
      );
    }

    const timeline = await getExposureTimeline(fingerprint, {
      organizationId: user?.organizationId || null,
    });

    return NextResponse.json({
      success: true,
      data: timeline,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
