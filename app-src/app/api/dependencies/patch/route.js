/**
 * app-src/app/api/dependencies/patch/route.js
 *
 * POST /api/dependencies/patch
 * Generates proposed safe dependency update unified diff without executing installs.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { proposeDependencyUpdate, validateWorkspaceBoundary } from '@/lib/dependencies';
import { readFileSync } from 'fs';

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to generate update patches.');
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:dependencies_patch:${ip}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded.', 'TOO_MANY_REQUESTS', 429);
    }

    const body = await request.json().catch(() => ({}));
    const { manifestPath, packageName, currentVersion, proposedVersion } = body;

    if (!manifestPath || !packageName || !proposedVersion) {
      return jsonError('manifestPath, packageName, and proposedVersion are required.', 'VALIDATION_ERROR', 400);
    }

    // Verify workspace boundary security
    const safePath = validateWorkspaceBoundary(process.cwd(), manifestPath);
    const originalContent = readFileSync(safePath, 'utf8');

    const patchResult = proposeDependencyUpdate({
      manifestPath,
      originalContent,
      packageName,
      currentVersion: currentVersion || '',
      proposedVersion,
    });

    if (!patchResult.success) {
      return jsonError(patchResult.details?.error || 'Failed to generate patch.', 'PATCH_FAILED', 422);
    }

    return jsonSuccess({
      patch: patchResult.diff,
      details: patchResult.details,
      safeNotice: 'Proposed diff only. Requires explicit user confirmation to apply.',
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
