/**
 * lib/automation/reintroduction.js
 *
 * Secret Reintroduction Detection Engine for SecretShield.
 * Identifies when a previously remediated or resolved secret fingerprint resurfaces in code.
 *
 * SAFETY INVARIANTS:
 *   - Uses exact cryptographic fingerprint comparison (never heuristic similarity).
 *   - Tracks time elapsed between original resolution and reintroduction.
 *   - Generates explicit evidence linking both historical and current occurrences.
 */

import { createSecurityEvent, SECURITY_EVENT_TYPES, EVENT_SOURCES } from './events.js';
import { createEvidence } from '../exposure/evidence.js';

/**
 * Check a list of new findings against historical exposure state.
 * Emits SECRET_REINTRODUCED events if a previously resolved fingerprint appears again.
 *
 * @param {object[]} currentFindings - Array of detected findings from current scan
 * @param {object[]} historicalClusters - Array of known exposure clusters for organization
 * @param {object} context - Scan context { organizationId, repositoryId, commitHash, branch, source }
 * @returns {{ reintroducedEvents: object[], newEvidences: object[] }}
 */
export function detectSecretReintroduction(currentFindings = [], historicalClusters = [], context = {}) {
  const { organizationId, repositoryId, commitHash, branch, source = EVENT_SOURCES.CLI_SCAN } = context;
  const reintroducedEvents = [];
  const newEvidences = [];

  const resolvedMap = new Map();
  for (const cluster of historicalClusters) {
    if (cluster.status === 'REMEDIATED' || cluster.status === 'RESOLVED' || cluster.status === 'VERIFIED') {
      resolvedMap.set(cluster.fingerprint, cluster);
    }
  }

  for (const finding of currentFindings) {
    const historical = resolvedMap.get(finding.fingerprint);
    if (historical) {
      const resolvedAt = historical.resolvedAt ? new Date(historical.resolvedAt).getTime() : 0;
      const now = Date.now();
      const elapsedMs = resolvedAt > 0 ? now - resolvedAt : 0;
      const elapsedDays = Math.round(elapsedMs / (1000 * 60 * 60 * 24));

      // Create evidence of reintroduction
      const evidence = createEvidence({
        organizationId,
        fingerprint: finding.fingerprint,
        type: 'SCANNER_RESULT',
        sourceId: finding.id || `finding_${Date.now()}`,
        repositoryId,
        commitHash,
        confidence: 100,
        summary: `Secret fingerprint resurfaced in ${finding.file || 'repository'} after ${elapsedDays} days since previous remediation`,
        metadata: {
          previousStatus: historical.status,
          previousResolvedAt: historical.resolvedAt,
          reintroducedCommit: commitHash,
          reintroducedBranch: branch,
        },
      });
      newEvidences.push(evidence);

      // Create SECRET_REINTRODUCED security event
      const event = createSecurityEvent({
        organizationId,
        eventType: SECURITY_EVENT_TYPES.SECRET_REINTRODUCED,
        source,
        repositoryId,
        severity: finding.severity || 'HIGH',
        category: finding.ruleCategory || 'CREDENTIAL',
        relatedFindingIds: [finding.id].filter(Boolean),
        relatedFingerprints: [finding.fingerprint],
        evidenceIds: [evidence.evidenceId],
        metadata: {
          file: finding.file,
          line: finding.line,
          ruleId: finding.ruleId,
          daysSinceRemediation: elapsedDays,
          commitHash,
          branch,
        },
      });
      reintroducedEvents.push(event);
    }
  }

  return {
    reintroducedEvents,
    newEvidences,
  };
}
