/**
 * app/api/trust/questionnaire/route.js
 *
 * GET /api/trust/questionnaire - List questionnaire answers
 * PATCH /api/trust/questionnaire - Update questionnaire answer
 */

import { NextResponse } from 'next/server';
import { listQuestionnaireDb, updateQuestionnaireDb } from '@/lib/db/trust';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || 'default-org';
    const category = searchParams.get('category');

    const questions = await listQuestionnaireDb({ organizationId, category });

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const organizationId = user?.organizationId || 'default-org';
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Question ID is required' } },
        { status: 400 }
      );
    }

    const updated = await updateQuestionnaireDb(body.id, organizationId, {
      answer: body.answer,
      explanation: body.explanation,
      evidenceIds: body.evidenceIds,
      owner: user?.name || user?.email || 'Security Officer',
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: 'Question not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
