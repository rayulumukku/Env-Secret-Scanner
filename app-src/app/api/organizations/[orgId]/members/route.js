/**
 * app/api/organizations/[orgId]/members/route.js
 *
 * Team member management: list, invite, update role, remove.
 */

import { jsonSuccess, jsonError, jsonUnauthorized, jsonForbidden } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth/context';
import { listMembers, addMember, updateMemberRole, removeMember } from '@/lib/db/members';
import { findUserByEmail, createUser } from '@/lib/db/users';
import { hashPassword } from '@/lib/auth/password';
import { logAuditEvent } from '@/lib/db/audit';
import { randomBytes } from 'crypto';

export async function GET(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId, requiredPermission: 'ORG_VIEW' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const members = await listMembers(orgId);
  return jsonSuccess(members);
}

export async function POST(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId, requiredPermission: 'ORG_MANAGE_MEMBERS' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { email, role = 'MEMBER' } = await req.json().catch(() => ({}));
  if (!email || !email.includes('@')) {
    return jsonError('A valid email address is required.', 'INVALID_EMAIL', 400);
  }

  // Find existing user or create invited user placeholder
  let targetUser = await findUserByEmail(email);
  let status = 'ACTIVE';

  if (!targetUser) {
    status = 'INVITED';
    const tempPass = await hashPassword(randomBytes(16).toString('hex'));
    targetUser = await createUser({
      email,
      passwordHash: tempPass,
      name: email.split('@')[0],
    });
  }

  const member = await addMember({
    organizationId: orgId,
    userId: targetUser.id,
    role,
    invitedEmail: email,
    status,
  });

  await logAuditEvent({
    organizationId: orgId,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'MEMBER_INVITED',
    targetType: 'Member',
    targetId: targetUser.id,
    metadata: { invitedEmail: email, role, status },
  });

  return jsonSuccess(member, 201);
}

export async function PATCH(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId, requiredPermission: 'ORG_MANAGE_MEMBERS' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { userId, role } = await req.json().catch(() => ({}));
  if (!userId || !role) {
    return jsonError('User ID and role are required.', 'INVALID_REQUEST', 400);
  }

  const updated = await updateMemberRole(orgId, userId, role);

  await logAuditEvent({
    organizationId: orgId,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'MEMBER_ROLE_CHANGED',
    targetType: 'Member',
    targetId: userId,
    metadata: { newRole: role },
  });

  return jsonSuccess(updated);
}

export async function DELETE(req, { params }) {
  const { orgId } = await params;
  const auth = await getAuthContext(req, { targetOrgId: orgId, requiredPermission: 'ORG_MANAGE_MEMBERS' });
  if (!auth.authenticated) return jsonUnauthorized(auth.error);
  if (auth.error) return jsonForbidden(auth.error);

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return jsonError('User ID is required.', 'INVALID_REQUEST', 400);
  }

  // Prevent self-removal if sole owner
  if (userId === auth.user.id && auth.role === 'OWNER') {
    const allMembers = await listMembers(orgId);
    const ownerCount = allMembers.filter(m => m.role === 'OWNER').length;
    if (ownerCount <= 1) {
      return jsonError('Cannot remove the sole owner of an organization.', 'SOLE_OWNER', 400);
    }
  }

  await removeMember(orgId, userId);

  await logAuditEvent({
    organizationId: orgId,
    userId: auth.user.id,
    userEmail: auth.user.email,
    action: 'MEMBER_REMOVED',
    targetType: 'Member',
    targetId: userId,
  });

  return jsonSuccess({ message: 'Member removed successfully' });
}
