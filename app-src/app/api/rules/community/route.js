import { NextResponse } from 'next/server';
import { createRuleSubmission, listRuleSubmissions } from '@/lib/db/rule-packs';
import { validateRule } from '../../../../../packages/rules/src/schema.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const submissions = await listRuleSubmissions({ status });
    return NextResponse.json({
      success: true,
      data: submissions,
      total: submissions.length,
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
    const body = await request.json();

    if (!body.name || !body.author || !Array.isArray(body.rules) || body.rules.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Submission name, author, and rules array are required' } },
        { status: 400 }
      );
    }

    // Validate each rule in submission
    for (let i = 0; i < body.rules.length; i++) {
      const r = body.rules[i];
      const val = validateRule(r);
      if (!val.valid) {
        return NextResponse.json(
          { success: false, error: { message: `Rule #${i + 1} validation failed: ${val.errors.join('; ')}` } },
          { status: 400 }
        );
      }
    }

    const sub = await createRuleSubmission(body);
    return NextResponse.json({
      success: true,
      data: sub,
      message: 'Rule submission received and submitted for automated testing & security review',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
