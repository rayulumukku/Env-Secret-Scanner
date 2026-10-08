const SECRET_KEY_TOKENS = [
  'secret', 'token', 'password', 'passphrase', 'authorization', 'api_key', 'apikey',
  'access_key', 'private_key', 'client_secret', 'jwt', 'bearer', 'credential',
  'keymaterial', 'sessionid'
];

export const SECURITY_EVENT_CATEGORIES = {
  SCAN: 'SCAN',
  FINDING: 'FINDING',
  EXPOSURE: 'EXPOSURE',
  REMEDIATION: 'REMEDIATION',
  POLICY: 'POLICY',
  PR: 'PR',
  COMMIT: 'COMMIT',
  DEPLOYMENT: 'DEPLOYMENT',
  DEPENDENCY: 'DEPENDENCY',
  THREAT: 'THREAT',
  INCIDENT: 'INCIDENT',
  AUTOMATION: 'AUTOMATION',
  INTEGRATION: 'INTEGRATION',
  AUTHENTICATION: 'AUTHENTICATION',
  ACCESS_REVIEW: 'ACCESS_REVIEW',
};

export const SECURITY_EVENT_TYPES = Object.freeze({
  SCAN: 'SCAN',
  FINDING: 'FINDING',
  EXPOSURE: 'EXPOSURE',
  REMEDIATION: 'REMEDIATION',
  POLICY: 'POLICY',
  PR: 'PR',
  COMMIT: 'COMMIT',
  DEPLOYMENT: 'DEPLOYMENT',
  DEPENDENCY: 'DEPENDENCY',
  THREAT: 'THREAT',
  INCIDENT: 'INCIDENT',
  AUTOMATION: 'AUTOMATION',
  INTEGRATION: 'INTEGRATION',
  AUTHENTICATION: 'AUTHENTICATION',
  ACCESS_REVIEW: 'ACCESS_REVIEW',
  SECURITY_REGRESSION: 'SECURITY_REGRESSION',
  SECURITY_IMPROVEMENT: 'SECURITY_IMPROVEMENT',
});

export const SECURITY_EVENT_SCHEMA_VERSIONS = ['v1', 'v2'];

export function sanitizeSecurityMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return {};

  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    const normalizedKey = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDisallowed = SECRET_KEY_TOKENS.some((token) => normalizedKey.includes(token));
    if (isDisallowed) continue;

    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      if (value.length > 256) {
        clean[key] = `${value.slice(0, 128)}…[TRUNCATED]`;
      } else {
        clean[key] = value;
      }
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      clean[key] = value.map((item) => sanitizeSecurityMetadata(item)).filter(Boolean);
      continue;
    }
    if (typeof value === 'object') {
      clean[key] = sanitizeSecurityMetadata(value);
    }
  }
  return clean;
}

function makeEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getCategory(eventType) {
  const safeType = String(eventType || '').toUpperCase();
  return Object.values(SECURITY_EVENT_CATEGORIES).includes(safeType) ? safeType : 'SCAN';
}

function normalizeTimestamp(timestamp) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

export function buildSecurityEvent({
  organizationId,
  projectId = null,
  repositoryId = null,
  eventType,
  timestamp = new Date().toISOString(),
  actorId = null,
  source = 'system',
  relatedEntityId = null,
  metadata = {},
  evidenceIds = [],
  schemaVersion = 'v2',
}) {
  return {
    eventId: makeEventId(),
    organizationId: String(organizationId || 'unknown-org'),
    projectId: projectId ? String(projectId) : null,
    repositoryId: repositoryId ? String(repositoryId) : null,
    eventType: String(eventType || '').toUpperCase(),
    category: getCategory(eventType),
    timestamp: normalizeTimestamp(timestamp),
    actorId: actorId ? String(actorId) : null,
    source: String(source || 'system'),
    relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
    metadata: sanitizeSecurityMetadata(metadata),
    evidenceIds: Array.isArray(evidenceIds) ? evidenceIds.map((id) => String(id)) : [],
    schemaVersion: SECURITY_EVENT_SCHEMA_VERSIONS.includes(schemaVersion) ? schemaVersion : 'v2',
  };
}

