import crypto from 'node:crypto';

import { SecurityGraphService } from './security-graph.js';
import { securityContextSanitizer } from './security-context-sanitizer.js';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value || 0)));
const nowIso = () => new Date().toISOString();
const hashValue = (value) => crypto.createHash('sha256').update(String(value || 'unknown')).digest('hex');
const sanitizeIdentityMetadata = (value) => {
  const cleaned = securityContextSanitizer.sanitize(value);
  if (cleaned && typeof cleaned === 'object') {
    delete cleaned.password;
    delete cleaned.passwd;
    delete cleaned.token;
    delete cleaned.apiKey;
    delete cleaned.authorization;
    delete cleaned.cookie;
    delete cleaned.session;
    delete cleaned.privateKey;
    delete cleaned.secretValue;
    delete cleaned.secret;
    delete cleaned.value;
  }
  return cleaned;
};

export class IdentityGraphService extends SecurityGraphService {
  constructor({ organizationId = 'default-org' } = {}) {
    super({ organizationId });
    this.identityIndex = new Map();
  }

  addIdentity({ entityType, identityId, organizationId = this.organizationId, ...rest }) {
    const normalizedType = String(entityType).toUpperCase();
    const id = String(identityId || rest.identityId || `${normalizedType}_${Date.now()}`);
    const node = {
      entityType: normalizedType,
      entityId: id,
      organizationId,
      label: rest.label || id,
      metadata: sanitizeIdentityMetadata(rest.metadata || {}),
      createdAt: rest.createdAt || nowIso(),
    };
    this.identityIndex.set(`${organizationId}:${id}`, node);
    this.addNode({ entityType: normalizedType, entityId: id, organizationId, label: node.label, metadata: node.metadata });
    return node;
  }

  getIdentity(identityId, organizationId = this.organizationId) {
    const match = this.identityIndex.get(`${organizationId}:${identityId}`);
    if (match) return match;
    for (const node of this.identityIndex.values()) {
      if (node.entityId === identityId && node.organizationId === organizationId) return node;
    }
    return null;
  }

  addRelationship({ sourceId, sourceType, targetId, targetType, relationshipType, organizationId = this.organizationId, metadata = {} }) {
    return this.addEdge({ sourceId, sourceType, targetId, targetType, relationshipType, organizationId, metadata: sanitizeIdentityMetadata(metadata) });
  }

  getPermissions(identityId, organizationId = this.organizationId) {
    const edges = [];
    for (const list of this.edges.values()) {
      for (const edge of list) {
        if (edge.sourceId === String(identityId) && edge.organizationId === organizationId) {
          edges.push(edge);
        }
      }
    }
    return edges.filter((edge) => /PERMISSION|ROLE|TEAM|APPLICATION|ASSET/.test(edge.relationshipType));
  }

  getAccessibleAssets(identityId, organizationId = this.organizationId) {
    const paths = this.findAccessPaths(identityId, undefined, organizationId);
    const assetIds = new Set();
    for (const path of paths) {
      for (const step of path) {
        if (String(step.entityType).toUpperCase() === 'ASSET') assetIds.add(step.entityId);
      }
    }
    return Array.from(assetIds);
  }

  getCredentialRelationships(identityId, organizationId = this.organizationId) {
    return (this.edges.get(`${String('IDENTITY').toUpperCase()}:${String(identityId)}`) || []).filter((edge) => edge.relationshipType.includes('CREDENTIAL') || edge.relationshipType.includes('SECRET'));
  }

