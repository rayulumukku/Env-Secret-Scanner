/**
 * @file lib/scanner/cache.js
 * @description In-memory and commit-level scan metadata caching for high-performance incremental scans.
 * 
 * SECURITY GUARANTEES:
 *   - NEVER caches raw secret values or raw source code.
 *   - Stores strictly masked findings, deterministic fingerprints, and execution metrics.
 *   - Cache keys use deterministic hash: SHA-256(commitHash + ':' + fileHash + ':' + ruleVersion).
 */

import crypto from 'crypto';
import { RULE_VERSION, SCANNER_VERSION } from '../version.js';

class ScanMetadataCache {
  /**
   * @param {number} [maxEntries=10000]
   */
  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  /**
   * Generates a deterministic cache key.
   * @param {string} commitHash 
   * @param {string} filePath 
   * @param {string} [contentOrFileHash=''] 
   * @param {string} [ruleVersion=RULE_VERSION] 
   * @returns {string} Cache key
   */
  generateKey(commitHash, filePath, contentOrFileHash = '', ruleVersion = RULE_VERSION) {
    const rawKey = `${commitHash || 'head'}:${filePath}:${contentOrFileHash}:${ruleVersion}`;
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Retrieves cached scan findings for a file if available.
   * @param {string} key 
   * @returns {Array<Object>|null}
   */
  get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      const entry = this.cache.get(key);
      // Refresh LRU order
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.findings;
    }
    this.stats.misses++;
    return null;
  }

  /**
   * Caches safe findings for a file.
   * @param {string} key 
   * @param {Array<Object>} findings - Masked findings only
   * @param {Object} [metadata] 
   */
  set(key, findings, metadata = {}) {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    // Ensure all findings are stripped of any unsafe fields before caching
    const safeFindings = (findings || []).map(f => ({
      id: f.id,
      fingerprint: f.fingerprint,
      ruleId: f.ruleId,
      ruleName: f.ruleName,
      category: f.category,
      severity: f.severity,
      confidence: f.confidence,
      file: f.file,
      line: f.line,
      column: f.column,
      maskedValue: f.maskedValue,
      entropy: f.entropy,
      description: f.description,
      remediation: f.remediation,
      ruleVersion: RULE_VERSION,
      scannerVersion: SCANNER_VERSION
    }));

    this.cache.set(key, {
      findings: safeFindings,
      timestamp: Date.now(),
      metadata
    });
    this.stats.sets++;
  }

  /**
   * Clears the cache.
   */
  clear() {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.sets = 0;
  }

  /**
   * Cache metrics.
   * @returns {Object}
   */
  getMetrics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate.toFixed(1)}%`,
      ruleVersion: RULE_VERSION,
      scannerVersion: SCANNER_VERSION
    };
  }
}

export const scanCache = new ScanMetadataCache();
