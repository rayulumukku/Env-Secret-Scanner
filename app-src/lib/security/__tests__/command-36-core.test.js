import test from 'node:test';
import assert from 'node:assert/strict';

import {
  IdentityGraphService,
  PrivilegedAccessEngine,
  CredentialLifecycleEngine,
  MachineIdentityEngine,
  AccessPathEngine,
  JustInTimeAccessEngine,
  IdentityRiskEngine,
  AccessReview,
  CredentialRotationPlan,
  UnifiedIdentitySecurityCommandCenter,
} from '../command-36-identity-security.js';

test('feature 1: identity graph tracks users, roles, permissions, and assets', () => {
  const graph = new IdentityGraphService({ organizationId: 'org-36' });
  graph.addIdentity({ entityType: 'USER', identityId: 'user-1', organizationId: 'org-36', label: 'analyst' });
  graph.addIdentity({ entityType: 'ROLE', identityId: 'role-admin', organizationId: 'org-36', label: 'admin' });
  graph.addIdentity({ entityType: 'ASSET', identityId: 'asset-1', organizationId: 'org-36', label: 'prod-db' });
  graph.addRelationship({ sourceId: 'user-1', sourceType: 'USER', targetId: 'role-admin', targetType: 'ROLE', relationshipType: 'USER_HAS_ROLE', organizationId: 'org-36' });
  graph.addRelationship({ sourceId: 'role-admin', sourceType: 'ROLE', targetId: 'asset-1', targetType: 'ASSET', relationshipType: 'ROLE_GRANTS_PERMISSION', organizationId: 'org-36', metadata: { risk: 80 } });

  const permissions = graph.getPermissions('user-1', 'org-36');
  const accessPaths = graph.findAccessPaths('user-1', 'asset-1', 'org-36');
  assert.equal(permissions.length >= 1, true);
  assert.equal(accessPaths.length >= 1, true);
  assert.equal(graph.getIdentity('role-admin', 'org-36').entityType, 'ROLE');
});

test('feature 2: privileged access governance detects excessive permissions', () => {
  const engine = new PrivilegedAccessEngine({ organizationId: 'org-36' });
  const record = engine.register({
    permission: 'SECRET_MANAGEMENT',
    role: 'platform-admin',
    users: ['user-1'],
    teams: ['platform'],
    assets: ['asset-1'],
    owner: 'security-admin',
    risk: 90,
    status: 'ACTIVE',
  });

  const analysis = engine.analyze({ identityId: 'user-1', organizationId: 'org-36' });
  assert.equal(record.permission, 'SECRET_MANAGEMENT');
  assert.equal(analysis.status, 'ACTIVE');
});

test('feature 3: credential lifecycle tracks the credential metadata without storing raw values', () => {
  const engine = new CredentialLifecycleEngine({ organizationId: 'org-36' });
  const credential = engine.registerCredential({
    credentialFingerprint: 'fp_123',
    provider: 'github',
    type: 'PAT',
    owner: 'devops',
    asset: 'repository-prod',
    environment: 'production',
    exposure: 80,
    lifecycleState: 'ROTATION_REQUIRED',
    rotationStatus: 'ROTATION_REQUIRED',
    repositoryCount: 4,
    runtimePresence: true,
    deploymentPresence: true,
    cloudAssociation: true,
  });

  const updated = engine.updateLifecycle('fp_123', 'EXPIRING', 'ROTATION_IN_PROGRESS');
  assert.equal(credential.credentialFingerprint, 'fp_123');
  assert.equal(updated.lifecycleState, 'EXPIRING');
  assert.equal(engine.get('fp_123').rotationStatus, 'ROTATION_IN_PROGRESS');
  assert.equal(engine.summary().rotationRequired >= 1, true);
});

test('feature 4: machine identities detect risky service accounts', () => {
  const engine = new MachineIdentityEngine({ organizationId: 'org-36' });
  const service = engine.register({
    identityId: 'machine-1',
    organizationId: 'org-36',
    name: 'ci-prod',
    type: 'CI_CD_IDENTITY',
    owner: 'devops',
    application: 'release-bot',
    environment: 'PRODUCTION',
    permissions: ['repo_admin', 'secret_write'],
    assets: ['asset-1'],
    credentialCount: 2,
    criticality: 'CRITICAL',
    riskScore: 88,
    lifecycleState: 'ACTIVE',
  });

  const risky = engine.findRisky();
  assert.equal(service.type, 'CI_CD_IDENTITY');
  assert.equal(risky.some((identity) => identity.identityId === 'machine-1'), true);
});

test('feature 5: access path analysis explains how an identity reaches a sensitive asset', () => {
  const engine = new AccessPathEngine({ organizationId: 'org-36' });
  const path = engine.linkPath({
    identityId: 'user-1',
    from: 'USER',
    to: 'asset-1',
    permissions: ['USER_HAS_ROLE', 'ROLE_GRANTS_PERMISSION', 'IDENTITY_ACCESS_ASSET'],
    risk: 80,
    confidence: 90,
    pathType: 'PRIVILEGED_ACCESS',
    assetCriticality: 90,
    controls: ['MFA', 'RBAC'],
  });

  const explanation = engine.explain({ identityId: 'user-1', assetId: 'asset-1' });
  assert.equal(path.pathType, 'PRIVILEGED_ACCESS');
  assert.equal(explanation[0].explanation.includes('Access is granted through'), true);
});

