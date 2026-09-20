import { NextResponse } from 'next/server';
import { registerRulePack } from '@/lib/scanner/rule-packs/registry';

export async function POST(request) {
  try {
    const body = await request.json();
    const manifest = body.manifest || body;

    if (!manifest || !manifest.id || !Array.isArray(manifest.rules)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid manifest format' } },
        { status: 400 }
      );
    }

    const record = registerRulePack(manifest, {
      verifyIntegrity: body.verifyIntegrity !== false,
      enabled: body.enabled !== false,
    });

    return NextResponse.json({
      success: true,
      data: record,
      message: `Successfully installed rule pack '${manifest.name}' (${manifest.version})`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
