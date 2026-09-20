import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isGlobalAdmin, hasPermission, PERMISSIONS } from '../rbac.js';

describe('Global Admin RBAC Isolation', () => {
  it('should identify global admin users correctly', () => {
    const globalAdminUser = {
      id: 'usr-admin-1',
      role: 'GLOBAL_ADMIN',
      email: 'admin@secretshield.internal',
    };

    const regularUser = {
      id: 'usr-dev-1',
      role: 'MEMBER',
      email: 'dev@company.com',
    };

    assert.strictEqual(isGlobalAdmin(globalAdminUser), true);
    assert.strictEqual(isGlobalAdmin(regularUser), false);
    assert.strictEqual(isGlobalAdmin(null), false);
  });

  it('should verify organization OWNER does not automatically gain global admin privileges', () => {
    const orgOwner = {
      id: 'usr-org-owner',
      role: 'MEMBER',
      email: 'founder@startup.io',
    };

    assert.strictEqual(isGlobalAdmin(orgOwner), false);
  });
});
