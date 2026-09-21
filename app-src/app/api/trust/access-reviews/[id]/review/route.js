/**
 * app/api/trust/access-reviews/[id]/review/route.js
 *
 * POST /api/trust/access-reviews/:id/review
 * Submits an access review verdict (REVIEWED or REVOKED).
 */

import { NextResponse } from 'next/server';
import { listAccessReviewsDb } from '@/lib/db/trust';
import { processAccessReviewVerdict } from '@/lib/trust/access-reviews';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    const body = await request.json();
    const organizationId = user?.organizationId || 'default-org';

    const reviews = await listAccessReviewsDb({ organizationId });
    const targetReview = reviews.find(r => r.id === id);

    if (!targetReview) {
      return NextResponse.json(
        { success: false, error: { message: 'Access review record not found' } },
        { status: 404 }
      );
    }

    const updated = processAccessReviewVerdict(
      targetReview,
      body.verdict || 'REVIEWED',
      user?.name || user?.email || 'Authorized Administrator',
      body.notes || ''
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
