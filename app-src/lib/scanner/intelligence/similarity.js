/**
 * lib/scanner/intelligence/similarity.js
 *
 * Similarity and Duplicate Secret Grouping.
 * Aggregates occurrences of the same credential across multiple files, commits, or repos
 * based on deterministic SHA-256 / djb2 fingerprints without exposing raw secrets.
 *
 * SECURITY:
 *   - Aggregation relies strictly on masked values and SHA-256 fingerprints.
 */

/**
 * Group an array of raw scan findings by secret fingerprint.
 *
 * @param {object[]} findings - list of individual findings
 * @returns {object[]} grouped findings where duplicates are collapsed into parent items with an occurrences array
 */
export function groupSimilarFindings(findings = []) {
  if (!Array.isArray(findings) || findings.length === 0) return [];

  const groups = new Map();

  for (const finding of findings) {
    const key = finding.fingerprint || `${finding.ruleId}_${finding.maskedValue}`;

    if (!groups.has(key)) {
      groups.set(key, {
        ...finding,
        occurrences: [
          {
            id: finding.id,
            file: finding.file,
            line: finding.line,
            column: finding.column,
            maskedValue: finding.maskedValue,
            commitHash: finding.commitHash || null,
            author: finding.author || null,
            lineTextMasked: finding.lineTextMasked || null,
          },
        ],
        occurrenceCount: 1,
      });
    } else {
      const parent = groups.get(key);
      parent.occurrences.push({
        id: finding.id,
        file: finding.file,
        line: finding.line,
        column: finding.column,
        maskedValue: finding.maskedValue,
        commitHash: finding.commitHash || null,
        author: finding.author || null,
        lineTextMasked: finding.lineTextMasked || null,
      });
      parent.occurrenceCount = parent.occurrences.length;

      // Retain the highest confidence / severity
      if (finding.confidence > parent.confidence) {
        parent.confidence = finding.confidence;
      }
    }
  }

  return Array.from(groups.values());
}

/**
 * Check if two findings represent the same underlying credential.
 *
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
export function areSimilarFindings(a = {}, b = {}) {
  if (a.fingerprint && b.fingerprint && a.fingerprint === b.fingerprint) {
    return true;
  }
  return (
    a.ruleId === b.ruleId &&
    a.maskedValue === b.maskedValue &&
    Boolean(a.maskedValue)
  );
}
