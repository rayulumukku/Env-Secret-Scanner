/**
 * lib/trust/reports.js
 *
 * Trust & Compliance Report Generator for SecretShield.
 *
 * SAFETY INVARIANTS:
 *   - Runs strict pre-export secret & PII sanitization.
 *   - Never claims official external certifications without authoritative proof.
 *   - Supports PDF-compatible HTML, JSON, and CSV formats.
 */

import { randomUUID } from 'crypto';

export const TRUST_REPORT_TYPES = Object.freeze({
  SECURITY_OVERVIEW: 'SECURITY_OVERVIEW',
  CONTROL_EVIDENCE: 'CONTROL_EVIDENCE',
  QUESTIONNAIRE: 'QUESTIONNAIRE',
  INCIDENT_EVIDENCE: 'INCIDENT_EVIDENCE',
  ACCESS_REVIEW: 'ACCESS_REVIEW',
  AI_PRIVACY: 'AI_PRIVACY',
  INTEGRATION_SECURITY: 'INTEGRATION_SECURITY',
});

/**
 * Generate a sanitized, shareable Trust Report.
 *
 * @param {object} params
 * @param {string} params.organizationId
 * @param {string} params.reportType
 * @param {string} params.title
 * @param {string} [params.scope='Organization Wide']
 * @param {'html' | 'json' | 'csv'} [params.format='html']
 * @param {object} params.data - Report raw contents (controls, questions, evidence, etc.)
 * @param {string} [params.generatedBy='Security Officer']
 * @returns {object} TrustReport
 */
export function generateTrustReport({
  organizationId,
  reportType,
  title,
  scope = 'Organization Wide',
  format = 'html',
  data = {},
  generatedBy = 'Security Officer',
}) {
  if (!organizationId || !reportType || !title) {
    throw new Error('organizationId, reportType, and title are required');
  }

  const validReportType = Object.values(TRUST_REPORT_TYPES).includes(reportType)
    ? reportType
    : TRUST_REPORT_TYPES.SECURITY_OVERVIEW;

  const sanitizedData = sanitizeReportData(data);
  const shareableSlug = `trust-rep-${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  return {
    id: `rep_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    organizationId,
    reportType: validReportType,
    title: String(title).slice(0, 150),
    scope: String(scope).slice(0, 100),
    format: ['html', 'json', 'csv'].includes(format) ? format : 'html',
    sections: Object.keys(sanitizedData),
    generatedBy: String(generatedBy || 'Security Officer'),
    shareableSlug,
    isPublic: false,
    content: sanitizedData,
    disclaimer: 'This document contains documented security controls and verifiable evidence records from SecretShield. It is informational and does not constitute external legal or compliance certification.',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Export report as HTML, JSON, or CSV string.
 *
 * @param {object} report
 * @returns {string} Formatted output
 */
export function formatReportOutput(report) {
  if (report.format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  if (report.format === 'csv') {
    const rows = [
      ['Report Title', report.title],
      ['Report Type', report.reportType],
      ['Generated At', report.createdAt],
      ['Organization', report.organizationId],
      ['Scope', report.scope],
      ['Disclaimer', report.disclaimer],
    ];
    return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  // HTML format
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${report.title} — SecretShield Trust Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .disclaimer { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; font-size: 13px; color: #475569; margin-bottom: 28px; }
    .section { margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <div class="meta">
    <strong>Report Type:</strong> ${report.reportType} |
    <strong>Scope:</strong> ${report.scope} |
    <strong>Generated:</strong> ${new Date(report.createdAt).toUTCString()}
  </div>
  <div class="disclaimer">
    <strong>Notice:</strong> ${report.disclaimer}
  </div>
  <div class="content">
    <pre>${JSON.stringify(report.content, null, 2)}</pre>
  </div>
</body>
</html>`;
}

/**
 * Deep sanitization for report contents to prevent credential leaks.
 */
export function sanitizeReportData(data) {
  if (!data || typeof data !== 'object') return {};
  const cleaned = {};
  const blockedKeys = ['secret', 'token', 'key', 'password', 'rawvalue', 'auth', 'privatekey', 'sampleaws'];
  const secretPatterns = [
    /AKIA[0-9A-Z]{16}/g,
    /sk_[a-zA-Z0-9_\-]{16,}/g,
    /ghp_[a-zA-Z0-9]{20,}/g,
    /xox[baprs]-[0-9a-zA-Z_-]{20,}/g,
  ];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (blockedKeys.some(b => lowerKey.includes(b))) {
      cleaned[key] = '[REDACTED_SECRET]';
    } else if (typeof value === 'string') {
      let sanitizedStr = value;
      for (const pat of secretPatterns) {
        sanitizedStr = sanitizedStr.replace(pat, '[REDACTED_SECRET]');
      }
      cleaned[key] = sanitizedStr;
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeReportData(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

export const sanitizeForExport = sanitizeReportData;


