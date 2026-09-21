/**
 * app/api/trust/reports/route.js
 *
 * GET /api/trust/reports - List generated trust reports
 * POST /api/trust/reports - Generate a new sanitized trust/compliance report
 */

import { NextResponse } from 'next/server';
import { listTrustReportsDb, saveTrustReportDb, listControlsDb, listQuestionnaireDb } from '@/lib/db/trust';
import { generateTrustReport, formatReportOutput } from '@/lib/trust/reports';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get('organizationId') || user?.organizationId || 'default-org';
    const reportType = searchParams.get('reportType');

    const reports = await listTrustReportsDb({ organizationId, reportType });

    return NextResponse.json({
      success: true,
      data: reports,
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
    const reportType = body.reportType || 'SECURITY_OVERVIEW';
    const format = body.format || 'html';

    // Fetch live data snapshot
    const [controls, questions] = await Promise.all([
      listControlsDb({ organizationId }),
      listQuestionnaireDb({ organizationId }),
    ]);

    const reportPayload = {
      controlsSummary: {
        total: controls.length,
        implemented: controls.filter(c => c.implementationStatus === 'IMPLEMENTED').length,
        partiallyImplemented: controls.filter(c => c.implementationStatus === 'PARTIALLY_IMPLEMENTED').length,
      },
      controlsList: controls.map(c => ({ code: c.code, name: c.name, status: c.implementationStatus, category: c.category })),
      questionnaireSummary: {
        totalQuestions: questions.length,
        verifiedYes: questions.filter(q => q.answer === 'YES').length,
      },
      selectedCustomSections: body.sections || ['Security Architecture', 'Encryption', 'Access Control'],
    };

    const reportObj = generateTrustReport({
      organizationId,
      reportType,
      title: body.title || `${reportType.replace(/_/g, ' ')} Report`,
      scope: body.scope || 'Organization Wide',
      format,
      data: reportPayload,
      generatedBy: user?.name || user?.email || 'Security Officer',
    });

    const saved = await saveTrustReportDb(reportObj);

    if (format === 'html' && body.download) {
      const htmlOutput = formatReportOutput(saved);
      return new NextResponse(htmlOutput, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="${reportObj.shareableSlug}.html"`,
        },
      });
    }

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
