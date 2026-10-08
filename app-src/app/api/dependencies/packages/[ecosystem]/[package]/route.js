/**
 * app-src/app/api/dependencies/packages/[ecosystem]/[package]/route.js
 *
 * GET /api/dependencies/packages/[ecosystem]/[package]
 * Returns detailed intelligence for a specific package in an ecosystem.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import {
  classifyLicense,
  detectTyposquatting,
  BUILTIN_ADVISORIES
} from '@/lib/dependencies';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to access package intelligence.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:dependencies_pkg:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const { ecosystem, package: packageName } = params;
    const decodedPackage = decodeURIComponent(packageName);
    const decodedEcosystem = decodeURIComponent(ecosystem);

    // 1. Advisories for package
    const advisories = BUILTIN_ADVISORIES.filter(
      a => a.ecosystem === decodedEcosystem && a.package.toLowerCase() === decodedPackage.toLowerCase()
    );

    // 2. Typosquatting Analysis
    const typoCheck = detectTyposquatting(decodedPackage, decodedEcosystem);

    // 3. Default License
    const licenseInfo = classifyLicense(decodedEcosystem === 'npm' ? 'MIT' : 'Apache-2.0');

    return jsonSuccess({
      package: decodedPackage,
      ecosystem: decodedEcosystem,
      license: licenseInfo,
      advisories,
      heuristics: {
        isTyposquatCandidate: typoCheck.isTyposquatCandidate,
        referencePackage: typoCheck.referencePackage,
        reason: typoCheck.reason,
      },
      remediation: {
        fixAvailable: advisories.some(a => a.fixedVersions?.length > 0),
        recommendedVersion: advisories[0]?.fixedVersions?.[0] || null,
      }
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
