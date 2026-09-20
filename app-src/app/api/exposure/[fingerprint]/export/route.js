/**
 * app/api/exposure/[fingerprint]/export/route.js
 *
 * POST /api/exposure/[fingerprint]/export
 * Exports sanitized exposure timeline and cluster data in JSON, CSV, or HTML.
 */

import { NextResponse } from 'next/server';
import { getExposureClusterByFingerprint, getExposureTimeline } from '@/lib/db/exposure';
import { sanitizeForExport, formatExposureCsv, formatExposureHtml } from '@/lib/exposure/sanitizer';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    const { fingerprint } = await params;
    const body = await request.json().catch(() => ({}));
    const format = (body.format || 'json').toLowerCase();

    if (!fingerprint) {
      return NextResponse.json(
        { success: false, error: { message: 'Fingerprint is required' } },
        { status: 400 }
      );
    }

    const cluster = await getExposureClusterByFingerprint(fingerprint, {
      organizationId: user?.organizationId || null,
    });
    const timeline = await getExposureTimeline(fingerprint, {
      organizationId: user?.organizationId || null,
    });

    if (!cluster) {
      return NextResponse.json(
        { success: false, error: { message: 'Exposure cluster not found' } },
        { status: 404 }
      );
    }

    // 1. CSV Format
    if (format === 'csv') {
      const csv = formatExposureCsv([cluster]);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="exposure-${fingerprint}.csv"`,
        },
      });
    }

    // 2. HTML / Print Format
    if (format === 'html') {
      const html = formatExposureHtml(timeline);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // 3. JSON Format (default, fully sanitized)
    const exportData = sanitizeForExport({
      reportType: 'SecretShield Exposure Intelligence Report',
      generatedAt: new Date().toISOString(),
      cluster,
      timeline,
    });

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
