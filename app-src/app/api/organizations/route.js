/**
 * app/api/organizations/route.js
 *
 * List and create organizations.
 */

import { jsonSuccess, jsonError, jsonUnauthorized } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { createOrganization, findOrganizationsByUserId } from '@/lib/db/organizations';
import { logAuditEvent } from '@/lib/db/audit';

export async function GET(req) {
  const auth = await getAuthContext(req);
  if (!auth.authenticated) return jsonUnauthorized(auth.error);

  const orgs = await findOrganizationsByUserId(auth.user.id);
  return jsonSuccess(orgs);
}

export async function POST(req) {
  const auth = await getAuthContext(req);
  if (!auth.authenticated) return jsonUnauthorized(auth.error);

  const { name } = await req.json().catch(() => ({}));
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return jsonError('Organization name is required.', 'INVALID_NAME', 400);
  }

  const org = await createOrganization({
    name: name.trim(),
    userId: auth.user.id,
  });

  await logAuditEvent({
    organizationId: org.id,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'ORGANIZATION_CREATED',
    targetType: 'Organization',
    targetId: org.id,
    metadata: { name: org.name, slug: org.slug },
  });

  return jsonSuccess(org, 201);
}