export function validateSecurityEvent(event) {
  if (!event || typeof event !== 'object') return false;
  if (!event.organizationId) return false;
  if (!event.eventType) return false;
  if (!event.timestamp) return false;

  const date = new Date(event.timestamp);
  if (Number.isNaN(date.getTime())) return false;

  if (!Object.values(SECURITY_EVENT_TYPES).includes(String(event.eventType).toUpperCase())) {
    return false;
  }

  if (event.metadata && typeof event.metadata !== 'object') return false;
  if (event.evidenceIds && !Array.isArray(event.evidenceIds)) return false;

  return true;
}

export function migrateSecurityEvent(event) {
  if (!event || typeof event !== 'object') {
    return { quarantined: true, reasons: ['event is missing'], event: null };
  }

  const base = {
    organizationId: event.organizationId,
    projectId: event.projectId ?? null,
    repositoryId: event.repositoryId ?? null,
    eventType: event.eventType,
    timestamp: event.timestamp ?? new Date().toISOString(),
    actorId: event.actorId ?? null,
    source: event.source ?? 'system',
    relatedEntityId: event.relatedEntityId ?? null,
    metadata: sanitizeSecurityMetadata(event.metadata ?? {}),
    evidenceIds: Array.isArray(event.evidenceIds) ? event.evidenceIds : [],
  };

  const migrated = buildSecurityEvent({ ...base, schemaVersion: 'v2' });
  migrated.schemaVersion = 'v2';
  migrated.eventType = String(migrated.eventType).toUpperCase();
  return migrated;
}

export function ingestSecurityEvent(event) {
  if (!event || typeof event !== 'object') {
    return { quarantined: true, reasons: ['event is missing'], event: null };
  }

  const reasons = [];
  if (event.timestamp && Number.isNaN(new Date(event.timestamp).getTime())) {
    reasons.push('invalid timestamp');
  }

  const candidate = event.schemaVersion === 'v1' || !event.schemaVersion ? migrateSecurityEvent(event) : event;

  if (!validateSecurityEvent(candidate)) {
    reasons.push('invalid event payload');
  }

  if (!candidate.organizationId) reasons.push('missing organizationId');
  if (!candidate.eventType) reasons.push('missing eventType');
  if (!candidate.timestamp || Number.isNaN(new Date(candidate.timestamp).getTime())) {
    reasons.push('invalid timestamp');
  }

  const normalized = candidate && candidate.eventId ? candidate : buildSecurityEvent({
    organizationId: candidate.organizationId ?? 'unknown-org',
    projectId: candidate.projectId,
    repositoryId: candidate.repositoryId,
    eventType: candidate.eventType,
    timestamp: candidate.timestamp,
    actorId: candidate.actorId,
    source: candidate.source,
    relatedEntityId: candidate.relatedEntityId,
    metadata: candidate.metadata,
    evidenceIds: candidate.evidenceIds,
    schemaVersion: 'v2',
  });

  if (reasons.length > 0) {
    return {
      quarantined: true,
      reasons,
      event: normalized,
      schemaVersion: normalized.schemaVersion,
    };
  }

  return {
    quarantined: false,
    reasons: [],
    event: normalized,
    schemaVersion: normalized.schemaVersion,
  };
}