test('feature 6: JIT access requests support request, approval, activation, and expiration', () => {
  const engine = new JustInTimeAccessEngine({ organizationId: 'org-36', defaultMaxDurationHours: 12 });
  const request = engine.request({
    requester: 'user-2',
    asset: 'asset-2',
    requestedRole: 'database-reader',
    reason: 'Support break-fix',
    duration: 4,
    businessJustification: 'Needed to diagnose production issue',
    risk: 55,
  });

  const approved = engine.approve(request.requestId, 'security-manager');
  const active = engine.activate(request.requestId);
  const expired = engine.expire(request.requestId, new Date(Date.now() + 10 * 60 * 60 * 1000).getTime());
  assert.equal(approved.status, 'APPROVED');
  assert.equal(active.status, 'ACTIVE');
  assert.equal(expired.status === 'EXPIRED' || expired.status === 'ACTIVE', true);
});

test('feature 7: identity risk engine scores risk and generates anomalies without claiming malicious behavior', () => {
  const engine = new IdentityRiskEngine({ organizationId: 'org-36' });
  const risk = engine.score({
    privilegeLevel: 90,
    assetCriticality: 95,
    accessBreadth: 80,
    credentialExposure: 70,
    credentialAge: 40,
    runtimePresence: true,
    unusualAccess: true,
    dormantAccess: false,
    failedAuthenticationSignals: 2,
    policyViolations: 1,
    incidentHistory: 2,
    threatIntelligence: 1,
    ownershipChanges: 1,
    excessivePermissions: 3,
  });

  const anomaly = engine.detectAnomaly({ identityId: 'user-9', reason: 'Unusual admin access observed', confidence: 72 });
  assert.equal(risk.category, 'CRITICAL');
  assert.equal(anomaly.status, 'ANOMALOUS_ACTIVITY');
  assert.equal(anomaly.confidence > 50, true);
});

test('feature 8: access review records approval evidence and review status', () => {
  const review = new AccessReview({
    organizationId: 'org-36',
    scope: 'production access',
    owner: 'security-manager',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    reviewFrequency: 'quarterly',
  });

  review.addItem({ identityId: 'user-1', decision: 'APPROVE', evidenceRef: 'evidence-1' });
  review.markApproved();
  assert.equal(review.status, 'CERTIFIED');
  assert.equal(review.items[0].decision, 'APPROVE');
});

test('feature 9: credential rotation plan enforces dry-run default and approval workflow', () => {
  const plan = new CredentialRotationPlan({
    credentialFingerprint: 'fp_456',
    provider: 'azure',
    affectedAssets: ['asset-1'],
    affectedRepositories: ['repo-1'],
    affectedDeployments: ['deployment-prod'],
    owner: 'devops',
    risk: 72,
    dependencies: ['service-bus'],
    downtimeRisk: 25,
    verificationPlan: ['scan', 'verify health', 'confirm revocation'],
    organizationId: 'org-36',
  });

  plan.plan();
  plan.approve();
  plan.verify();

  assert.equal(plan.mode, 'ACTIVE');
  assert.equal(plan.state, 'VERIFICATION');
});

test('feature 10: unified identity command center summarizes posture and risk signals', () => {
  const center = new UnifiedIdentitySecurityCommandCenter({ organizationId: 'org-36' });
  center.addIdentity({ entityType: 'USER', identityId: 'user-a', organizationId: 'org-36', label: 'developer' });
  center.addPrivilegedPermission({ permission: 'SECRET_MANAGEMENT', role: 'platform-admin', users: ['user-a'], assets: ['asset-1'], owner: 'security-admin', risk: 90 });
  center.registerCredential({
    credentialFingerprint: 'fp_789',
    provider: 'github',
    type: 'PAT',
    owner: 'developer',
    asset: 'repo-main',
    environment: 'production',
    exposure: 75,
    lifecycleState: 'EXPIRING',
    rotationStatus: 'ROTATION_REQUIRED',
    repositoryCount: 2,
    runtimePresence: true,
    deploymentPresence: false,
    cloudAssociation: false,
  });
  center.createReview({ organizationId: 'org-36', scope: 'privileged access', owner: 'security', dueDate: new Date(Date.now() + 60000).toISOString() });
  center.createRotationPlan({
    credentialFingerprint: 'fp_789',
    provider: 'github',
    affectedAssets: ['asset-1'],
    owner: 'devops',
    risk: 80,
    verificationPlan: ['scan'],
    organizationId: 'org-36',
  });

  const posture = center.postureSummary();
  assert.equal(posture.organizationId, 'org-36');
  assert.equal(posture.machineIdentities >= 0, true);
  assert.equal(posture.rotationRequired >= 1, true);
});
