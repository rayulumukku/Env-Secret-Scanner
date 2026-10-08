import { createHash } from 'node:crypto';
import { securityContextSanitizer } from './security-context-sanitizer.js';

export class SecurityIntelligenceEngine {
  constructor({ organizationId }) {
    this.organizationId = organizationId;
    this.signalStore = [];
  }

  _sanitizeMetadata(metadata = {}) {
    const sanitized = securityContextSanitizer.sanitize(metadata);
    if (sanitized && typeof sanitized === 'object') {
      delete sanitized.rawValue;
      delete sanitized.secretValue;
      delete sanitized.value;
      delete sanitized.password;
      delete sanitized.token;
    }
    return sanitized;
  }

  normalizeSignal(signal) {
    const timestamp = signal.timestamp || new Date().toISOString();
    const source = signal.source || 'system';
    const type = signal.type || 'UNKNOWN_SIGNAL';
    const severity = (signal.severity || 'MEDIUM').toUpperCase();
    const confidence = Number(signal.confidence ?? 0.5);
    const entityId = signal.entityId || `entity_${Date.now()}`;
    const entityType = (signal.entityType || 'UNKNOWN').toUpperCase();
    const fingerprint = signal.fingerprint || `fp:${createHash('sha256').update(`${this.organizationId}:${entityType}:${entityId}:${timestamp}`).digest('hex').slice(0, 24)}`;

    return {
      signalId: `sig_${createHash('sha256').update(`${this.organizationId}:${source}:${type}:${entityId}:${timestamp}`).digest('hex').slice(0, 20)}`,
      organizationId: signal.organizationId || this.organizationId,
      source,
      type,
      severity,
      confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.5,
      timestamp,
      entityId,
      entityType,
      fingerprint,
      metadata: this._sanitizeMetadata(signal.metadata || {}),
      correlationKeys: Array.from(new Set([...(signal.correlationKeys || []), this.organizationId, entityId, fingerprint])),
    };
  }

  consumeSignal(signal) {
    const normalized = this.normalizeSignal(signal);
    this.signalStore.push(normalized);
    return [normalized];
  }

  consumeSignals(signals = []) {
    return signals.flatMap((signal) => this.consumeSignal(signal));
  }

  getSignalsByOrganization(organizationId = this.organizationId) {
    return this.signalStore.filter((signal) => signal.organizationId === organizationId);
  }

  getSignalsByEntity(entityId, entityType) {
    return this.signalStore.filter((signal) => signal.entityId === entityId && signal.entityType === entityType);
  }

  buildOverview(organizationId = this.organizationId) {
    const signals = this.getSignalsByOrganization(organizationId);
    const byType = {};
    for (const signal of signals) {
      byType[signal.type] = (byType[signal.type] || 0) + 1;
    }

    return {
      organizationId,
      generatedAt: new Date().toISOString(),
      signals: signals.slice(-25),
      totals: {
        totalSignals: signals.length,
        critical: signals.filter((signal) => signal.severity === 'CRITICAL').length,
        high: signals.filter((signal) => signal.severity === 'HIGH').length,
      },
      byType,
      posture: signals.length > 0 ? 'ATTENTION_REQUIRED' : 'STABLE',
    };
  }
}

export const securityIntelligenceEngine = new SecurityIntelligenceEngine({ organizationId: 'default' });
