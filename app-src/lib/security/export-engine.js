/**
 * @file lib/security/export-engine.js
 * @description Multi-format Security Report Export Engine (CSV, JSON, HTML).
 * 
 * SECURITY & SPREADSHEET FORMULA INJECTION PREVENTION:
 *   - Any CSV cell starting with '=', '+', '-', '@', '\t', '\r' is prefixed with "'" (single quote)
 *     to prevent CSV/DDE formula injection attacks in Excel, LibreOffice, and Google Sheets.
 *   - Strictly outputs masked values and deterministic fingerprints.
 *   - NEVER includes raw secret credentials in any export format.
 */

import { SCANNER_VERSION, RULE_VERSION } from '../version.js';

/**
 * Sanitizes a string for CSV cell insertion to prevent CSV formula injection.
 * 
 * @param {any} value 
 * @returns {string} Sanitized CSV-safe string
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Check for formula injection triggers at beginning of cell
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (str.length > 0 && formulaChars.includes(str[0])) {
    str = `'${str}`; // Escape with leading quote
  }

  // Escape internal double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates a sanitized CSV report from finding records.
 * 
 * @param {Array<Object>} findings 
 * @param {Object} [metadata]
 * @returns {string} CSV text
 */
export function generateFindingsCsv(findings = [], metadata = {}) {
  const headers = [
    'Finding ID',
    'Fingerprint',
    'Rule ID',
    'Rule Name',
    'Category',
    'Severity',
    'Priority Score',
    'Priority Level',
    'Confidence',
    'Repository',
    'File Path',
    'Line Number',
    'Masked Credential',
    'Status',
    'Exposure Status',
    'First Seen Date',
    'First Seen Commit',
    'Priority Rationale'
  ];

  const rows = [headers.map(sanitizeCsvCell).join(',')];

  for (const f of findings) {
    const factors = Array.isArray(f.priorityFactors) ? f.priorityFactors.join('; ') : '';
    const row = [
      f.id || '',
      f.fingerprint || '',
      f.ruleId || '',
      f.ruleName || f.ruleId || '',
      f.category || 'General',
      f.severity || 'LOW',
      f.priorityScore || 0,
      f.priorityLevel || 'P3_LOW',
      `${f.confidence || 50}%`,
      f.repositoryName || f.repository || 'default',
      f.file || '',
      f.line || 1,
      f.maskedValue || '••••••••',
      f.status || 'OPEN',
      f.exposureStatus || (f.isRemovedFromCurrentSource ? 'REMOVED_FROM_CURRENT_SOURCE' : 'ACTIVE'),
      f.firstSeenDate || '',
      f.firstSeenCommit || '',
      factors
    ];
    rows.push(row.map(sanitizeCsvCell).join(','));
  }

  return rows.join('\n');
}

/**
 * Generates a structured JSON security report.
 * 
 * @param {Object} reportData 
 * @returns {string} Formatted JSON
 */
export function generateSecurityJsonReport(reportData = {}) {
  const safeData = {
    reportTitle: 'SecretShield Security Report',
    generatedAt: new Date().toISOString(),
    scannerVersion: SCANNER_VERSION,
    ruleVersion: RULE_VERSION,
    organization: reportData.organization || 'Organization',
    filtersApplied: reportData.filters || {},
    statistics: reportData.statistics || {},
    protectionCoverage: reportData.protectionCoverage || {},
    remediationMetrics: reportData.remediationMetrics || {},
    findings: (reportData.findings || []).map(f => ({
      id: f.id,
      fingerprint: f.fingerprint,
      ruleId: f.ruleId,
      ruleName: f.ruleName,
      category: f.category,
      severity: f.severity,
      priorityScore: f.priorityScore,
      priorityLevel: f.priorityLevel,
      priorityFactors: f.priorityFactors,
      confidence: f.confidence,
      file: f.file,
      line: f.line,
      maskedValue: f.maskedValue,
      status: f.status,
      exposureStatus: f.exposureStatus,
      firstSeenDate: f.firstSeenDate,
      firstSeenCommit: f.firstSeenCommit
    }))
  };

  return JSON.stringify(safeData, null, 2);
}

/**
 * Generates a standalone, printable Executive Security Report in HTML format.
 * 
 * @param {Object} reportData 
 * @returns {string} HTML string
 */
export function generateExecutiveHtmlReport(reportData = {}) {
  const findings = reportData.findings || [];
  const stats = reportData.statistics || { total: findings.length, critical: 0, high: 0, medium: 0, low: 0 };
  const orgName = reportData.organization?.name || 'Organization';
  const genDate = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SecretShield Executive Security Report — ${orgName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #0f172a; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; color: #0f172a; }
    .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .metric { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; }
    .metric-val { font-size: 20px; font-weight: bold; color: #0f172a; }
    .metric-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { text-align: left; background: #f1f5f9; padding: 8px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #e0f2fe; color: #075985; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🛡️ SecretShield Executive Security Report</div>
    <div class="meta">Organization: <strong>${orgName}</strong> &bull; Generated: ${genDate} &bull; Scanner v${SCANNER_VERSION} (Rules ${RULE_VERSION})</div>
  </div>

  <div class="card">
    <h3 style="margin-top:0; font-size: 16px;">Executive Summary</h3>
    <p style="font-size: 13px; color: #334155;">
      During the evaluated reporting period, SecretShield inspected repository source files, commits, and pull requests.
      A total of <strong>${stats.total}</strong> active finding(s) were identified across evaluated repositories.
    </p>
    <div class="grid">
      <div class="metric"><div class="metric-val" style="color:#dc2626;">${stats.critical || 0}</div><div class="metric-lbl">Critical</div></div>
      <div class="metric"><div class="metric-val" style="color:#ea580c;">${stats.high || 0}</div><div class="metric-lbl">High</div></div>
      <div class="metric"><div class="metric-val" style="color:#d97706;">${stats.medium || 0}</div><div class="metric-lbl">Medium</div></div>
      <div class="metric"><div class="metric-val" style="color:#0284c7;">${stats.low || 0}</div><div class="metric-lbl">Low</div></div>
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top:0; font-size: 16px;">Findings Queue & Remediation Status</h3>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Rule</th>
          <th>File & Line</th>
          <th>Masked Credential</th>
          <th>Priority</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${findings.slice(0, 50).map(f => `
          <tr>
            <td><span class="badge badge-${(f.severity || 'low').toLowerCase()}">${f.severity}</span></td>
            <td><strong>${f.ruleName || f.ruleId}</strong></td>
            <td><code>${f.file}:${f.line || 1}</code></td>
            <td><code>${f.maskedValue}</code></td>
            <td>${f.priorityLevel || 'P2'} (${f.priorityScore || 50} pts)</td>
            <td>${f.status || 'OPEN'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    SecretShield &bull; Privacy-first deterministic secret detection &bull; Confidential
  </div>
</body>
</html>`;
}
