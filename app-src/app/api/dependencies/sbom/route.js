/**
 * app-src/app/api/dependencies/sbom/route.js
 *
 * GET /api/dependencies/sbom
 * Exports Software Bill of Materials (SBOM) in CycloneDX 1.5, SPDX 2.3, or JSON.
 *
 * SECURITY INVARIANT: Never contains secret values or environment credentials.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { scanProjectDependencies, generateSbom } from '@/lib/dependencies';
import { resolve } from 'path';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to export SBOM.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:dependencies_sbom:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'cyclonedx').toLowerCase();
    const repoPath = searchParams.get('path') || process.cwd();

    const scanResult = scanProjectDependencies(resolve(repoPath), {
      checkReachability: false
    });

    const sbomJson = generateSbom(scanResult.graph, format, {
      appName: 'SecretShield',
      version: '2.0.0'
    });

    return new Response(sbomJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sbom-${format}.json"`,
        'X-SecretShield-Privacy': 'Zero Secrets Exported'
      }
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
