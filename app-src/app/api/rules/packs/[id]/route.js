import { NextResponse } from 'next/server';
import { getPackById, uninstallPack } from '@/lib/scanner/rule-packs/registry';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const pack = getPackById(id);

    if (!pack) {
      return NextResponse.json(
        { success: false, error: { message: `Rule pack '${id}' not found` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pack,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = uninstallPack(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: { message: `Rule pack '${id}' not found or cannot be removed` } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Rule pack '${id}' uninstalled successfully`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 400 }
    );
  }
}
