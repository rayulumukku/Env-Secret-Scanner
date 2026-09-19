import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCsvCell, generateFindingsCsv, generateSecurityJsonReport, generateExecutiveHtmlReport } from '../export-engine.js';
import {
  getSecurityOverviewData,
  getSecurityQueueData,
  getSecurityRepositoriesData,
  getSecurityTrendsData,
  getSecurityExposureData,
  getSecurityRemediationData,
  getSecurityCIData,
  getSecurityIntegrationsData,
  getSecurityActivityData,
  getSecurityDigestData
} from '../command-center.js';

test('export-engine - sanitizeCsvCell escapes dangerous formula characters (=, +, -, @, \\t, \\r)', () => {
  assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), `"'=SUM(A1:A10)"`);
  assert.equal(sanitizeCsvCell('+cmd|"/c calc"!A0'), `"'+cmd|""/c calc""!A0"`);
  assert.equal(sanitizeCsvCell('-10+20'), `"'-10+20"`);
  assert.equal(sanitizeCsvCell('@attacker'), `"\'@attacker"`);
  assert.equal(sanitizeCsvCell('\tpayload'), `"\'\tpayload"`);
  assert.equal(sanitizeCsvCell('normal text'), `"normal text"`);
  assert.equal(sanitizeCsvCell('text with "quotes"'), `"text with ""quotes"""`);
  assert.equal(sanitizeCsvCell(null), '""');
});

test('export-engine - generateFindingsCsv produces properly formatted and escaped CSV', () => {
  const findings = [
    {
      id: 'f-101',
      fingerprint: 'fp_test_123',
      ruleId: 'aws_access_key',
      ruleName: 'AWS Access Key',
      category: 'CLOUD_PROVIDER',
      severity: 'CRITICAL',
      priorityScore: 90,
      priorityLevel: 'P0_IMMEDIATE',
      confidence: 95,
      repository: 'backend-api',
      file: '=dangerous/path/.env',
      line: 12,
      maskedValue: 'AKIA••••••••EXAMPLE',
      status: 'OPEN',
      priorityFactors: ['Critical severity', 'Active in HEAD']
    }
  ];

  const csv = generateFindingsCsv(findings);
  assert.ok(csv.includes('"Finding ID","Fingerprint","Rule ID"'));
  assert.ok(csv.includes('"f-101"'));
  assert.ok(csv.includes('"\'=dangerous/path/.env"')); // Formula escaped
  assert.ok(csv.includes('"AKIA••••••••EXAMPLE"'));
});

test('export-engine - generateSecurityJsonReport produces valid JSON without leaking raw secrets', () => {
  const reportData = {
    organization: { id: 'org_1', name: 'Acme Corp' },
    filters: { severity: 'ALL' },
    statistics: { total: 1, criticalCount: 1 },
    findings: [
      {
        id: 'f-1',
        fingerprint: 'fp_abc',
        ruleId: 'stripe_live_key',
        ruleName: 'Stripe Secret Key',
        category: 'PAYMENT',
        severity: 'HIGH',
        priorityScore: 85,
        priorityLevel: 'P0_IMMEDIATE',
        confidence: 90,
        file: 'src/billing.js',
        line: 4,
        maskedValue: 'sk_live_••••••••',
        status: 'OPEN'
      }
    ]
  };

  const jsonStr = generateSecurityJsonReport(reportData);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.reportTitle, 'SecretShield Security Report');
  assert.equal(parsed.findings.length, 1);
  assert.equal(parsed.findings[0].maskedValue, 'sk_live_••••••••');
  assert.equal(parsed.findings[0].rawSecret, undefined);
});

test('export-engine - generateExecutiveHtmlReport produces valid HTML markup', () => {
  const reportData = {
    organization: { name: 'Acme Security' },
    statistics: { total: 2, critical: 1, high: 1, medium: 0, low: 0 },
    findings: [
      {
        ruleName: 'GitHub Token',
        file: 'config.json',
        line: 10,
        maskedValue: 'ghp_••••••••',
        severity: 'CRITICAL',
        priorityScore: 88,
        priorityLevel: 'P0_IMMEDIATE',
        status: 'OPEN'
      }
    ]
  };

  const html = generateExecutiveHtmlReport(reportData);
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('Acme Security'));
  assert.ok(html.includes('GitHub Token'));
  assert.ok(html.includes('ghp_••••••••'));
});

test('command-center - returns valid data objects for all overview/reporting aggregators', async () => {
  const orgId = 'org_default';

  const [overview, queue, repos, trends, exposure, remediation, ci, integrations, activity, digest] = await Promise.all([
    getSecurityOverviewData(orgId),
    getSecurityQueueData(orgId),
    getSecurityRepositoriesData(orgId),
    getSecurityTrendsData(orgId),
    getSecurityExposureData(orgId),
    getSecurityRemediationData(orgId),
    getSecurityCIData(orgId),
    getSecurityIntegrationsData(orgId),
    getSecurityActivityData(orgId),
    getSecurityDigestData(orgId)
  ]);

  assert.ok(overview.protectionSummary);
  assert.ok(overview.findingsSummary);
  assert.ok(Array.isArray(queue.findings));
  assert.ok(Array.isArray(repos));
  assert.ok(Array.isArray(trends.timeline));
  assert.ok(Array.isArray(exposure.exposures));
  assert.ok(remediation.resolutionRate);
  assert.ok(ci.summary);
  assert.ok(Array.isArray(integrations.integrations));
  assert.ok(Array.isArray(activity));
  assert.ok(digest.digestStatement);
});
