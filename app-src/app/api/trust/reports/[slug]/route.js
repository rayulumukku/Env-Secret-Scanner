/**
 * app/api/trust/reports/[slug]/route.js
 *
 * GET /api/trust/reports/:slug - Get sanitized shareable trust report by slug
 */

import { NextResponse } from 'next/server';
import { getTrustReportBySlugDb } from '@/lib/db/trust';
import { formatReportOutput } from '@/lib/trust/reports';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const report = await getTrustReportBySlugDb(slug);
    if (!report) {
      return NextResponse.json(
        { success: false, error: { message: 'Trust report not found or expired' } },
        { status: 404 }
      );
    }

    if (format === 'html') {
      const htmlOutput = formatReportOutput({ ...report, format: 'html' });
      return new NextResponse(htmlOutput, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err.message } },
      { status: 500 }
    );
  }
}
