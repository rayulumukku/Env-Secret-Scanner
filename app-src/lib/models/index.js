/**
 * lib/models/index.js
 *
 * Clean data models / interfaces for all SecretShield entities.
 * These are plain-JS value objects — no persistence logic here.
 * Designed so a PostgreSQL migration can be done with minimal changes.
 *
 * SECURITY: No model stores raw secret values.
 */

// ── REPOSITORY ────────────────────────────────────────────────────────────────

/**
 * @typedef {object} Repository
 * @property {string}  id               - Unique stable ID (e.g., "github_rayulumukku_myrepo")
 * @property {string}  provider         - "github" | "gitlab" | "local"
 * @property {string}  name             - short name
 * @property {string}  fullName         - "owner/repo" or filename
 * @property {boolean} isPrivate
 * @property {string}  defaultBranch
 * @property {string}  [htmlUrl]        - Web URL for the repo
 * @property {string}  [description]
 * @property {Date}    [lastScanned]
 * @property {object}  [lastScanStats]  - statistics from most recent scan
 */

export function createRepository(data) {
  return {
    id:            data.id           || `${data.provider}_${data.fullName?.replace(/\//g, '_')}`,
    provider:      data.provider     || 'local',
    name:          data.name         || data.fullName || 'Unknown',
    fullName:      data.fullName     || data.name,
    isPrivate:     data.isPrivate    ?? false,
    defaultBranch: data.defaultBranch || 'main',
    htmlUrl:       data.htmlUrl,
    description:   data.description,
    lastScanned:   data.lastScanned,
    lastScanStats: data.lastScanStats,
  };
}

// ── SCAN ──────────────────────────────────────────────────────────────────────

/**
 * @typedef {'current'|'history'|'full'} ScanMode
 *
 * @typedef {object} Scan
 * @property {string}   scanId
 * @property {string}   status         - "completed" | "failed" | "in_progress"
 * @property {ScanMode} mode
 * @property {string}   timestamp      - ISO string
 * @property {number}   duration       - ms
 * @property {object}   repository     - safe subset of Repository
 * @property {object}   statistics
 * @property {string}   [branch]       - branch that was scanned
 * @property {string}   [commitHash]   - HEAD commit hash at time of scan
 */

export function createScan(data) {
  return {
    scanId:     data.scanId     || `scan_${Date.now()}`,
    status:     data.status     || 'completed',
    mode:       data.mode       || 'current',
    timestamp:  data.timestamp  || new Date().toISOString(),
    duration:   data.duration   || 0,
    repository: data.repository || {},
    statistics: data.statistics || {},
    branch:     data.branch,
    commitHash: data.commitHash,
  };
}

// ── FINDING ───────────────────────────────────────────────────────────────────

/**
 * @typedef {object} Finding
 * @property {string}  id            - unique finding ID
 * @property {string}  fingerprint   - stable hash of type+masked_value
 * @property {string}  type          - rule type e.g. "AWS_ACCESS_KEY"
 * @property {string}  category      - "cloud" | "database" | "authentication" etc.
 * @property {string}  severity      - "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
 * @property {number}  confidence    - 0-100
 * @property {string}  file          - file path (relative)
 * @property {number}  line          - line number
 * @property {number}  [column]
 * @property {string}  maskedValue   - ██-masked value, never the raw secret
 * @property {string}  description   - human-readable description
 * @property {Array}   signals       - detection signal breakdown
 *
 * For historical findings:
 * @property {string}  [commitHash]
 * @property {string}  [shortHash]
 * @property {string}  [author]
 * @property {string}  [commitDate]
 * @property {string}  [commitMessage]
 * @property {FindingStatus} [status]
 * @property {string}  [exposureStatus] - "ACTIVE" | "REMOVED" | "ROTATED_UNKNOWN" | "ALLOWLISTED"
 */

export function createFinding(data) {
  return {
    id:          data.id          || `${data.fingerprint}_${Date.now()}`,
    fingerprint: data.fingerprint,
    type:        data.type,
    category:    data.category,
    severity:    data.severity    || 'LOW',
    confidence:  data.confidence  || 0,
    file:        data.file,
    line:        data.line,
    column:      data.column,
    maskedValue: data.maskedValue,  // NEVER the raw secret
    description: data.description,
    signals:     data.signals || [],
    // History context
    commitHash:     data.commitHash,
    shortHash:      data.shortHash,
    author:         data.author,
    commitDate:     data.commitDate,
    commitMessage:  data.commitMessage,
    status:         data.status         || FindingStatus.OPEN,
    exposureStatus: data.exposureStatus || ExposureStatus.ACTIVE,
  };
}

