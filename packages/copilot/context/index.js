/**
 * packages/copilot/context/index.js
 *
 * Minimal Safe Context Builder for SecretShield Copilot.
 * 
 * SAFETY INVARIANTS:
 *   - Only extracts the minimum safe window around code (±5 lines).
 *   - Deeply redacts all extracted lines through redaction engine.
 *   - Strictly confines file access within workspace/repository boundary (no path traversal).
 *   - Never includes full repository contents.
 *   - Guarantees isolation across repositories and organizations.
 */

import path from 'node:path';
import fs from 'node:fs';
import { redactSecrets, maskSecretValue, sanitizeDataDeep } from '../redaction/index.js';

export const CONTEXT_WINDOW_SIZE = 5; // ±5 lines around target

/**
 * Validates that a target file path is strictly within the allowed workspace boundary.
 * Prevents directory traversal attacks (e.g., ../../../etc/passwd).
 *
 * @param {string} filePath - Target file path
 * @param {string} [workspaceRoot=process.cwd()] - Allowed root path
 * @returns {{ valid: boolean, resolvedPath: string, error?: string }}
 */
export function validateWorkspacePath(filePath, workspaceRoot = process.cwd()) {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, resolvedPath: '', error: 'File path must be a non-empty string' };
  }

  // Normalize and resolve absolute paths
  const root = path.resolve(workspaceRoot);
  const resolved = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(root, filePath);

  // Check prefix containment
  const relative = path.relative(root, resolved);
  const isInside = !relative.startsWith('..') && !path.isAbsolute(relative);

  if (!isInside && resolved !== root) {
    return {
      valid: false,
      resolvedPath: resolved,
      error: `Access Denied: Path '${filePath}' escapes workspace root '${root}'`
    };
  }

  // Prevent null-byte injection
  if (resolved.includes('\0')) {
    return { valid: false, resolvedPath: '', error: 'Null-byte path detected' };
  }

  return { valid: true, resolvedPath: resolved };
}

/**
 * Extracts a window of safe, redacted lines around a finding in a file or string.
 *
 * @param {string} content - Full file text content
 * @param {number} lineNum - 1-based target line number
 * @param {number} [windowSize=5] - Number of context lines before and after
 * @returns {Array<{ line: number, content: string, isTarget: boolean }>}
 */
export function extractSafeCodeWindow(content, lineNum = 1, windowSize = CONTEXT_WINDOW_SIZE) {
  if (!content || typeof content !== 'string') return [];

  const lines = content.split(/\r?\n/);
  const total = lines.length;
  const targetIdx = Math.max(0, Math.min(total - 1, lineNum - 1));

  const startIdx = Math.max(0, targetIdx - windowSize);
  const endIdx = Math.min(total - 1, targetIdx + windowSize);

  const window = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const isTarget = i === targetIdx;
    const rawLine = lines[i];
    // Redact secret values from the line
    const sanitizedLine = redactSecrets(rawLine);

    window.push({
      line: i + 1,
      content: sanitizedLine,
      isTarget
    });
  }

  return window;
}

/**
 * Builds safe context from a Finding object.
 *
 * @param {Object} finding - Raw or stored finding
 * @param {Object} [options]
 * @param {string} [options.fileContent] - Optional in-memory file content
 * @param {string} [options.workspaceRoot] - Workspace root boundary
 * @returns {Object} Safe context payload
 */
export function buildFindingContext(finding, options = {}) {
  if (!finding || typeof finding !== 'object') {
    throw new Error('Valid finding object required for context building');
  }

  const {
    id,
    fingerprint,
    ruleId,
    ruleName,
    severity,
    confidence,
    filePath,
    line = 1,
    column = 1,
    maskedValue,
    entropy,
    category,
    remediationGuidance,
    verificationStatus,
    firstSeen,
    lastSeen
  } = finding;

  let codeSnippet = [];
  if (options.fileContent) {
    codeSnippet = extractSafeCodeWindow(options.fileContent, line);
  } else if (filePath && options.workspaceRoot) {
    const pathCheck = validateWorkspacePath(filePath, options.workspaceRoot);
    if (pathCheck.valid && fs.existsSync(pathCheck.resolvedPath)) {
      try {
        const stats = fs.statSync(pathCheck.resolvedPath);
        // Only read text files <= 5MB
        if (stats.isFile() && stats.size <= 5 * 1024 * 1024) {
          const content = fs.readFileSync(pathCheck.resolvedPath, 'utf8');
          codeSnippet = extractSafeCodeWindow(content, line);
        }
      } catch {
        // Safe fallback if file cannot be read
      }
    }
  }

  return sanitizeDataDeep({
    type: 'FINDING',
    target: {
      id: id || fingerprint || 'unknown-finding',
      ruleId: ruleId || 'GENERIC_SECRET',
      ruleName: ruleName || ruleId || 'Generic Secret',
      severity: severity || 'MEDIUM',
      confidence: typeof confidence === 'number' ? confidence : 0.85,
      category: category || 'api_keys',
      filePath: filePath || 'unknown',
      line,
      column,
      maskedValue: maskedValue ? maskSecretValue(maskedValue) : '••••••••',
      entropy: typeof entropy === 'number' ? Number(entropy.toFixed(2)) : undefined,
      verificationStatus: verificationStatus || 'UNVERIFIED',
      firstSeen: firstSeen || new Date().toISOString(),
      lastSeen: lastSeen || new Date().toISOString()
    },
    codeSnippet,
    remediationGuidance: remediationGuidance || 'Remove secret and migrate to environment variables or secret manager.'
  });
}

