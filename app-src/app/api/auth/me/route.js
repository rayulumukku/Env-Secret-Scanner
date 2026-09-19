/**
 * app/api/auth/me/route.js
 *
 * Return currently authenticated user profile, active organization, and roles.
 */

import { jsonSuccess, jsonUnauthorized } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';

export async function GET(req) {
  const auth = await getAuthContext(req);
  if (!auth.authenticated) {
    return jsonUnauthorized(auth.error);
  }

  return jsonSuccess({
    user: auth.user,
    activeOrganization: auth.organization,
    role: auth.role,
    organizations: auth.userOrgs || [],
  });
}
