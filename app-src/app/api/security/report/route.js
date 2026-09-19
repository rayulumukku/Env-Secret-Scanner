/**
 * @file app/api/security/report/route.js
 * @description Executive Security Report generation & export API endpoint (JSON, CSV, HTML).
 */

import { NextResponse } from 'next/server';
import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getSecurityQueueData, getSecurityOverviewData } from '@/lib/security/command-center';
import { generateFindingsCsv, generateSecurityJsonReport, generateExecutiveHtmlReport } from '@/lib/security/export-engine';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'SECURITY_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const severity = searchParams.get('severity') || 'ALL';
  const category = searchParams.get('category') || 'ALL';
  const status = searchParams.get('status') || 'ALL';

  const [queueData, overviewData] = await Promise.all([
    getSecurityQueueData(auth.organization.id, { severity, category, status }),
    getSecurityOverviewData(auth.organization.id)
  ]);

  const reportData = {
    organization: auth.organization,
    filters: { severity, category, status },
    statistics: overviewData.findingsSummary,
    protectionCoverage: overviewData.protectionSummary,
    findings: queueData.findings
  };

  if (format === 'csv') {
    const csvContent = generateFindingsCsv(queueData.findings, reportData);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="secretshield-security-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  if (format === 'html') {
    const htmlContent = generateExecutiveHtmlReport(reportData);
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  // Default JSON
  return jsonSuccess(JSON.parse(generateSecurityJsonReport(reportData)));
}
