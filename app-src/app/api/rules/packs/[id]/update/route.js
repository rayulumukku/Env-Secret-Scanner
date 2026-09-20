import { NextResponse } from 'next/server';
import { getPackById, registerRulePack, lockPackVersion } from '@/lib/scanner/rule-packs/registry';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = getPackById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: `Rule pack '${id}' not found` } },
        { status: 404 }
      );
    }

    // Version locking
    if (body.lockedVersion !== undefined) {
      lockPackVersion(id, body.lockedVersion);
      return NextResponse.json({
        success: true,
        message: body.lockedVersion
          ? `Rule pack '${id}' locked to version ${body.lockedVersion}`
          : `Rule pack '${id}' unlocked`,
      });
    }

    // Manifest update
    if (body.manifest) {
      const updatedRecord = registerRulePack(body.manifest, {
        verifyIntegrity: body.verifyIntegrity !== false,
      });
      return NextResponse.json({
        success: true,
        data: updatedRecord,
        message: `Rule pack '${id}' updated to version ${body.manifest.version}`,
      });
    }

    return NextResponse.json(
      { success: false, error: { message: 'Provide manifest or lockedVersion to update' } },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
