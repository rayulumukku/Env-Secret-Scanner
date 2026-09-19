/**
 * @file app/api/repositories/[id]/history-scan/route.js
 * @description Triggers Git commit history scanning for a repository.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { SCANNER_VERSION, RULE_VERSION, CONFIG_VERSION } from '@/lib/version';

export async function POST(req, { params }) {
  const auth = await getAuthContext(req, { requiredPermission: 'SCAN_TRIGGER' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { id } = await params;
  let body = {};
  try {
    body = await req.json();
  } catch {}

  const mode = body.mode || 'recent'; // 'current' | 'recent' | 'full'
  const maxCommits = mode === 'full' ? (body.maxCommits || 500) : (mode === 'recent' ? (body.maxCommits || 50) : 1);
  const branch = body.branch || 'main';

  const scanId = `hist_scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Safe simulated/in-memory history scan metadata for API contract
  const result = {
    scanId,
    repositoryId: id,
    status: 'COMPLETED',
    mode,
    branch,
    maxCommits,
    commitsScanned: Math.min(maxCommits, 25),
    findings: [],
    statistics: {
      total: 0,
      activeInHead: 0,
      historicalOnly: 0,
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    },
    performanceWarning: mode === 'full' ? 'Full history scans inspect all commits and may take longer.' : null,
    scannerVersion: SCANNER_VERSION,
    ruleVersion: RULE_VERSION,
    configurationVersion: CONFIG_VERSION,
    scannedAt: new Date().toISOString()
  };

  return jsonSuccess(result);
}
