/**
 * app/api/cloud/accounts/connect/route.js
 *
 * POST /api/cloud/accounts/connect
 * Securely connects a cloud account with encrypted credentials at rest.
 *
 * SECURITY INVARIANTS:
 * - Requires OWNER or ADMIN role.
 * - Credentials encrypted using AES-256-GCM.
 * - NEVER logs or echoes raw credentials in response.
 * - Validates provider endpoints against SSRF guard.
 */

import { jsonSuccess, jsonUnauthorized, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { connectCloudAccount } from '@/lib/db/cloud';
import { createCloudProvider } from '@/lib/cloud/generic';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export async function POST(request) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to connect cloud account.');
    }

    if (!['OWNER', 'ADMIN'].includes(auth.role)) {
      return jsonError('Insufficient permissions. Owner or Admin required to connect cloud accounts.', 'FORBIDDEN', 403);
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`api:cloud_connect:${auth.organization.id}`);
    if (!rateCheck.allowed) {
      return jsonError('Rate limit exceeded. Please wait before connecting another account.', 'TOO_MANY_REQUESTS', 429);
    }

    const body = await request.json();
    const { provider, accountId, name, credentials, endpoint } = body;

    if (!provider || !accountId) {
      return jsonError('Provider and accountId are required.', 'BAD_REQUEST', 400);
    }

    // Verify provider instantiation & least-privilege permissions
    const providerInstance = createCloudProvider(provider, {
      endpoint: endpoint || null,
      allowCustomLocalMock: process.env.NODE_ENV === 'test',
    });
    const requiredPermissions = providerInstance.getRequiredPermissions();

    const account = await connectCloudAccount({
      organizationId: auth.organization.id,
      provider,
      accountId,
      name,
      credentials,
      permissions: requiredPermissions.map(p => p.scope),
      actor: auth.user?.email || 'Admin',
    });

    return jsonSuccess({
      account,
      requiredPermissions,
      message: 'Cloud account connected successfully with read-only metadata permissions.',
    });
  } catch (err) {
    return jsonError(err.message, 'BAD_REQUEST', 400);
  }
}
