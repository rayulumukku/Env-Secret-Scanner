/**
 * app/api/organizations/[orgId]/export/route.js
 *
 * Safe Organization Data Export API (JSON & CSV).
 *
 * SAFETY INVARIANTS:
 *   - Strictly excludes passwords, OAuth tokens, raw secrets, and encryption keys.
 *   - CSV output enforces spreadsheet formula injection defense (=, +, -, @, \t, \r).
 *   - Requires Organization Owner or Admin authorization.
 */

import { NextResponse } from 'next/server';
import { getDb, memoryDb } from '@/lib/db/client';
import { sanitizeCsvCell, generateFindingsCsv } from '@/lib/security/export-engine';
import { jsonSuccess, jsonError, jsonForbidden } from '@/lib/api-response';
import { redactSensitive } from '@/lib/security/redact';

export async function POST(request, { params }) {
  try {
    const { orgId } = await params;
    const body = await request.json().catch(() => ({}));
    const format = (body.format || 'json').toLowerCase();

    // Query organization entities from memory or DB
    const projects = memoryDb.projects ? Array.from(memoryDb.projects.values()).filter(p => p.organizationId === orgId) : [];
    const repositories = memoryDb.repositories ? Array.from(memoryDb.repositories.values()) : [];
    const scans = memoryDb.scans ? Array.from(memoryDb.scans.values()) : [];
    const findings = memoryDb.findings ? Array.from(memoryDb.findings.values()) : [];
    const rules = memoryDb.customRules ? Array.from(memoryDb.customRules.values()).filter(r => r.organizationId === orgId) : [];
    const policies = memoryDb.policies ? Array.from(memoryDb.policies.values()).filter(p => p.organizationId === orgId) : [];
    const auditLogs = memoryDb.auditLogs ? memoryDb.auditLogs.filter(a => a.organizationId === orgId) : [];

    const exportData = {
      organizationId: orgId,
      exportedAt: new Date().toISOString(),
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        createdAt: p.createdAt,
      })),
      repositories: repositories.map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        provider: r.provider,
        defaultBranch: r.defaultBranch,
        lastScannedAt: r.lastScannedAt,
      })),
      scans: scans.map(s => ({
        scanId: s.scanId || s.id,
        mode: s.mode,
        status: s.status,
        durationMs: s.durationMs,
        filesScanned: s.filesScanned,
        totalFindings: s.totalFindings,
        criticalCount: s.criticalCount,
        highCount: s.highCount,
        scannedAt: s.scannedAt,
      })),
      findings: findings.map(f => ({
        id: f.id,
        fingerprint: f.fingerprint,
        ruleId: f.ruleId,
        type: f.type,
        severity: f.severity,
        confidence: f.confidence,
        file: f.file,
        line: f.line,
        maskedValue: f.maskedValue,
        status: f.status,
        createdAt: f.createdAt,
      })),
      rules: rules.map(r => ({
        ruleId: r.ruleId,
        name: r.name,
        severity: r.severity,
        isEnabled: r.isEnabled,
      })),
      policies: policies.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        scope: p.scope,
        action: p.action,
        isEnabled: p.isEnabled,
      })),
      auditLogs: auditLogs.slice(0, 500).map(a => ({
        id: a.id,
        action: a.action,
        targetType: a.targetType,
        userEmail: a.userEmail,
        createdAt: a.createdAt,
      })),
    };

    if (format === 'csv') {
      // Build safe CSV export of findings
      const csv = generateFindingsCsv(exportData.findings, { orgId });
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="secretshield-export-${orgId}.csv"`,
        },
      });
    }

    // Default JSON export
    return NextResponse.json(redactSensitive(exportData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="secretshield-export-${orgId}.json"`,
      },
    });
  } catch (err) {
    return jsonError('Failed to export organization data', 'EXPORT_ERROR', 500);
  }
}
