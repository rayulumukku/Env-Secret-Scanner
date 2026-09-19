/**
 * @file app/api/repositories/[id]/diff-scan/route.js
 * @description Scans a Git unified diff text for a repository.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { scanGitDiff } from '@/lib/repository/diff/diff-scanner';

export async function POST(req, { params }) {
  const auth = await getAuthContext(req, { requiredPermission: 'SCAN_TRIGGER' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON request body', 'BAD_REQUEST', 400);
  }

  const { diff, severityThreshold, allowlistFingerprints, customRules } = body;

  if (typeof diff !== 'string') {
    return jsonError('Missing "diff" string parameter in body', 'BAD_REQUEST', 400);
  }

  const result = scanGitDiff(diff, {
    severityThreshold: severityThreshold || 'LOW',
    allowlistFingerprints: allowlistFingerprints || [],
    customRules: customRules || []
  });

  return jsonSuccess({
    repositoryId: id,
    ...result
  });
}
