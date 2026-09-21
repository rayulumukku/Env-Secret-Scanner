/**
 * app/api/trust/access-reviews/route.js
 *
 * GET /api/trust/access-reviews - List access reviews
 * POST /api/trust/access-reviews - Create a new access review ticket
 */

import { NextResponse } from 'next/server';
import { listAccessReviewsDb, saveAccessReviewDb } from '@/lib/db/trust';
import { createAccessReview } from '@/lib/trust/access-reviews';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || 'default-org';
    const status = searchParams.get('status');

    const reviews = await listAccessReviewsDb({ organizationId, status });

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const organizationId = body.organizationId || user?.organizationId || 'default-org';
    const review = createAccessReview({
      organizationId,
      targetType: body.targetType,
      targetId: body.targetId,
      targetName: body.targetName,
      currentRole: body.currentRole,
      dueDays: body.dueDays || 90,
    });

    const saved = await saveAccessReviewDb(review);

    return NextResponse.json({
      success: true,
      data: saved,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
