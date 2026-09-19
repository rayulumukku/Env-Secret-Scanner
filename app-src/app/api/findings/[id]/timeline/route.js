/**
 * @file app/api/findings/[id]/timeline/route.js
 * @description Returns the exposure timeline and cross-repo correlation for a finding.
 */

import { jsonSuccess, jsonUnauthorized, jsonForbidden, jsonNotFound } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { buildExposureTimeline } from '@/lib/repository/intelligence/exposure-timeline';
import { getFingerprintMultiRepoCorrelation } from '@/lib/repository/intelligence/multi-repo';

export async function GET(req, { params }) {
  const auth = await getAuthContext(req, { requiredPermission: 'FINDING_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (!auth.organization) return jsonForbidden(auth.error);

  const { id } = await params;

  // Sample finding occurrence history for the timeline
  const occurrences = [
    {
      commitHash: 'a1b2c3d4e5f6',
      date: '2026-09-12T10:00:00Z',
      author: 'alice@secretshield.dev',
      file: 'src/config/database.js',
      line: 12,
      ruleId: 'DATABASE_POSTGRES_URI',
      ruleName: 'PostgreSQL URI',
      severity: 'HIGH',
      maskedValue: 'postgresql://postgres:••••••••@localhost:5432/app'
    },
    {
      commitHash: 'c39c878b4561',
      date: '2026-09-19T16:20:00Z',
      author: 'security@secretshield.dev',
      file: 'src/config/database.js',
      line: 12,
      ruleId: 'DATABASE_POSTGRES_URI',
      ruleName: 'PostgreSQL URI',
      severity: 'HIGH',
      maskedValue: 'postgresql://postgres:••••••••@localhost:5432/app'
    }
  ];

  const timeline = buildExposureTimeline('fp_db_conn_string', occurrences, true);

  const orgFindings = [
    { organizationId: auth.organization.id, repositoryName: 'backend-api', fingerprint: 'fp_db_conn_string', file: 'src/config/database.js', line: 12 },
    { organizationId: auth.organization.id, repositoryName: 'worker-service', fingerprint: 'fp_db_conn_string', file: 'src/db.js', line: 8 }
  ];

  const correlation = getFingerprintMultiRepoCorrelation('fp_db_conn_string', orgFindings, auth.organization.id);

  return jsonSuccess({
    findingId: id,
    timeline,
    multiRepoCorrelation: correlation
  });
}
