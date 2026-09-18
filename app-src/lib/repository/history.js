/**
 * lib/repository/history.js
 *
 * Safe scan history management.
 *
 * SECURITY PRINCIPLE: This module stores ONLY metadata — never raw file
 * content, never raw secret values. Masked values and fingerprints are
 * acceptable to store.
 *
 * Storage: In-memory for the session (Next.js API route memory).
 * The client-side localStorage stores the same safe metadata.
 */

// In-memory store for the server session (resets on server restart).
// The real persistence happens in the client via localStorage (safe metadata only).
const serverSideHistory = new Map();

/**
 * Record a completed repository scan.
 * Stores only safe metadata — no raw secrets, no raw file content.
 *
 * @param {object} scanResult - result from scanZipRepository
 * @returns {object} safe history record
 */
export function recordScan(scanResult) {
  const record = {
    scanId:        scanResult.scanId,
    status:        scanResult.status,
    timestamp:     scanResult.timestamp,
    duration:      scanResult.duration,
    repository: {
      name:        scanResult.repository?.name,
      archiveName: scanResult.repository?.archiveName,
      type:        scanResult.repository?.type,
    },
    statistics: {
      total:        scanResult.statistics?.total ?? 0,
      critical:     scanResult.statistics?.CRITICAL ?? 0,
      high:         scanResult.statistics?.HIGH ?? 0,
      medium:       scanResult.statistics?.MEDIUM ?? 0,
      low:          scanResult.statistics?.LOW ?? 0,
      filesScanned: scanResult.statistics?.filesScanned ?? 0,
      filesSkipped: scanResult.statistics?.filesSkipped ?? 0,
      riskScore:    scanResult.statistics?.riskScore ?? 0,
    },
    // Fingerprints of findings so the client can reference them
    findingFingerprints: (scanResult.findings || []).map(f => f.fingerprint).filter(Boolean),
  };

  serverSideHistory.set(record.scanId, record);
  return record;
}

/**
 * Get a scan record by ID (metadata only).
 * @param {string} scanId
 * @returns {object|null}
 */
export function getScanRecord(scanId) {
  return serverSideHistory.get(scanId) ?? null;
}

/**
 * List all scan records (metadata only).
 * @returns {object[]}
 */
export function listScanRecords() {
  return Array.from(serverSideHistory.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Architecture stub for future Git history scanning.
 *
 * @param {object} options
 * @param {'current'|'history'} options.mode
 */
export async function scanRepository(options = {}) {
  const { mode = 'current' } = options;

  if (mode === 'history') {
    // Future: scan git commit history for secrets
    throw new Error('Git history scanning is not yet implemented. Coming soon.');
  }

  // mode === 'current' is handled by repository-scanner.js
  throw new Error('Use scanZipRepository() for current file scanning.');
}
