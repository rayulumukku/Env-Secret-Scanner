/**
 * app-src/lib/security/auth-matrix.js
 *
 * Centralized Role-Based Access Control (RBAC) & Tenant Isolation Engine.
 *
 * ROLES:
 *   - Owner: Full organizational administration, billing, deletion, and policy governance.
 *   - Admin: Security operations, policy configuration, integrations, user management.
 *   - Member: Development workflows, scans, remediation fixes, finding triage, Copilot.
 *   - Viewer: Read-only access to dashboards, reports, and evidence centers.
 *
 * SAFETY INVARIANTS:
 *   - Every resource action is mapped deterministically in a declarative matrix.
 *   - Cross-tenant / cross-organization requests are strictly rejected.
 *   - Viewers can never trigger destructive actions or modify security configurations.
 */

export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER'
};

export const PERMISSION_MATRIX = {
  scans: {
    trigger: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    cancel: [ROLES.OWNER, ROLES.ADMIN],
    delete: [ROLES.OWNER, ROLES.ADMIN]
  },
  findings: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    update_status: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    mark_false_positive: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    delete: [ROLES.OWNER, ROLES.ADMIN]
  },
  repositories: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    connect: [ROLES.OWNER, ROLES.ADMIN],
    sync: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    disconnect: [ROLES.OWNER, ROLES.ADMIN],
    configure: [ROLES.OWNER, ROLES.ADMIN]
  },
  integrations: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    create: [ROLES.OWNER, ROLES.ADMIN],
    edit: [ROLES.OWNER, ROLES.ADMIN],
    delete: [ROLES.OWNER, ROLES.ADMIN],
    test: [ROLES.OWNER, ROLES.ADMIN]
  },
  policies: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    create: [ROLES.OWNER, ROLES.ADMIN],
    edit: [ROLES.OWNER, ROLES.ADMIN],
    delete: [ROLES.OWNER, ROLES.ADMIN],
    evaluate: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]
  },
  rules: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    install_pack: [ROLES.OWNER, ROLES.ADMIN],
    lock_version: [ROLES.OWNER, ROLES.ADMIN],
    remove_pack: [ROLES.OWNER, ROLES.ADMIN],
    create_custom: [ROLES.OWNER, ROLES.ADMIN]
  },
  remediation: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    execute_fix: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    mark_remediated: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]
  },
  incidents: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    create: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    assign: [ROLES.OWNER, ROLES.ADMIN],
    update_status: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    close: [ROLES.OWNER, ROLES.ADMIN]
  },
  automation: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    trigger_playbook: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    edit_playbook: [ROLES.OWNER, ROLES.ADMIN],
    delete_playbook: [ROLES.OWNER, ROLES.ADMIN]
  },
  reports: {
    view: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    generate_pdf: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    generate_csv: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    export_audit: [ROLES.OWNER, ROLES.ADMIN]
  },
  trust_center: {
    view_controls: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    export_evidence: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    edit_controls: [ROLES.OWNER, ROLES.ADMIN]
  },
  ai_copilot: {
    query_local: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    query_ai: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
    apply_patch: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]
  },
  organization: {
    view_settings: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER],
    edit_settings: [ROLES.OWNER, ROLES.ADMIN],
    manage_billing: [ROLES.OWNER],
    invite_users: [ROLES.OWNER, ROLES.ADMIN],
    remove_users: [ROLES.OWNER, ROLES.ADMIN],
    delete_org: [ROLES.OWNER]
  }
};

/**
 * Checks if a given role has permission to perform an action on a resource.
 *
 * @param {string} userRole - User's role ('OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')
 * @param {string} resource - Target resource domain
 * @param {string} action - Requested operation
 * @returns {boolean}
 */
export function hasPermission(userRole, resource, action) {
  if (!userRole || !resource || !action) return false;
  const role = String(userRole).toUpperCase();
  const res = PERMISSION_MATRIX[resource];
  if (!res) return false;

  const allowedRoles = res[action];
  if (!allowedRoles || !Array.isArray(allowedRoles)) return false;

  return allowedRoles.includes(role);
}

/**
 * Validates tenant / organization ownership context to prevent IDOR and cross-tenant data access.
 *
 * @param {Object} userContext
 * @param {string} userContext.orgId - Authenticated organization ID
 * @param {string} [userContext.role='VIEWER'] - Authenticated user role
 * @param {string} targetOrgId - Target organization ID of requested resource
 * @returns {{ authorized: boolean, error?: string }}
 */
export function enforceTenantAccess(userContext, targetOrgId) {
  if (!userContext || !userContext.orgId) {
    return { authorized: false, error: 'Authentication required: missing user organization context.' };
  }

  if (!targetOrgId) {
    return { authorized: false, error: 'Target resource has no associated organization ID.' };
  }

  if (userContext.orgId !== targetOrgId) {
    return {
      authorized: false,
      error: 'Access Denied: Cross-tenant operation rejected. Target resource belongs to a different organization.'
    };
  }

  return { authorized: true };
}
