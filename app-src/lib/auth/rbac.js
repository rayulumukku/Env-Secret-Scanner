/**
 * lib/auth/rbac.js
 *
 * Role-Based Access Control (RBAC) definitions and permission checks.
 *
 * Hierarchy:
 *   OWNER  >  ADMIN  >  MEMBER  >  VIEWER
 */

export const ROLES = {
  OWNER:  'OWNER',
  ADMIN:  'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
};

const ROLE_RANKS = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const PERMISSIONS = {
  // Organization
  ORG_DELETE:           ['OWNER'],
  ORG_UPDATE:           ['OWNER', 'ADMIN'],
  ORG_MANAGE_BILLING:   ['OWNER'],
  ORG_MANAGE_MEMBERS:   ['OWNER', 'ADMIN'],
  ORG_VIEW:             ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],

  // Projects & Repositories
  PROJECT_CREATE:       ['OWNER', 'ADMIN'],
  PROJECT_UPDATE:       ['OWNER', 'ADMIN'],
  PROJECT_DELETE:       ['OWNER', 'ADMIN'],
  PROJECT_VIEW:         ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  REPO_CONNECT:         ['OWNER', 'ADMIN'],
  REPO_DELETE:          ['OWNER', 'ADMIN'],

  // Scans & Findings
  SCAN_CREATE:          ['OWNER', 'ADMIN', 'MEMBER'],
  SCAN_VIEW:            ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  FINDING_UPDATE:       ['OWNER', 'ADMIN', 'MEMBER'],
  FINDING_VIEW:         ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],

  // Rules, Baselines, Webhooks, Policies
  RULE_MANAGE:          ['OWNER', 'ADMIN'],
  BASELINE_MANAGE:      ['OWNER', 'ADMIN'],
  WEBHOOK_MANAGE:       ['OWNER', 'ADMIN'],
  POLICY_MANAGE:        ['OWNER', 'ADMIN'],
  POLICY_VIEW:          ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  POLICY_EVALUATE:      ['OWNER', 'ADMIN', 'MEMBER'],
  AUDIT_VIEW:           ['OWNER', 'ADMIN'],
};

/**
 * Check if a role has a specific permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Check if role A has at least the rank of role B.
 */
export function hasMinRole(userRole, minRole) {
  const userRank = ROLE_RANKS[userRole] || 0;
  const targetRank = ROLE_RANKS[minRole] || 0;
  return userRank >= targetRank;
}