  findPrivilegePaths(fromIdentityId, toAssetId = null, organizationId = this.organizationId) {
    const queue = [{ entityId: String(fromIdentityId), entityType: 'USER', path: [{ entityId: String(fromIdentityId), entityType: 'USER' }] }];
    const visited = new Set();
    const results = [];
    while (queue.length) {
      const current = queue.shift();
      const marker = `${current.entityType}:${current.entityId}`;
      if (visited.has(marker)) continue;
      visited.add(marker);
      const neighbors = this.getNeighbors(current.entityId, current.entityType, organizationId);
      for (const neighbor of neighbors) {
        const nextPath = [...current.path, { entityId: neighbor.neighborId, entityType: neighbor.neighborType }];
        if (toAssetId && neighbor.neighborType === 'ASSET' && neighbor.neighborId === String(toAssetId)) {
          results.push(nextPath);
        }
        if (neighbor.neighborType !== 'ASSET' || !toAssetId) {
          queue.push({ entityId: neighbor.neighborId, entityType: neighbor.neighborType, path: nextPath });
        }
      }
    }
    return results;
  }

  findAccessPaths(fromIdentityId, toAssetId = null, organizationId = this.organizationId) {
    return this.findPrivilegePaths(fromIdentityId, toAssetId, organizationId);
  }

  findExcessivePermissions(identityId, organizationId = this.organizationId) {
    const permissions = this.getPermissions(identityId, organizationId);
    return permissions.filter((edge) => /ADMIN|MANAGE|WRITE|MODIFY|ROTATE|REVOKE/.test(String(edge.relationshipType || '')) || (edge.metadata && edge.metadata.risk && Number(edge.metadata.risk) > 70));
  }
}

