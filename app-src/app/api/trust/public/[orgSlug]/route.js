/**
 * app/api/trust/public/[orgSlug]/route.js
 *
 * GET /api/trust/public/:orgSlug
 * Public endpoint displaying only explicitly published controls and evidence categories.
 */

import { NextResponse } from 'next/server';
import { listControlsDb, listControlEvidenceDb } from '@/lib/db/trust';
import { buildPublicTrustProfile } from '@/lib/trust/public-trust';

export async function GET(request, { params }) {
  try {
    const { orgSlug } = await params;

    // Fetch public controls and public evidence
    const [controls, evidenceList] = await Promise.all([
      listControlsDb({ isPublic: true }),
      listControlEvidenceDb({ isPublic: true }),
    ]);

    const orgMock = {
      name: orgSlug.toUpperCase(),
      slug: orgSlug,
    };

    const publicProfile = buildPublicTrustProfile(orgMock, controls, evidenceList);

    return NextResponse.json({
      success: true,
      data: publicProfile,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
