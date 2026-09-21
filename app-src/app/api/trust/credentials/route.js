/**
 * app/api/trust/credentials/route.js
 *
 * GET /api/trust/credentials - List metadata-only credential inventory
 * POST /api/trust/credentials - Add credential inventory entry
 */

import { NextResponse } from 'next/server';
import { listCredentialInventoryDb, saveCredentialInventoryDb } from '@/lib/db/trust';
import { createCredentialInventoryRecord } from '@/lib/trust/credentials';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || 'default-org';
    const status = searchParams.get('status');

    const creds = await listCredentialInventoryDb({ organizationId, rotationStatus: status });

    return NextResponse.json({
      success: true,
      data: creds,
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
    const record = createCredentialInventoryRecord({
      organizationId,
      credentialType: body.credentialType,
      provider: body.provider,
      owner: body.owner,
      locationMetadata: body.locationMetadata,
      fingerprint: body.fingerprint,
      rotationStatus: body.rotationStatus,
      expiresAt: body.expiresAt,
    });

    const saved = await saveCredentialInventoryDb(record);

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
