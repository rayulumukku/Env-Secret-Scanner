/**
 * app/api/exposure/[fingerprint]/investigate/route.js
 *
 * POST /api/exposure/[fingerprint]/investigate
 * Updates the investigation lifecycle status or note for a specific secret fingerprint.
 */

import { NextResponse } from 'next/server';
import { memoryDb } from '@/lib/db/client';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    const { fingerprint } = await params;
    const body = await request.json();

    if (!fingerprint) {
      return NextResponse.json(
        { success: false, error: { message: 'Fingerprint is required' } },
        { status: 400 }
      );
    }

    const investigationId = `inv_${fingerprint}`;
    const investigation = {
      id: investigationId,
      fingerprint,
      organizationId: user?.organizationId || 'default-org',
      assignedTo: body.assignedTo || user?.name || 'Security Analyst',
      status: body.status || 'IN_PROGRESS', // OPEN | IN_PROGRESS | RESOLVED | FALSE_POSITIVE
      notes: body.notes || '',
      updatedAt: new Date().toISOString(),
      updatedBy: user?.name || 'admin',
    };

    memoryDb.investigations.set(fingerprint, investigation);

    return NextResponse.json({
      success: true,
      data: investigation,
      message: 'Investigation state updated successfully',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
