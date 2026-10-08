/**
 * app-src/lib/threat-intelligence/index.js
 *
 * Evidence-backed threat intelligence layer for SecretShield.
 *
 * Purpose:
 * - normalize external security feed data into a stable internal model
 * - deduplicate similar advisories across sources
 * - correlate intelligence with package and repository evidence
 * - classify impact deterministically without making unsupported claims
 */

export const THREAT_RELEVANCE = Object.freeze({
  POTENTIALLY_RELEVANT: 'POTENTIALLY_RELEVANT',
  CONFIRMED_RELEVANT: 'CONFIRMED_RELEVANT',
  NOT_RELEVANT: 'NOT_RELEVANT',
  UNKNOWN: 'UNKNOWN',
});

export const THREAT_SEVERITY = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN',
});

export const DEFAULT_THREAT_SOURCES = [
  {
    id: 'github-advisory-db',
    name: 'GitHub Advisory Database',
    type: 'advisory-feed',
    url: 'https://github.com/advisories',
    status: 'ACTIVE',
    freshnessWindowMs: 86_400_000,
    description: 'Public security advisories for vulnerable packages and ecosystems.',
  },
  {
    id: 'osv',
    name: 'OSV',
    type: 'advisory-feed',
    url: 'https://osv.dev',
    status: 'ACTIVE',
    freshnessWindowMs: 86_400_000,
    description: 'Open Source Vulnerabilities database covering package ecosystems.',
  },
];

export class ThreatIntelSource {
  constructor({
    id,
    name,
    type,
    url,
    status = 'ACTIVE',
    description = '',
    freshnessWindowMs = 86_400_000,
    lastSuccessfulFetch = null,
    lastFetchAt = null,
    records = [],
  } = {}) {
    this.id = id || `source_${Math.random().toString(36).slice(2, 10)}`;
    this.name = name || this.id;
    this.type = type || 'advisory-feed';
    this.url = url || '';
    this.status = status;
    this.description = description;
    this.freshnessWindowMs = freshnessWindowMs;
    this.lastSuccessfulFetch = lastSuccessfulFetch ? new Date(lastSuccessfulFetch) : null;
    this.lastFetchAt = lastFetchAt ? new Date(lastFetchAt) : null;
    this.records = Array.isArray(records) ? records : [];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      url: this.url,
      status: this.status,
      description: this.description,
      freshnessWindowMs: this.freshnessWindowMs,
      lastSuccessfulFetch: this.lastSuccessfulFetch ? this.lastSuccessfulFetch.toISOString() : null,
      lastFetchAt: this.lastFetchAt ? this.lastFetchAt.toISOString() : null,
      recordCount: this.records.length,
    };
  }
}

export class ThreatIndicator {
  constructor({
    kind = 'package',
    value = '',
    type = 'name',
    source = '',
  } = {}) {
    this.kind = kind;
    this.value = value;
    this.type = type;
    this.source = source;
  }
}

export class ThreatRelationship {
  constructor({
    type = 'related-to',
    source = '',
    target = '',
    evidence = [],
  } = {}) {
    this.type = type;
    this.source = source;
    this.target = target;
    this.evidence = Array.isArray(evidence) ? evidence : [];
  }
}

export class ThreatIntelItem {
  constructor({
    id,
    sourceId,
    sourceName,
    sourceType,
    title,
    summary,
    severity = THREAT_SEVERITY.UNKNOWN,
    ecosystem = 'unknown',
    packageNames = [],
    advisoryId = null,
    cve = null,
    references = [],
    evidence = {},
    publishedAt = null,
    receivedAt = null,
    status = 'ACTIVE',
    tags = [],
    relationships = [],
    provenance = {},
  } = {}) {
    this.id = id || `intel_${Math.random().toString(36).slice(2, 11)}`;
    this.sourceId = sourceId || '';
    this.sourceName = sourceName || '';
    this.sourceType = sourceType || 'advisory-feed';
    this.title = title || 'Unnamed threat intelligence item';
    this.summary = summary || '';
    this.severity = String(severity || THREAT_SEVERITY.UNKNOWN).toUpperCase();
    this.ecosystem = String(ecosystem || 'unknown').toLowerCase();
    this.packageNames = Array.isArray(packageNames) ? packageNames.map(v => String(v).trim()).filter(Boolean) : [];
    this.advisoryId = advisoryId || null;
    this.cve = cve || null;
    this.references = Array.isArray(references) ? references.filter(Boolean) : [];
    this.evidence = evidence && typeof evidence === 'object' ? evidence : {};
    this.publishedAt = publishedAt ? new Date(publishedAt) : null;
    this.receivedAt = receivedAt ? new Date(receivedAt) : new Date();
    this.status = String(status || 'ACTIVE').toUpperCase();
    this.tags = Array.isArray(tags) ? tags.map(String) : [];
    this.relationships = Array.isArray(relationships) ? relationships : [];
    this.provenance = provenance && typeof provenance === 'object' ? provenance : {};
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      sourceName: this.sourceName,
      sourceType: this.sourceType,
      title: this.title,
      summary: this.summary,
      severity: this.severity,
      ecosystem: this.ecosystem,
      packageNames: [...this.packageNames],
      advisoryId: this.advisoryId,
      cve: this.cve,
      references: [...this.references],
      evidence: this.evidence,
      publishedAt: this.publishedAt ? this.publishedAt.toISOString() : null,
      receivedAt: this.receivedAt ? this.receivedAt.toISOString() : null,
      status: this.status,
      tags: [...this.tags],
      relationships: this.relationships,
      provenance: this.provenance,
    };
  }
}

