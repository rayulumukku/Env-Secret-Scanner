/**
 * app-src/app/api/dependencies/graph/route.js
 *
 * GET /api/dependencies/graph
 * Returns dependency graph nodes and edges for the authenticated organization's repositories.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { scanProjectDependencies } from '@/lib/dependencies';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { resolve } from 'path';

export async function GET(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access dependency graph.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:dependencies_graph:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { searchParams } = new URL(request.url);
    const repoPath = searchParams.get('path') || process.cwd();

    // Deterministically scan and build graph
    const scanResult = scanProjectDependencies(resolve(repoPath), {
      checkReachability: true
    });

    return jsonSuccess({
      graph: scanResult.graph,
      statistics: scanResult.statistics,
      vulnerabilitiesCount: scanResult.vulnerabilities.length,
      heuristicSignalsCount: scanResult.heuristicSignals.length,
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