export function createDailySecuritySnapshot(events = [], dateKey = new Date().toISOString().slice(0, 10), organizationId = null) {
  const day = new Date(dateKey);
  const safeEnd = new Date(day.getTime());
  safeEnd.setUTCHours(23, 59, 59, 999);

  const subset = (events || []).filter((event) => {
    if (organizationId && event.organizationId !== organizationId) return false;
    const ts = new Date(event.timestamp).getTime();
    return Number.isFinite(ts) && ts <= safeEnd.getTime();
  });

  const openFindings = subset.filter((event) => event.eventType === 'FINDING' && event.metadata?.status === 'OPEN').length;
  const criticalFindings = subset.filter((event) => event.eventType === 'FINDING' && event.metadata?.severity === 'CRITICAL').length;
  const highFindings = subset.filter((event) => event.eventType === 'FINDING' && event.metadata?.severity === 'HIGH').length;
  const uniqueExposedFingerprints = new Set(
    subset.filter((event) => event.relatedEntityId || event.metadata?.fingerprint)
      .map((event) => event.metadata?.fingerprint || event.relatedEntityId)
      .filter(Boolean)
  );
  const repositoriesWithFindings = new Set(
    subset.filter((event) => event.eventType === 'FINDING' && event.repositoryId)
      .map((event) => event.repositoryId)
  );

  const remediationBacklog = subset.filter((event) => {
    if (event.eventType !== 'REMEDIATION') return false;
    const status = String(event.metadata?.status || '').toUpperCase();
    return ['PENDING', 'OPEN', 'IN_PROGRESS', 'REVIEW_REQUIRED'].includes(status);
  }).length;

  return {
    date: dateKey,
    organizationId,
    openFindings,
    criticalFindings,
    highFindings,
    uniqueExposedFingerprints: uniqueExposedFingerprints.size,
    repositoriesWithFindings: repositoriesWithFindings.size,
    unresolvedExposureDuration: 0,
    dependencyVulnerabilities: subset.filter((event) => event.eventType === 'DEPENDENCY').length,
    deploymentViolations: subset.filter((event) => event.eventType === 'DEPLOYMENT' && String(event.metadata?.status || '').toUpperCase() === 'BLOCKED').length,
    policyViolations: subset.filter((event) => event.eventType === 'POLICY' && String(event.metadata?.status || '').toUpperCase() !== 'PASSED').length,
    incidents: subset.filter((event) => event.eventType === 'INCIDENT').length,
    remediationBacklog,
    observedMetrics: true,
    calculationMethod: 'count of observed events by category and status for the selected day',
  };
}

export function detectRegression(events = [], { organizationId, metric, previousCount, currentCount }) {
  if (currentCount <= previousCount) {
    return null;
  }

  return {
    organizationId,
    metric,
    eventType: 'SECURITY_REGRESSION',
    previousCount,
    currentCount,
    delta: currentCount - previousCount,
    comparisonPeriod: `${previousCount} -> ${currentCount}`,
    timestamp: new Date().toISOString(),
    source: 'analytics',
    metadata: { metric, threshold: 'increase observed', observed: true },
  };
}

export function detectImprovement(events = [], { organizationId, metric, previousCount, currentCount }) {
  if (currentCount >= previousCount) {
    return null;
  }

  return {
    organizationId,
    metric,
    eventType: 'SECURITY_IMPROVEMENT',
    previousCount,
    currentCount,
    delta: previousCount - currentCount,
    comparisonPeriod: `${previousCount} -> ${currentCount}`,
    timestamp: new Date().toISOString(),
    source: 'analytics',
    metadata: { metric, threshold: 'decrease observed', observed: true },
  };
}

export function getHistoricalReplay({ organizationId, asOfDate, events = [] }) {
  const labelDate = new Date(asOfDate);
  const dateLabel = labelDate.toISOString().slice(0, 10);
  const cutoff = labelDate.getTime();
  const stateEvents = (events || []).filter((event) => {
    if (event.organizationId !== organizationId) return false;
    return new Date(event.timestamp).getTime() <= cutoff;
  });

  return {
    organizationId,
    asOfDate,
    label: `Historical state — ${dateLabel}`,
    snapshot: createDailySecuritySnapshot(stateEvents, dateLabel, organizationId),
    events: stateEvents.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    historicalView: true,
    readOnly: true,
  };
}

export function buildForensicTimeline({ organizationId, repositoryId = null, fingerprint = null, findingId = null, eventType = null, events = [] }) {
  const filtered = (events || []).filter((event) => {
    if (event.organizationId !== organizationId) return false;
    if (repositoryId && event.repositoryId !== repositoryId) return false;
    if (fingerprint && (event.relatedEntityId !== fingerprint) && (event.metadata?.fingerprint !== fingerprint)) return false;
    if (findingId && event.relatedEntityId !== findingId) return false;
    if (eventType && event.eventType !== eventType) return false;
    return true;
  });

  return {
    organizationId,
    repositoryId,
    fingerprint,
    findingId,
    events: filtered.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
  };
}