export class ThreatImpact {
  constructor({
    threatId,
    threatTitle,
    packageName,
    ecosystem,
    relevance = THREAT_RELEVANCE.UNKNOWN,
    score = 0,
    summary = '',
    evidence = [],
  } = {}) {
    this.threatId = threatId || null;
    this.threatTitle = threatTitle || 'Threat intelligence item';
    this.packageName = packageName || null;
    this.ecosystem = ecosystem || 'unknown';
    this.relevance = String(relevance || THREAT_RELEVANCE.UNKNOWN).toUpperCase();
    this.score = Number(score) || 0;
    this.summary = summary || '';
    this.evidence = Array.isArray(evidence) ? evidence : [];
  }

  toJSON() {
    return {
      threatId: this.threatId,
      threatTitle: this.threatTitle,
      packageName: this.packageName,
      ecosystem: this.ecosystem,
      relevance: this.relevance,
      score: this.score,
      summary: this.summary,
      evidence: this.evidence,
    };
  }
}

export class ThreatIntelSnapshot {
  constructor({
    sources = [],
    items = [],
    impacts = [],
    generatedAt = new Date(),
  } = {}) {
    this.sources = Array.isArray(sources) ? sources : [];
    this.items = Array.isArray(items) ? items : [];
    this.impacts = Array.isArray(impacts) ? impacts : [];
    this.generatedAt = generatedAt instanceof Date ? generatedAt : new Date(generatedAt || Date.now());
  }

  toJSON() {
    return {
      generatedAt: this.generatedAt.toISOString(),
      sourceCount: this.sources.length,
      itemCount: this.items.length,
      impacts: this.impacts.map(item => item.toJSON ? item.toJSON() : item),
      sources: this.sources.map(item => item.toJSON ? item.toJSON() : item),
      items: this.items.map(item => item.toJSON ? item.toJSON() : item),
    };
  }
}

function normalizePackageNames(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[|,;\s]+/).map(v => v.trim()).filter(Boolean);
  return [];
}

export function normalizeThreatIntelItem(rawItem, source = null) {
  if (rawItem instanceof ThreatIntelItem) return rawItem;

  const sourceId = rawItem?.sourceId || source?.id || 'unknown';
  const sourceName = rawItem?.sourceName || source?.name || 'Unknown source';
  const sourceType = rawItem?.sourceType || source?.type || 'advisory-feed';
  const parsed = new ThreatIntelItem({
    id: rawItem?.id || rawItem?.advisoryId || `${sourceId}_${Math.random().toString(36).slice(2, 9)}`,
    sourceId,
    sourceName,
    sourceType,
    title: rawItem?.title || rawItem?.summary || 'Threat intelligence item',
    summary: rawItem?.summary || rawItem?.title || '',
    severity: rawItem?.severity || rawItem?.score || THREAT_SEVERITY.UNKNOWN,
    ecosystem: rawItem?.ecosystem || 'unknown',
    packageNames: normalizePackageNames(rawItem?.packageNames || rawItem?.package || rawItem?.name || []),
    advisoryId: rawItem?.advisoryId || rawItem?.id || null,
    cve: rawItem?.cve || rawItem?.identifier || null,
    references: Array.isArray(rawItem?.references) ? rawItem.references : rawItem?.url ? [rawItem.url] : [],
    evidence: rawItem?.evidence || {},
    publishedAt: rawItem?.publishedAt || rawItem?.firstSeenAt || rawItem?.updatedAt || null,
    receivedAt: rawItem?.receivedAt || new Date(),
    status: rawItem?.status || 'ACTIVE',
    tags: Array.isArray(rawItem?.tags) ? rawItem.tags : [],
    relationships: Array.isArray(rawItem?.relationships) ? rawItem.relationships : [],
    provenance: rawItem?.provenance || {
      source: sourceName,
      externalId: rawItem?.advisoryId || rawItem?.id || null,
    },
  });

  if (!parsed.packageNames.length && rawItem?.packageName) {
    parsed.packageNames = [rawItem.packageName];
  }

  return parsed;
}

export function dedupeThreatIntelItems(items = []) {
  const seen = new Map();
  for (const item of items) {
    const normalized = normalizeThreatIntelItem(item);
    const fingerprint = [
      normalized.sourceId,
      normalized.advisoryId || normalized.id,
      normalized.cve || '',
      normalized.packageNames.join('|'),
      normalized.title,
    ].join('::');

    if (!seen.has(fingerprint)) {
      seen.set(fingerprint, normalized);
    }
  }
  return Array.from(seen.values());
}

