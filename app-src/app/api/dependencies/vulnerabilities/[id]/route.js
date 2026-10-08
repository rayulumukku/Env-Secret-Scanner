/**
 * app-src/app/api/dependencies/vulnerabilities/[id]/route.js
 *
 * GET /api/dependencies/vulnerabilities/[id]
 * Returns single dependency vulnerability advisory details and remediation guidance.
 */

import { jsonSuccess, jsonUnauthorized, jsonNotFound, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { getDb } from '@/lib/db/client';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { BUILTIN_ADVISORIES } from '@/lib/dependencies';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access vulnerability details.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:dependencies_vuln_detail:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { id } = params;
    const organizationId = auth.organization.id;
    const { client, isPostgres } = await getDb();

    // Look up in database or advisory database
    let finding = null;
    if (isPostgres) {
      finding = await client.dependencyFinding.findFirst({
        where: { id, organizationId }
      });
    } else {
      finding = client.dependencyFindings.get(id);
      if (finding && finding.organizationId !== organizationId) {
        finding = null;
      }
    }

    // Also look up corresponding advisory metadata
    const advId = finding?.advisoryId || id;
    const advisory = BUILTIN_ADVISORIES.find(a => a.id === advId || a.cveId === advId) || {
      id: advId,
      summary: finding?.packageName ? `Security advisory for ${finding.packageName}` : 'Security Advisory',
      description: 'Advisory details',
      references: [],
      source: 'Security Advisory Database'
    };

    if (!finding && !advisory) {
      return jsonNotFound('Vulnerability advisory not found.');
    }

    return jsonSuccess({
      finding: finding ? {
        ...finding,
        dependencyPath: typeof finding.dependencyPathJson === 'string' ? JSON.parse(finding.dependencyPathJson) : (finding.dependencyPath || []),
        evidence: typeof finding.evidenceJson === 'string' ? JSON.parse(finding.evidenceJson) : (finding.evidence || {})
      } : null,
      advisory,
      remediation: {
        fixedVersion: finding?.fixedVersion || advisory.fixedVersions?.[0] || null,
        upgradeGuidance: finding?.fixedVersion
          ? `Upgrade ${finding.packageName} to version ${finding.fixedVersion} or higher.`
          : 'Upgrade to non-vulnerable version as indicated by upstream vendor.'
      }
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
