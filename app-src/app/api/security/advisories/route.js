/**
 * app/api/security/advisories/route.js
 *
 * GET /api/security/advisories - List SecretShield security advisories
 * POST /api/security/advisories - Publish a verified security advisory
 */

import { NextResponse } from 'next/server';
import { listSecurityAdvisoriesDb } from '@/lib/db/trust';
import { createSecurityAdvisory } from '@/lib/trust/advisories';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const advisories = await listSecurityAdvisoriesDb();
    return NextResponse.json({
      success: true,
      data: advisories,
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

    const advisory = createSecurityAdvisory({
      advisoryId: body.advisoryId,
      title: body.title,
      affectedVersion: body.affectedVersion,
      fixedVersion: body.fixedVersion,
      severity: body.severity,
      description: body.description,
      impact: body.impact,
      mitigation: body.mitigation,
      references: body.references || [],
    });

    return NextResponse.json({
      success: true,
      data: advisory,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
