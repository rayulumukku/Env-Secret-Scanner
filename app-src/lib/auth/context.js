/**
 * lib/auth/context.js
 *
 * Authenticated Request Context Resolver.
 *
 * Security:
 *   - Extracts session token from HTTP-only cookie
 *   - Validates user identity and organization membership
 *   - Resolves effective RBAC role
 *   - Never trusts browser-supplied orgId without verifying database membership
 */

import { validateSession, SESSION_COOKIE_NAME } from './session.js';
import { findMember } from '../db/members.js';
import { findOrganizationsByUserId } from '../db/organizations.js';
import { hasPermission } from './rbac.js';

export async function getAuthContext(req, { requiredPermission, targetOrgId } = {}) {
  // Extract session token from cookie
  let token = null;

  if (req?.cookies?.get) {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else if (req?.headers?.get) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
    if (match) token = decodeURIComponent(match[1]);
  }

  // Fallback check for Authorization Bearer token (API use)
  if (!token && req?.headers?.get) {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return {
      authenticated: false,
      user: null,
      organization: null,
      role: null,
      error: 'Authentication required. Please log in.',
    };
  }

  const sessionData = await validateSession(token);
  if (!sessionData) {
    return {
      authenticated: false,
      user: null,
      organization: null,
      role: null,
      error: 'Invalid or expired session. Please log in again.',
    };
  }

  const { user } = sessionData;

  // Determine target organization
  let orgId = targetOrgId;
  if (!orgId && req?.headers?.get) {
    orgId = req.headers.get('x-organization-id');
  }

  const userOrgs = await findOrganizationsByUserId(user.id);
  if (userOrgs.length === 0) {
    return {
      authenticated: true,
      user,
      organization: null,
      role: null,
      userOrgs: [],
      error: null,
    };
  }

  let activeOrg = null;
  let activeMember = null;

  if (orgId) {
    activeMember = await findMember(orgId, user.id);
    if (!activeMember || activeMember.status !== 'ACTIVE') {
      return {
        authenticated: true,
        user,
        organization: null,
        role: null,
        userOrgs,
        error: 'Access denied: You are not a member of this organization.',
      };
    }
    activeOrg = userOrgs.find(o => o.id === orgId) || null;
  } else {
    // Default to first active org
    activeOrg = userOrgs[0];
    activeMember = await findMember(activeOrg.id, user.id);
  }

  const role = activeMember?.role || 'VIEWER';

  // Permission check if specified
  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    return {
      authenticated: true,
      user,
      organization: activeOrg,
      role,
      userOrgs,
      error: `Access denied: Insufficient permissions for ${requiredPermission}.`,
    };
  }

  return {
    authenticated: true,
    user,
    organization: activeOrg,
    role,
    userOrgs,
    error: null,
  };
}
