/**
 * app/api/cloud/accounts/[id]/route.js
 *
 * DELETE /api/cloud/accounts/:id
 * Disconnects and removes a cloud account and its cached metadata.
 */

import { jsonSuccess, jsonUnauthorized, jsonNotFound, jsonError } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { disconnectCloudAccount } from '@/lib/db/cloud';

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.authenticated || !auth.organization) {
      return jsonUnauthorized('Authentication required to disconnect cloud account.');
    }

    if (!['OWNER', 'ADMIN'].includes(auth.role)) {
      return jsonError('Insufficient permissions. Owner or Admin required.', 'FORBIDDEN', 403);
    }

    const { id } = await params;
    if (!id) {
      return jsonError('Account ID is required.', 'BAD_REQUEST', 400);
    }

    const success = await disconnectCloudAccount(auth.organization.id, id, auth.user?.email || 'Admin');
    if (!success) {
      return jsonNotFound(`Cloud account '${id}' not found in organization.`);
    }

    return jsonSuccess({
      disconnected: true,
      id,
      message: 'Cloud account and associated metadata disconnected successfully.',
    });
  } catch (err) {
    return jsonError(err.message, 'INTERNAL_SERVER_ERROR', 500);
  }
}
