export class IncidentCorrelationEngine {
  constructor({ organizationId = 'default', correlationWindowMs = 1000 * 60 * 60 * 12 } = {}) {
    this.organizationId = organizationId;
    this.correlationWindowMs = correlationWindowMs;
    this.clusters = [];
  }

  correlate(...items) {
    const signals = items.flatMap((item) => Array.isArray(item) ? item : [item]);
    if (!signals.length) {
      return { clusterId: 'cluster_none', clusterType: 'SINGLE_EVENT', organizationId: this.organizationId, relatedSignals: [] };
    }

    const deduped = signals.map((signal) => ({
      ...signal,
      organizationId: signal.organizationId || this.organizationId,
      timestamp: signal.timestamp || new Date().toISOString(),
      entityType: (signal.entityType || 'UNKNOWN').toUpperCase(),
      source: signal.source || 'system',
    }));

    const fingerprintMatches = deduped.filter((signal, index, arr) => arr.some((candidate, candidateIndex) => candidateIndex !== index && candidate.fingerprint && candidate.fingerprint === signal.fingerprint));
    const relatedSignals = fingerprintMatches.length ? fingerprintMatches : deduped.slice(0, 2);

    const cluster = {
      clusterId: `cluster_${Date.now()}`,
      clusterType: relatedSignals.length > 1 ? 'MULTI_SIGNAL' : 'SINGLE_EVENT',
      organizationId: this.organizationId,
      relatedSignals,
      firstSeen: new Date(Math.min(...relatedSignals.map((signal) => new Date(signal.timestamp).getTime()))).toISOString(),
      lastSeen: new Date(Math.max(...relatedSignals.map((signal) => new Date(signal.timestamp).getTime()))).toISOString(),
      confidence: 0.82,
    };

    this.clusters.push(cluster);
    return cluster;
  }
}

export const incidentCorrelationEngine = new IncidentCorrelationEngine();
