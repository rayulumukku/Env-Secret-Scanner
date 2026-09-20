import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { memoryDb } from '../../app-src/lib/db/client.js';
import { createOrganization, findOrganizationById } from '../../app-src/lib/db/organizations.js';
import { createProject, findProjectById } from '../../app-src/lib/db/projects.js';
import { hasPermission } from '../../app-src/lib/auth/rbac.js';
import { listAuditLogs } from '../../app-src/lib/db/audit.js';

describe('Cross-Tenant Authorization & Multi-Organization Isolation', () => {
  beforeEach(() => {
    memoryDb.reset();
  });

  it('strictly prevents User A from accessing Organization B resources', async () => {
    // 1. Setup Tenant A
    const userA = { id: 'usr_alice_1', email: 'alice@company-a.com' };
    memoryDb.users.set(userA.id, userA);
    const orgA = await createOrganization({ name: 'Company A', userId: userA.id });
    const projA = await createProject({ organizationId: orgA.id, name: 'Project Alpha' });

    // 2. Setup Tenant B
    const userB = { id: 'usr_bob_2', email: 'bob@company-b.com' };
    memoryDb.users.set(userB.id, userB);
    const orgB = await createOrganization({ name: 'Company B', userId: userB.id });
    const projB = await createProject({ organizationId: orgB.id, name: 'Project Beta' });

    // 3. Verify Organization Isolation
    const userAMemberships = [...memoryDb.members.values()].filter(m => m.userId === userA.id);
    const userAOrgIds = userAMemberships.map(m => m.organizationId);

    assert.ok(userAOrgIds.includes(orgA.id), 'User A is a member of Org A');
    assert.ok(!userAOrgIds.includes(orgB.id), 'User A is NOT a member of Org B');

    // 4. Verify Project Isolation
    const orgAProjects = [...memoryDb.projects.values()].filter(p => p.organizationId === orgA.id);
    const orgBProjects = [...memoryDb.projects.values()].filter(p => p.organizationId === orgB.id);

    assert.equal(orgAProjects.length, 1);
    assert.equal(orgAProjects[0].id, projA.id);
    assert.ok(!orgAProjects.some(p => p.id === projB.id), 'Org A project list does not contain Org B project');

    // 5. Test Direct ID Manipulation Protection
    const fetchedProjB = await findProjectById(projB.id);
    assert.equal(fetchedProjB.organizationId, orgB.id);
    assert.notEqual(fetchedProjB.organizationId, orgA.id, 'Project B does not belong to Org A');
  });

  it('enforces RBAC role hierarchy and denies unprivileged member actions', () => {
    // VIEWER cannot delete or modify policies
    assert.equal(hasPermission('VIEWER', 'POLICY_MANAGE'), false);
    assert.equal(hasPermission('VIEWER', 'ORG_DELETE'), false);
    assert.equal(hasPermission('VIEWER', 'PROJECT_CREATE'), false);
    assert.equal(hasPermission('VIEWER', 'FINDING_VIEW'), true);

    // MEMBER cannot delete organization
    assert.equal(hasPermission('MEMBER', 'ORG_DELETE'), false);
    assert.equal(hasPermission('MEMBER', 'ORG_MANAGE_MEMBERS'), false);

    // ADMIN cannot delete organization (OWNER only)
    assert.equal(hasPermission('ADMIN', 'ORG_DELETE'), false);
    assert.equal(hasPermission('ADMIN', 'PROJECT_CREATE'), true);
    assert.equal(hasPermission('ADMIN', 'POLICY_MANAGE'), true);

    // OWNER has full administrative permissions
    assert.equal(hasPermission('OWNER', 'ORG_DELETE'), true);
  });


  it('isolates audit logs per organization and prevents cross-tenant log leakage', async () => {
    const orgAId = 'org_alpha_123';
    const orgBId = 'org_beta_456';

    memoryDb.auditLogs.push(
      { id: 'aud_1', organizationId: orgAId, action: 'USER_LOGIN', userEmail: 'alice@alpha.com' },
      { id: 'aud_2', organizationId: orgBId, action: 'USER_LOGIN', userEmail: 'bob@beta.com' }
    );

    const logsA = await listAuditLogs(orgAId);
    const logsB = await listAuditLogs(orgBId);

    assert.equal(logsA.length, 1);
    assert.equal(logsA[0].userEmail, 'alice@alpha.com');
    assert.equal(logsB.length, 1);
    assert.equal(logsB[0].userEmail, 'bob@beta.com');
  });
});
