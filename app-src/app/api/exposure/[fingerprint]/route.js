/**
 * app/api/exposure/[fingerprint]/route.js
 *
 * GET /api/exposure/[fingerprint]
 * Retrieves detailed exposure intelligence for a specific secret fingerprint.
 */

import { NextResponse } from 'next/server';
import { getExposureClusterByFingerprint } from '@/lib/db/exposure';
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

    const cluster = await getExposureClusterByFingerprint(fingerprint, {
      organizationId: user?.organizationId || null,
    });

    if (!cluster) {
      return NextResponse.json(
        { success: false, error: { message: `Exposure cluster not found for fingerprint: ${fingerprint}` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cluster,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
