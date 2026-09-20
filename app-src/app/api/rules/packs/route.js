import { NextResponse } from 'next/server';
import { getInstalledPacks, registerRulePack } from '@/lib/scanner/rule-packs/registry';
import { saveRulePack, listDbRulePacks } from '@/lib/db/rule-packs';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organizationId');

    const installed = getInstalledPacks({ organizationId: orgId });
    const dbPacks = await listDbRulePacks({ organizationId: orgId });

    return NextResponse.json({
      success: true,
      data: {
        installed,
        custom: dbPacks,
        total: installed.length + dbPacks.length,
      },
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

    if (!body.name || !Array.isArray(body.rules)) {
      return NextResponse.json(
        { success: false, error: { message: 'Rule pack name and rules array are required' } },
        { status: 400 }
      );
    }

    const pack = await saveRulePack({
      ...body,
      author: user?.name || body.author || 'Organization Admin',
      organizationId: body.organizationId || null,
      isPublic: false,
    });

    // Register in memory scanner registry
    registerRulePack(pack, { verifyIntegrity: false, organizationId: body.organizationId });

    return NextResponse.json({
      success: true,
      data: pack,
      message: `Rule pack '${pack.name}' created successfully`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
