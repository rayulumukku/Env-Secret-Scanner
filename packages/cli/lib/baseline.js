/**
 * lib/baseline.js
 *
 * Baseline management.
 *
 * A baseline contains fingerprints of accepted/known findings.
 * New findings not in the baseline will fail CI.
 * Existing findings in the baseline will not fail CI.
 *
 * Security:
 *   - Baseline stores ONLY fingerprints (SHA-256 hashes), never raw secrets
 *   - Maximum baseline size enforced (10,000 entries) to prevent DoS
 *   - Fingerprints validated as hex strings before use
 *   - File is JSON — no code execution risk
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DEFAULT_BASELINE_FILE = '.secretshield-baseline.json';
const MAX_BASELINE_ENTRIES  = 10_000;

// Fingerprint is a hex string (SHA-256 or similar hash)
const FINGERPRINT_PATTERN = /^[a-f0-9]{8,128}$/i;

// ── TYPES ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} BaselineEntry
 * @property {string}   fingerprint
 * @property {string}   [type]         - finding type for human readability
 * @property {string}   [severity]
 * @property {string}   [file]         - file where this was found
 * @property {string}   [addedAt]      - ISO timestamp
 * @property {string}   [note]         - optional human note
 */

// ── LOAD ──────────────────────────────────────────────────────────────────────

/**
 * Load a baseline file from disk.
 *
 * @param {string} [baselinePath]
 * @returns {{ entries: BaselineEntry[], fingerprints: Set<string>, source: string }}
 */
export function loadBaseline(baselinePath) {
  const filePath = baselinePath
    ? resolve(baselinePath)
    : resolve(process.cwd(), DEFAULT_BASELINE_FILE);

  if (!existsSync(filePath)) {
    return { entries: [], fingerprints: new Set(), source: null };
  }

  let raw;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read baseline file ${filePath}: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Baseline file ${filePath} is not valid JSON.`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Baseline file ${filePath} has invalid structure.`);
  }

  const entries = validateBaselineEntries(parsed.entries || []);

  return {
    entries,
    fingerprints: new Set(entries.map(e => e.fingerprint)),
    source: filePath,
  };
}

/**
 * Save entries to baseline file.
 *
 * @param {string}          filePath
 * @param {BaselineEntry[]} entries
 */
export function saveBaseline(filePath, entries) {
  const validated = validateBaselineEntries(entries);

  if (validated.length > MAX_BASELINE_ENTRIES) {
    throw new Error(
      `Baseline exceeds maximum size (${MAX_BASELINE_ENTRIES} entries). ` +
      `Remove unused entries with: secretshield baseline remove <fingerprint>`
    );
  }

  const data = {
    version:     '2.0',
    tool:        'SecretShield',
    created:     new Date().toISOString(),
    count:       validated.length,
    entries:     validated,
    _note:       'This file contains fingerprints only — no raw secrets.',
  };

  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ── OPERATIONS ────────────────────────────────────────────────────────────────

/**
 * Create a baseline from scan findings.
 *
 * @param {object[]} findings
 * @param {string}   [note]
 * @returns {BaselineEntry[]}
 */
export function createBaselineFromFindings(findings, note = '') {
  const seen = new Set();
  const entries = [];

  for (const finding of findings) {
    if (!finding.fingerprint || !FINGERPRINT_PATTERN.test(finding.fingerprint)) continue;
    if (seen.has(finding.fingerprint)) continue;
    seen.add(finding.fingerprint);

    entries.push({
      fingerprint: finding.fingerprint,
      type:        finding.type        || 'UNKNOWN',
      severity:    finding.severity    || 'UNKNOWN',
      file:        finding.file        || 'unknown',
      addedAt:     new Date().toISOString(),
      note:        note || 'Added by secretshield baseline create',
    });
  }

  return entries;
}

/**
 * Filter findings against a baseline.
 * Returns only findings NOT in the baseline.
 *
 * @param {object[]}       findings
 * @param {Set<string>}    baselineFingerprints
 * @returns {{ active: object[], suppressed: number }}
 */
export function filterAgainstBaseline(findings, baselineFingerprints) {
  if (!baselineFingerprints || baselineFingerprints.size === 0) {
    return { active: findings, suppressed: 0 };
  }

  const active    = [];
  let suppressed  = 0;

  for (const finding of findings) {
    if (finding.fingerprint && baselineFingerprints.has(finding.fingerprint)) {
      suppressed++;
    } else {
      active.push(finding);
    }
  }

  return { active, suppressed };
}

/**
 * Remove a fingerprint from an existing baseline.
 *
 * @param {string}          filePath
 * @param {string}          fingerprint
 * @returns {boolean} true if removed, false if not found
 */
export function removeFingerprint(filePath, fingerprint) {
  if (!FINGERPRINT_PATTERN.test(fingerprint)) {
    throw new Error(`Invalid fingerprint format: "${fingerprint}"`);
  }

  const { entries } = loadBaseline(filePath);
  const before = entries.length;
  const filtered = entries.filter(e => e.fingerprint !== fingerprint);

  if (filtered.length === before) return false;

  saveBaseline(filePath, filtered);
  return true;
}

// ── VALIDATION ────────────────────────────────────────────────────────────────

function validateBaselineEntries(raw) {
  if (!Array.isArray(raw)) return [];

  const entries = [];
  const seen    = new Set();

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    if (!entry.fingerprint || typeof entry.fingerprint !== 'string') continue;
    if (!FINGERPRINT_PATTERN.test(entry.fingerprint)) continue;
    if (seen.has(entry.fingerprint)) continue;
    seen.add(entry.fingerprint);

    entries.push({
      fingerprint: entry.fingerprint,
      type:        typeof entry.type     === 'string' ? entry.type.slice(0, 100)     : 'UNKNOWN',
      severity:    typeof entry.severity === 'string' ? entry.severity.slice(0, 20)  : 'UNKNOWN',
      file:        typeof entry.file     === 'string' ? entry.file.slice(0, 500)     : 'unknown',
      addedAt:     typeof entry.addedAt  === 'string' ? entry.addedAt                : new Date().toISOString(),
      note:        typeof entry.note     === 'string' ? entry.note.slice(0, 500)     : '',
    });

    if (entries.length >= MAX_BASELINE_ENTRIES) break;
  }

  return entries;
}