export function ingestThreatIntelFeed(feedSource, rawItems = []) {
  const source = feedSource instanceof ThreatIntelSource ? feedSource : new ThreatIntelSource(feedSource || {});
  const normalizedItems = dedupeThreatIntelItems((rawItems || []).map(item => normalizeThreatIntelItem(item, source)));

  source.records = normalizedItems;
  source.lastFetchAt = new Date();
  source.lastSuccessfulFetch = source.status === 'ACTIVE' ? new Date() : source.lastSuccessfulFetch;

  const ageMs = source.lastSuccessfulFetch ? Date.now() - source.lastSuccessfulFetch.getTime() : Infinity;
  if (source.freshnessWindowMs && ageMs > source.freshnessWindowMs) {
    source.status = 'STALE';
  }

  return { source, items: normalizedItems };
}

export function correlateThreatsWithDependencies(threatItems = [], dependencies = []) {
  const impacts = [];

  for (const threat of threatItems) {
    const normalized = normalizeThreatIntelItem(threat);
    const matchingPackages = dependencies.filter(dep => {
      const depName = String(dep?.name || '').toLowerCase();
      const depEcosystem = String(dep?.ecosystem || '').toLowerCase();
      const packageNames = normalized.packageNames.map(name => String(name).toLowerCase());
      const ecosystemMatch = !depEcosystem || depEcosystem === normalized.ecosystem || normalized.ecosystem === 'unknown';
      return ecosystemMatch && packageNames.includes(depName);
    });

    const relevance = matchingPackages.length > 0
      ? THREAT_RELEVANCE.CONFIRMED_RELEVANT
      : normalized.packageNames.length > 0
        ? THREAT_RELEVANCE.POTENTIALLY_RELEVANT
        : THREAT_RELEVANCE.UNKNOWN;

    const score = relevance === THREAT_RELEVANCE.CONFIRMED_RELEVANT
      ? 90
      : relevance === THREAT_RELEVANCE.POTENTIALLY_RELEVANT
        ? 55
        : 10;

    const evidence = matchingPackages.length > 0
      ? matchingPackages.map(dep => ({
          packageName: dep.name,
          ecosystem: dep.ecosystem || normalized.ecosystem,
          version: dep.version || null,
          reason: `Matches threat advisory package name ${normalized.packageNames.join(', ')}`,
        }))
      : normalized.packageNames.length > 0
        ? normalized.packageNames.map(packageName => ({
            packageName,
            ecosystem: normalized.ecosystem,
            reason: 'Package is relevant to the threat but was not found in current dependency inventory.',
          }))
        : [{ reason: 'No package name was available for direct correlation.' }];

    impacts.push(
      new ThreatImpact({
        threatId: normalized.id,
        threatTitle: normalized.title,
        packageName: matchingPackages[0]?.name || normalized.packageNames[0] || null,
        ecosystem: matchingPackages[0]?.ecosystem || normalized.ecosystem,
        relevance,
        score,
        summary: `${normalized.title} is ${relevance.toLowerCase().replace(/_/g, ' ')} to the current dependency inventory.`,
        evidence,
      })
    );
  }

  return impacts;
}

export function buildThreatIntelSnapshot({
  sources = DEFAULT_THREAT_SOURCES,
  items = [],
  dependencies = [],
  generatedAt = new Date(),
} = {}) {
  const configuredSources = (sources || []).map(source => new ThreatIntelSource(source));
  const normalizedItems = dedupeThreatIntelItems(items.map(item => normalizeThreatIntelItem(item)));
  const impacts = correlateThreatsWithDependencies(normalizedItems, dependencies);

  for (const source of configuredSources) {
    const sourceItems = normalizedItems.filter(item => item.sourceId === source.id);
    source.records = sourceItems;
  }

  return new ThreatIntelSnapshot({
    sources: configuredSources,
    items: normalizedItems,
    impacts,
    generatedAt,
  });
}

export function getThreatIntelligenceOverview({
  sources = DEFAULT_THREAT_SOURCES,
  items = [],
  dependencies = [],
} = {}) {
  const snapshot = buildThreatIntelSnapshot({ sources, items, dependencies });
  const potentiallyRelevant = snapshot.impacts.filter(item => item.relevance === THREAT_RELEVANCE.POTENTIALLY_RELEVANT).length;
  const confirmedRelevant = snapshot.impacts.filter(item => item.relevance === THREAT_RELEVANCE.CONFIRMED_RELEVANT).length;

  return {
    generatedAt: snapshot.generatedAt.toISOString(),
    sourceCount: snapshot.sources.length,
    itemCount: snapshot.items.length,
    impactCount: snapshot.impacts.length,
    confirmedRelevant,
    potentiallyRelevant,
    impactedPackages: [...new Set(snapshot.impacts.map(item => item.packageName).filter(Boolean))],
    sources: snapshot.sources.map(source => source.toJSON()),
    items: snapshot.items.map(item => item.toJSON()),
    impacts: snapshot.impacts.map(item => item.toJSON()),
  };
}