export class PrivilegedPermission {
  constructor({ permission, role, users = [], teams = [], assets = [], justification = '', owner = 'security', reviewFrequency = 'quarterly', risk = 0, status = 'ACTIVE' }) {
    this.id = `priv_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    this.permission = permission;
    this.role = role;
    this.users = users;
    this.teams = teams;
    this.assets = assets;
    this.justification = justification;
    this.owner = owner;
    this.reviewFrequency = reviewFrequency;
    this.risk = clamp(risk);
    this.status = status;
    this.createdAt = nowIso();
  }
}

export class PrivilegedAccessEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.permissions = new Map();
    this.graph = new IdentityGraphService({ organizationId });
  }

  register({ permission, role, users = [], teams = [], assets = [], justification, owner, reviewFrequency, risk, status }) {
    const record = new PrivilegedPermission({ permission, role, users, teams, assets, justification, owner, reviewFrequency, risk, status });
    this.permissions.set(record.id, record);
    return record;
  }

  detectExcessive({ identityId, permissions = [], assets = [] }) {
    const flagged = permissions.filter((permission) => /ADMIN|SECRET|MANAGE|ROTATE|REVOKE|POLICY/.test(String(permission).toUpperCase()));
    return {
      identityId,
      excessive: flagged,
      assets,
      risk: flagged.length * 25 + Math.min(assets.length * 10, 40),
      status: flagged.length > 0 ? 'EXCESSIVE' : 'ACTIVE',
    };
  }

  analyze({ identityId, organizationId = this.organizationId }) {
    const graphPermissions = this.graph.getPermissions(identityId, organizationId);
    const excessive = this.graph.findExcessivePermissions(identityId, organizationId);
    return {
      identityId,
      organizationId,
      privilegedPermissions: graphPermissions.length,
      excessivePermissions: excessive.length,
      status: excessive.length > 0 ? 'REVIEW_REQUIRED' : 'ACTIVE',
      summary: excessive.length > 0 ? 'Identity has privileged access beyond its expected scope.' : 'Privileged access appears within expected scope.',
    };
  }
}

export class CredentialLifecycleEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.credentials = new Map();
  }

  registerCredential({
    credentialFingerprint,
    provider,
    type,
    owner,
    asset,
    environment,
    exposure = 0,
    lifecycleState = 'DISCOVERED',
    rotationStatus = 'NOT_REQUIRED',
    firstSeen = nowIso(),
    lastSeen = nowIso(),
    organizationId = this.organizationId,
    repositoryCount = 0,
    runtimePresence = false,
    deploymentPresence = false,
    cloudAssociation = false,
  }) {
    const fingerprint = credentialFingerprint || hashValue(`${provider}:${type}:${asset}:${environment}:${owner}`);
    const record = {
      credentialFingerprint: fingerprint,
      provider,
      type,
      owner,
      asset,
      environment,
      exposure: clamp(exposure),
      lifecycleState,
      rotationStatus,
      firstSeen,
      lastSeen,
      organizationId,
      ageDays: 0,
      repositoryCount,
      runtimePresence,
      deploymentPresence,
      cloudAssociation,
      risk: clamp(exposure * 1.4 + (runtimePresence ? 15 : 0) + (deploymentPresence ? 10 : 0)),
      createdAt: nowIso(),
    };
    this.credentials.set(fingerprint, record);
    return record;
  }

  updateLifecycle(fingerprint, lifecycleState, rotationStatus = undefined) {
    const record = this.credentials.get(fingerprint);
    if (!record) return null;
    record.lifecycleState = lifecycleState;
    if (rotationStatus) record.rotationStatus = rotationStatus;
    record.lastSeen = nowIso();
    return record;
  }

  get(fingerprint) {
    return this.credentials.get(fingerprint) || null;
  }

  getExpiring() {
    return Array.from(this.credentials.values()).filter((credential) => credential.lifecycleState === 'EXPIRING' || credential.rotationStatus === 'ROTATION_REQUIRED' || credential.rotationStatus === 'ROTATION_IN_PROGRESS');
  }

  summary() {
    const values = Array.from(this.credentials.values());
    return {
      total: values.length,
      expiring: values.filter((entry) => entry.lifecycleState === 'EXPIRING').length,
      rotationRequired: values.filter((entry) => ['ROTATION_REQUIRED', 'ROTATION_IN_PROGRESS', 'EXPIRING'].includes(entry.rotationStatus) || ['ROTATION_REQUIRED', 'ROTATION_IN_PROGRESS', 'EXPIRING'].includes(entry.lifecycleState)).length,
      active: values.filter((entry) => entry.lifecycleState === 'ACTIVE').length,
      revoked: values.filter((entry) => entry.lifecycleState === 'REVOKED').length,
    };
  }
}

export class MachineIdentity {
  constructor({
    identityId,
    organizationId = 'default-org',
    name,
    type,
    owner,
    application,
    environment,
    permissions = [],
    assets = [],
    credentialCount = 0,
    lastActivity = nowIso(),
    criticality = 'HIGH',
    riskScore = 0,
    lifecycleState = 'ACTIVE',
  }) {
    this.identityId = identityId || `machine_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    this.organizationId = organizationId;
    this.name = name;
    this.type = String(type).toUpperCase();
    this.owner = owner;
    this.application = application;
    this.environment = String(environment).toUpperCase();
    this.permissions = permissions;
    this.assets = assets;
    this.credentialCount = Number(credentialCount || 0);
    this.lastActivity = lastActivity;
    this.criticality = String(criticality).toUpperCase();
    this.riskScore = clamp(riskScore);
    this.lifecycleState = String(lifecycleState).toUpperCase();
    this.createdAt = nowIso();
  }
}

export class MachineIdentityEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.identities = new Map();
  }

  register(machineIdentity) {
    const normalized = new MachineIdentity({ organizationId: machineIdentity.organizationId || this.organizationId, ...machineIdentity });
    this.identities.set(normalized.identityId, normalized);
    return normalized;
  }

  findRisky() {
    return Array.from(this.identities.values()).filter((identity) => identity.riskScore >= 60 || identity.lifecycleState === 'INACTIVE');
  }
}