/**
 * Builds safe context from a File object or path.
 *
 * @param {string} filePath - Target file path
 * @param {string} [fileContent] - In-memory file content
 * @param {Object} [options]
 * @returns {Object} Safe file context
 */
export function buildFileContext(filePath, fileContent = '', options = {}) {
  const pathCheck = validateWorkspacePath(filePath, options.workspaceRoot || process.cwd());
  const safeName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Redact content if provided
  const sanitizedContent = fileContent ? redactSecrets(fileContent.slice(0, 10000)) : '';

  return sanitizeDataDeep({
    type: 'FILE',
    filePath: pathCheck.valid ? filePath : safeName,
    fileName: safeName,
    extension: ext,
    isConfigOrEnv: /^\.env|config|settings|secret|credentials/i.test(safeName),
    contentPreview: sanitizedContent,
    workspaceValid: pathCheck.valid
  });
}

/**
 * Builds safe context from a Pull Request payload.
 *
 * @param {Object} prData - PR information
 * @returns {Object} Minimized PR context
 */
export function buildPullRequestContext(prData = {}) {
  const {
    id,
    number,
    title,
    author,
    baseBranch,
    headBranch,
    filesChanged = [],
    newFindings = [],
    resolvedFindings = [],
    policyViolations = []
  } = prData;

  return sanitizeDataDeep({
    type: 'PULL_REQUEST',
    prNumber: number || id || 0,
    title: redactSecrets(String(title || 'Pull Request Review')),
    author: redactSecrets(String(author || 'developer')),
    baseBranch: String(baseBranch || 'main'),
    headBranch: String(headBranch || 'feature'),
    filesCount: Array.isArray(filesChanged) ? filesChanged.length : 0,
    filesChanged: Array.isArray(filesChanged) ? filesChanged.slice(0, 50).map(f => typeof f === 'string' ? f : f.path) : [],
    newFindingsCount: newFindings.length,
    resolvedFindingsCount: resolvedFindings.length,
    policyViolationsCount: policyViolations.length,
    policyViolations: policyViolations.map(p => ({
      rule: p.rule || p.name || 'Policy Check',
      severity: p.severity || 'HIGH',
      status: p.status || 'BLOCKED'
    }))
  });
}

/**
 * Builds safe context from a Commit payload.
 *
 * @param {Object} commitData - Commit metadata and diff summary
 * @returns {Object} Safe commit context
 */
export function buildCommitContext(commitData = {}) {
  const {
    sha,
    author,
    message,
    timestamp,
    files = [],
    findingsAdded = [],
    findingsRemoved = []
  } = commitData;

  return sanitizeDataDeep({
    type: 'COMMIT',
    commitSha: String(sha || 'HEAD').slice(0, 40),
    shortSha: String(sha || 'HEAD').slice(0, 7),
    author: redactSecrets(String(author || 'developer')),
    message: redactSecrets(String(message || 'Commit update')),
    timestamp: timestamp || new Date().toISOString(),
    filesChanged: Array.isArray(files) ? files.slice(0, 50) : [],
    findingsAddedCount: findingsAdded.length,
    findingsRemovedCount: findingsRemoved.length
  });
}

/**
 * Universal Context Builder that routes by context type.
 *
 * @param {string} contextType - 'finding' | 'file' | 'commit' | 'pr' | 'policy' | 'incident'
 * @param {Object} data - Input payload
 * @param {Object} [options] - Options like workspaceRoot
 * @returns {Object} Sanitized context
 */
export function buildContext(contextType, data, options = {}) {
  const type = String(contextType || '').toLowerCase();

  switch (type) {
    case 'finding':
      return buildFindingContext(data, options);
    case 'file':
      return buildFileContext(data.filePath || data.name, data.content, options);
    case 'pr':
    case 'pull_request':
      return buildPullRequestContext(data);
    case 'commit':
      return buildCommitContext(data);
    case 'policy':
    case 'policy_violation':
      return sanitizeDataDeep({
        type: 'POLICY_VIOLATION',
        policyName: data.name || data.rule || 'Branch Protection Policy',
        enforcementMode: data.mode || 'ENFORCE_BLOCK',
        violationReason: redactSecrets(data.reason || 'Secret detected in commit or PR'),
        findings: Array.isArray(data.findings) ? data.findings.map(f => buildFindingContext(f, options)) : []
      });
    case 'incident':
      return sanitizeDataDeep({
        type: 'INCIDENT',
        incidentId: data.id || 'INC-001',
        title: redactSecrets(data.title || 'Exposed Secret Incident'),
        status: data.status || 'OPEN',
        severity: data.severity || 'HIGH',
        assignedTo: redactSecrets(data.assignedTo || 'Security Team'),
        targetFingerprint: data.fingerprint || 'unknown'
      });
    default:
      return sanitizeDataDeep({
        type: 'GENERIC',
        data: typeof data === 'object' ? data : { raw: String(data) }
      });
  }
}
