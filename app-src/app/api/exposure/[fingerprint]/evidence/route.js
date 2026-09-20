/**
 * app/api/exposure/[fingerprint]/evidence/route.js
 *
 * GET /api/exposure/[fingerprint]/evidence
 * Retrieves all evidence records validating the exposure intelligence of a secret fingerprint.
 */

import { NextResponse } from 'next/server';
import { listEvidenceForFingerprint } from '@/lib/db/exposure';
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

    const evidence = await listEvidenceForFingerprint(fingerprint, {
      organizationId: user?.organizationId || null,
    });

    return NextResponse.json({
      success: true,
      data: evidence,
      total: evidence.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
