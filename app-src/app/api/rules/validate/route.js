import { NextResponse } from 'next/server';
import { validateRule, validateRulePackManifest, validateRegexSafety } from '../../../../../packages/rules/src/schema.js';

export async function POST(request) {
  try {
    const body = await request.json();

    // If body contains 'rules' array, validate as full manifest
    if (body.rules && Array.isArray(body.rules)) {
      const result = validateRulePackManifest(body);
      return NextResponse.json({
        success: result.valid,
        data: {
          type: 'manifest',
          valid: result.valid,
          errors: result.errors,
          ruleCount: body.rules.length,
        },
      });
    }

    // If body has a single pattern, validate as rule or regex
    if (body.pattern || body.patterns) {
      const result = validateRule(body);
      return NextResponse.json({
        success: result.valid,
        data: {
          type: 'rule',
          valid: result.valid,
          errors: result.errors,
        },
      });
    }

    // Direct regex string validation
    if (body.regex) {
      const result = validateRegexSafety(body.regex);
      return NextResponse.json({
        success: result.safe,
        data: {
          type: 'regex',
          safe: result.safe,
          error: result.error,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: { message: 'Provide rule object, manifest, or regex to validate' } },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