// ── FINDING STATUS ────────────────────────────────────────────────────────────

/**
 * User-assigned status for a finding.
 */
export const FindingStatus = Object.freeze({
  OPEN:          'OPEN',
  CONFIRMED:     'CONFIRMED',
  FALSE_POSITIVE:'FALSE_POSITIVE',
  IGNORED:       'IGNORED',
  REMEDIATED:    'REMEDIATED',
});

export const FINDING_STATUS_LABELS = {
  OPEN:           { label: 'Open',          color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  CONFIRMED:      { label: 'Confirmed',     color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
  FALSE_POSITIVE: { label: 'False Positive',color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  IGNORED:        { label: 'Ignored',       color: 'text-muted-foreground', bg: 'bg-secondary',  border: 'border-border' },
  REMEDIATED:     { label: 'Remediated',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

// ── EXPOSURE STATUS ───────────────────────────────────────────────────────────

/**
 * Lifecycle state of a secret across Git history.
 */
export const ExposureStatus = Object.freeze({
  ACTIVE:           'ACTIVE',
  REMOVED:          'REMOVED',
  ROTATED_UNKNOWN:  'ROTATED_UNKNOWN',
  ALLOWLISTED:      'ALLOWLISTED',
});

export const EXPOSURE_STATUS_LABELS = {
  ACTIVE:          { label: 'Active in code',       color: 'text-red-400' },
  REMOVED:         { label: 'Removed from current', color: 'text-yellow-400' },
  ROTATED_UNKNOWN: { label: 'Rotation status unknown', color: 'text-orange-400' },
  ALLOWLISTED:     { label: 'Allowlisted',           color: 'text-blue-400' },
};

// ── COMMIT ────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} Commit
 * @property {string}   hash
 * @property {string}   shortHash
 * @property {string}   message
 * @property {string}   author
 * @property {string}   authorEmail
 * @property {string}   date         - ISO string
 * @property {number}   addedLines
 * @property {number}   deletedLines
 * @property {string[]} filesChanged
 * @property {Finding[]} findings    - masked findings only
 */

export function createCommit(data) {
  return {
    hash:         data.hash,
    shortHash:    data.hash?.slice(0, 7),
    message:      data.message,
    author:       data.author,
    authorEmail:  data.authorEmail,
    date:         data.date,
    addedLines:   data.addedLines   || 0,
    deletedLines: data.deletedLines || 0,
    filesChanged: data.filesChanged || [],
    findings:     data.findings     || [],  // masked only
  };
}

// ── ALLOWLIST ENTRY ───────────────────────────────────────────────────────────

/**
 * @typedef {object} AllowlistEntry
 * @property {string}  fingerprint
 * @property {string}  reason
 * @property {string}  addedAt
 * @property {string}  [addedBy]
 */

export function createAllowlistEntry(fingerprint, reason) {
  return {
    fingerprint,
    reason:  reason || 'User allowlisted',
    addedAt: new Date().toISOString(),
  };
}

// ── PROVIDER ──────────────────────────────────────────────────────────────────

export const ProviderType = Object.freeze({
  GITHUB: 'github',
  GITLAB: 'gitlab',
  LOCAL:  'local',
});

// ── SCAN COMPARISON ───────────────────────────────────────────────────────────

/**
 * Compare two sets of findings by fingerprint.
 *
 * @param {Finding[]} previousFindings
 * @param {Finding[]} currentFindings
 * @returns {{ newFindings: Finding[], resolvedFindings: Finding[], persistentFindings: Finding[] }}
 */
export function compareFindings(previousFindings, currentFindings) {
  const prevByFp = new Map(previousFindings.map(f => [f.fingerprint, f]));
  const currByFp = new Map(currentFindings.map(f => [f.fingerprint, f]));

  const newFindings        = currentFindings.filter(f => !prevByFp.has(f.fingerprint));
  const resolvedFindings   = previousFindings.filter(f => !currByFp.has(f.fingerprint));
  const persistentFindings = currentFindings.filter(f => prevByFp.has(f.fingerprint));

  return { newFindings, resolvedFindings, persistentFindings };
}