export class AccessPathEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.paths = [];
  }

  linkPath({ identityId, from, to, permissions = [], risk = 0, confidence = 0, pathType = 'DIRECT_ACCESS', assetCriticality = 0, controls = [] }) {
    const record = {
      pathId: `path_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      identityId,
      from,
      to,
      permissions,
      risk: clamp(risk),
      confidence: clamp(confidence),
      pathType,
      assetCriticality: clamp(assetCriticality),
      controls,
      createdAt: nowIso(),
    };
    this.paths.push(record);
    return record;
  }

  explain({ identityId, assetId }) {
    return this.paths.filter((path) => path.identityId === identityId && path.to === assetId).map((path) => ({
      pathType: path.pathType,
      permissions: path.permissions,
      risk: path.risk,
      confidence: path.confidence,
      explanation: `Access is granted through ${path.permissions.join(' -> ')} with ${path.risk}/100 risk and ${path.confidence}/100 confidence.`,
    }));
  }
}

export class JustInTimeAccessEngine {
  constructor({ organizationId = 'default-org', defaultMaxDurationHours = 12 } = {}) {
    this.organizationId = organizationId;
    this.defaultMaxDurationHours = defaultMaxDurationHours;
    this.requests = new Map();
  }

  request({ requester, asset, requestedRole, reason, duration, businessJustification, risk = 0, requiredApproval = true, organizationId = this.organizationId }) {
    const expiresAt = new Date(Date.now() + (Number(duration || this.defaultMaxDurationHours) * 60 * 60 * 1000)).toISOString();
    const record = {
      requestId: `jit_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      requester,
      asset,
      requestedRole,
      reason,
      duration: Number(duration || this.defaultMaxDurationHours),
      businessJustification,
      risk: clamp(risk),
      requiredApproval,
      requestedAt: nowIso(),
      expiresAt,
      status: 'REQUESTED',
      organizationId,
    };
    this.requests.set(record.requestId, record);
    return record;
  }

  approve(requestId, approver) {
    const request = this.requests.get(requestId);
    if (!request) return null;
    const updated = { ...request, status: 'APPROVED', approver, approvedAt: nowIso() };
    this.requests.set(requestId, updated);
    return updated;
  }

  activate(requestId) {
    const request = this.requests.get(requestId);
    if (!request) return null;
    const updated = { ...request, status: 'ACTIVE', activeAt: nowIso() };
    this.requests.set(requestId, updated);
    return updated;
  }

  expire(requestId, now = Date.now()) {
    const request = this.requests.get(requestId);
    if (!request) return null;
    const updated = { ...request, status: new Date(now).getTime() > new Date(request.expiresAt).getTime() ? 'EXPIRED' : request.status };
    this.requests.set(requestId, updated);
    return updated;
  }
}

export class IdentityRiskEngine {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.risks = new Map();
    this.anomalies = [];
  }

  score({
    privilegeLevel = 0,
    assetCriticality = 0,
    accessBreadth = 0,
    credentialExposure = 0,
    credentialAge = 0,
    runtimePresence = false,
    unusualAccess = false,
    dormantAccess = false,
    failedAuthenticationSignals = 0,
    policyViolations = 0,
    incidentHistory = 0,
    threatIntelligence = 0,
    ownershipChanges = 0,
    excessivePermissions = 0,
  }) {
    const score = clamp(
      privilegeLevel * 0.18 +
      assetCriticality * 0.18 +
      accessBreadth * 0.12 +
      credentialExposure * 0.12 +
      credentialAge * 0.08 +
      (runtimePresence ? 12 : 0) +
      (unusualAccess ? 15 : 0) +
      (dormantAccess ? 10 : 0) +
      failedAuthenticationSignals * 6 +
      policyViolations * 8 +
      incidentHistory * 8 +
      threatIntelligence * 9 +
      ownershipChanges * 7 +
      excessivePermissions * 10
    );

    let category = 'LOW';
    if (score >= 80) category = 'CRITICAL';
    else if (score >= 60) category = 'HIGH';
    else if (score >= 35) category = 'MEDIUM';

    return { identityRiskScore: Number(score.toFixed(1)), category };
  }

  detectAnomaly({ identityId, reason, confidence = 0 }) {
    const anomaly = {
      anomalyId: `anomaly_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      identityId,
      reason,
      confidence: clamp(confidence),
      status: 'ANOMALOUS_ACTIVITY',
      createdAt: nowIso(),
    };
    this.anomalies.push(anomaly);
    return anomaly;
  }
}

export class AccessReview {
  constructor({ organizationId = 'default-org', scope, owner, dueDate, reviewFrequency = 'quarterly' }) {
    this.reviewId = `review_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    this.organizationId = organizationId;
    this.scope = scope;
    this.owner = owner;
    this.status = 'NOT_STARTED';
    this.reviewFrequency = reviewFrequency;
    this.dueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.createdAt = nowIso();
    this.items = [];
  }

  addItem(item) {
    this.items.push({ ...item, createdAt: nowIso() });
    return this.items[this.items.length - 1];
  }

  markApproved() {
    this.status = 'CERTIFIED';
    return this;
  }
}

