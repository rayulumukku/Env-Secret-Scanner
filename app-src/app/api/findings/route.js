/**
 * app/api/findings/route.js
 *
 * Global Organization Findings Center endpoint.
 *
 * Multi-faceted filters:
 *   - projectId
 *   - repositoryId
 *   - severity (CRITICAL, HIGH, MEDIUM, LOW)
 *   - category
 *   - status (OPEN, CONFIRMED, FALSE_POSITIVE, IGNORED, REMEDIATED)
 *   - ruleId
 *   - search (filename, fingerprint, rule, repository)
 *   - sortBy (newest, severity, confidence)
 *   - pagination (page, limit)
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { queryFindings } from '@/lib/db/findings';

export async function GET(req) {
  const auth = await getAuthContext(req, { requiredPermission: 'FINDING_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || undefined;
  const repositoryId = searchParams.get('repositoryId') || undefined;
  const severity = searchParams.get('severity') || undefined;
  const category = searchParams.get('category') || undefined;
  const status = searchParams.get('status') || undefined;
  const ruleId = searchParams.get('ruleId') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortBy = searchParams.get('sortBy') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);

  const results = await queryFindings({
    organizationId: auth.organization.id,
    projectId,
    repositoryId,
    severity,
    category,
    status,
    ruleId,
    search,
    sortBy,
    page,
    limit,
  });

  return jsonSuccess(results);
}