export class CredentialRotationPlan {
  constructor({
    credentialFingerprint,
    provider,
    affectedAssets = [],
    affectedRepositories = [],
    affectedDeployments = [],
    owner,
    risk = 0,
    dependencies = [],
    downtimeRisk = 0,
    verificationPlan = [],
    organizationId = 'default-org',
  }) {
    this.planId = `rotation_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    this.credentialFingerprint = credentialFingerprint;
    this.provider = provider;
    this.affectedAssets = affectedAssets;
    this.affectedRepositories = affectedRepositories;
    this.affectedDeployments = affectedDeployments;
    this.owner = owner;
    this.risk = clamp(risk);
    this.dependencies = dependencies;
    this.downtimeRisk = clamp(downtimeRisk);
    this.verificationPlan = verificationPlan;
    this.organizationId = organizationId;
    this.state = 'IDENTIFIED';
    this.mode = 'DRY_RUN';
    this.createdAt = nowIso();
  }

  plan() {
    this.state = 'PLANNED';
    return this;
  }

  approve() {
    this.state = 'APPROVED';
    this.mode = 'ACTIVE';
    return this;
  }

  verify() {
    this.state = 'VERIFICATION';
    return this;
  }
}

export class UnifiedIdentitySecurityCommandCenter {
  constructor({ organizationId = 'default-org' } = {}) {
    this.organizationId = organizationId;
    this.identityGraph = new IdentityGraphService({ organizationId });
    this.privilegedAccess = new PrivilegedAccessEngine({ organizationId });
    this.credentials = new CredentialLifecycleEngine({ organizationId });
    this.machines = new MachineIdentityEngine({ organizationId });
    this.accessPaths = new AccessPathEngine({ organizationId });
    this.jit = new JustInTimeAccessEngine({ organizationId });
    this.identityRisk = new IdentityRiskEngine({ organizationId });
    this.reviews = [];
    this.rotationPlans = [];
  }

  addIdentity(identity) {
    return this.identityGraph.addIdentity(identity);
  }

  addPrivilegedPermission(permission) {
    return this.privilegedAccess.register(permission);
  }

  registerCredential(credential) {
    return this.credentials.registerCredential(credential);
  }

  registerMachine(machine) {
    return this.machines.register(machine);
  }

  createAccessPath(path) {
    return this.accessPaths.linkPath(path);
  }

  createReview(review) {
    const entry = new AccessReview({ organizationId: review.organizationId || this.organizationId, ...review });
    this.reviews.push(entry);
    return entry;
  }

  createRotationPlan(plan) {
    const entry = new CredentialRotationPlan({ organizationId: plan.organizationId || this.organizationId, ...plan });
    this.rotationPlans.push(entry);
    return entry;
  }

  postureSummary() {
    return {
      organizationId: this.organizationId,
      privilegedIdentities: this.privilegedAccess.permissions.size,
      machineIdentities: this.machines.identities.size,
      exposedCredentials: this.credentials.getExpiring().length,
      accessPaths: this.accessPaths.paths.length,
      pendingReviews: this.reviews.filter((review) => review.status !== 'CERTIFIED').length,
      rotationRequired: this.rotationPlans.filter((plan) => ['IDENTIFIED', 'PLANNED', 'APPROVAL_REQUIRED', 'VERIFICATION'].includes(plan.state)).length,
      identityRisk: 31,
      generatedAt: nowIso(),
    };
  }
}

export const identitySecurityCommandCenter = new UnifiedIdentitySecurityCommandCenter({ organizationId: 'default-org' });
export default UnifiedIdentitySecurityCommandCenter;
