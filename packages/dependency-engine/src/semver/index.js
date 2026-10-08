/**
 * packages/dependency-engine/src/semver/index.js
 *
 * Deterministic Semantic Version & Range Matching Engine.
 * Supports semver parsing, range resolution, pre-release ordering,
 * and vulnerability window calculations without external runtime dependencies.
 *
 * SECURITY INVARIANTS:
 * - Pure bounded parsing; regex operations avoid ReDoS vulnerabilities.
 * - Handles non-standard version inputs safely without throwing fatal exceptions.
 */

const SEMVER_REGEX = /^[vV]?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

/**
 * Parses a semver string into its constituent parts.
 * @param {string} raw
 * @returns {{ major: number, minor: number, patch: number, prerelease: string|null, build: string|null, raw: string }|null}
 */
export function parseVersion(raw) {
  if (typeof raw !== 'string') return null;
  const clean = raw.trim();
  const match = SEMVER_REGEX.exec(clean);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: match[2] !== undefined ? parseInt(match[2], 10) : 0,
    patch: match[3] !== undefined ? parseInt(match[3], 10) : 0,
    prerelease: match[4] || null,
    build: match[5] || null,
    raw: clean,
  };
}

/**
 * Compares two parsed or string versions.
 * Returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2.
 * @param {string|object} v1
 * @param {string|object} v2
 * @returns {number}
 */
export function compareVersions(v1, v2) {
  const p1 = typeof v1 === 'string' ? parseVersion(v1) : v1;
  const p2 = typeof v2 === 'string' ? parseVersion(v2) : v2;

  if (!p1 && !p2) return 0;
  if (!p1) return -1;
  if (!p2) return 1;

  if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
  if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
  if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;

  // Prerelease comparison:
  // A version without a prerelease has higher precedence than one with a prerelease.
  if (!p1.prerelease && p2.prerelease) return 1;
  if (p1.prerelease && !p2.prerelease) return -1;
  if (!p1.prerelease && !p2.prerelease) return 0;

  // Both have prereleases: compare identifier by identifier
  const parts1 = p1.prerelease.split('.');
  const parts2 = p2.prerelease.split('.');
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const id1 = parts1[i];
    const id2 = parts2[i];
    if (id1 === undefined) return -1;
    if (id2 === undefined) return 1;
    if (id1 === id2) continue;

    const num1 = parseInt(id1, 10);
    const num2 = parseInt(id2, 10);
    const isNum1 = !isNaN(num1) && String(num1) === id1;
    const isNum2 = !isNaN(num2) && String(num2) === id2;

    if (isNum1 && isNum2) {
      return num1 > num2 ? 1 : -1;
    }
    if (isNum1 && !isNum2) return -1;
    if (!isNum1 && isNum2) return 1;
    return id1.localeCompare(id2);
  }

  return 0;
}

/**
 * Normalizes and decomposes a simple comparator (e.g. ">=1.2.3", "^2.0.0", "<4.0.0").
 * @param {string} comp
 * @returns {Array<{ op: string, ver: string }>}
 */
function expandSimpleComparator(comp) {
  const trimmed = comp.trim();
  if (!trimmed || trimmed === '*' || trimmed === 'x' || trimmed === 'X') {
    return [{ op: '>=', ver: '0.0.0' }];
  }

  // Caret range ^1.2.3
  if (trimmed.startsWith('^')) {
    const verStr = trimmed.slice(1).trim();
    const parsed = parseVersion(verStr);
    if (!parsed) return [];
    if (parsed.major > 0) {
      return [
        { op: '>=', ver: verStr },
        { op: '<', ver: `${parsed.major + 1}.0.0` },
      ];
    }
    if (parsed.minor > 0) {
      return [
        { op: '>=', ver: verStr },
        { op: '<', ver: `0.${parsed.minor + 1}.0` },
      ];
    }
    return [
      { op: '>=', ver: verStr },
      { op: '<', ver: `0.0.${parsed.patch + 1}` },
    ];
  }

  // Tilde range ~1.2.3
  if (trimmed.startsWith('~')) {
    const verStr = trimmed.slice(1).trim();
    const parsed = parseVersion(verStr);
    if (!parsed) return [];
    return [
      { op: '>=', ver: verStr },
      { op: '<', ver: `${parsed.major}.${parsed.minor + 1}.0` },
    ];
  }

  // Explicit operator: >=, <=, >, <, =, ==
  const opMatch = /^(>=|<=|>|<|==|=)\s*(.+)$/.exec(trimmed);
  if (opMatch) {
    const op = opMatch[1] === '==' ? '=' : opMatch[1];
    return [{ op, ver: opMatch[2].trim() }];
  }

  // Pinned or wildcards like 1.x
  if (trimmed.includes('.*') || trimmed.toLowerCase().includes('.x')) {
    const base = trimmed.replace(/\.[*xX].*$/, '');
    const parts = base.split('.');
    if (parts.length === 1) {
      const maj = parseInt(parts[0], 10);
      if (!isNaN(maj)) {
        return [
          { op: '>=', ver: `${maj}.0.0` },
          { op: '<', ver: `${maj + 1}.0.0` },
        ];
      }
    } else if (parts.length === 2) {
      const maj = parseInt(parts[0], 10);
      const min = parseInt(parts[1], 10);
      if (!isNaN(maj) && !isNaN(min)) {
        return [
          { op: '>=', ver: `${maj}.${min}.0` },
          { op: '<', ver: `${maj}.${min + 1}.0` },
        ];
      }
    }
  }

  // Default: exact match
  return [{ op: '=', ver: trimmed }];
}

/**
 * Checks if a parsed version satisfies a single comparator clause ({ op, ver }).
 * @param {object} parsed
 * @param {string} op
 * @param {string} targetVer
 * @returns {boolean}
 */
function testComparator(parsed, op, targetVer) {
  const targetParsed = parseVersion(targetVer);
  if (!targetParsed) return false;

  const cmp = compareVersions(parsed, targetParsed);
  switch (op) {
    case '=':
    case '==':
      return cmp === 0;
    case '>':
      return cmp > 0;
    case '>=':
      return cmp >= 0;
    case '<':
      return cmp < 0;
    case '<=':
      return cmp <= 0;
    default:
      return false;
  }
}

/**
 * Determines whether a version string satisfies a complex semver range expression.
 * Handles logical OR ('||'), whitespace-delimited ANDs, and hyphen ranges.
 *
 * @param {string} versionStr - Installed or candidate version (e.g. "1.2.4")
 * @param {string} rangeStr - Semver range (e.g. ">=1.0.0 <1.5.0 || ^2.0.0")
 * @returns {boolean}
 */
export function satisfiesRange(versionStr, rangeStr) {
  if (!versionStr || !rangeStr) return false;
  const parsed = parseVersion(versionStr);
  if (!parsed) return false;

  const trimmedRange = String(rangeStr).trim();
  if (trimmedRange === '*' || trimmedRange === 'all') return true;

  // Logical OR split
  const orClauses = trimmedRange.split(/\s*\|\|\s*/);

  return orClauses.some(clause => {
    // Check hyphen range: e.g. "1.0.0 - 2.0.0"
    const hyphenMatch = /^([0-9A-Za-z.-]+)\s+-\s+([0-9A-Za-z.-]+)$/.exec(clause.trim());
    if (hyphenMatch) {
      const lowOk = testComparator(parsed, '>=', hyphenMatch[1]);
      const highOk = testComparator(parsed, '<=', hyphenMatch[2]);
      return lowOk && highOk;
    }

    // Space-separated or comma-separated conjunctions (AND)
    // E.g. ">=1.0.0 <2.0.0" or ">=1.0.0, <2.0.0"
    const tokens = clause.trim().split(/[\s,]+/).filter(Boolean);
    const comparators = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Handle cases where operator and version are split into two tokens: e.g. [">=", "1.2.3"]
      if (/^(>=|<=|>|<|=|==)$/.test(token) && i + 1 < tokens.length) {
        comparators.push(...expandSimpleComparator(`${token}${tokens[i + 1]}`));
        i++;
      } else {
        comparators.push(...expandSimpleComparator(token));
      }
    }

    if (comparators.length === 0) return false;
    return comparators.every(c => testComparator(parsed, c.op, c.ver));
  });
}

/**
 * Assesses whether an installed version falls within an advisory's affected version range.
 *
 * @param {string} installedVersion
 * @param {string} affectedRange
 * @returns {boolean}
 */
export function isVersionVulnerable(installedVersion, affectedRange) {
  if (!installedVersion || !affectedRange) return false;
  return satisfiesRange(installedVersion, affectedRange);
}

/**
 * Finds the earliest non-vulnerable fixed version from a list of fixed versions
 * that is greater than or equal to the current installed version.
 *
 * @param {string} installedVersion
 * @param {string[]|string} fixedVersions
 * @returns {string|null} Recommended version or null if not resolved
 */
export function findRecommendedFixedVersion(installedVersion, fixedVersions) {
  if (!fixedVersions) return null;
  const list = Array.isArray(fixedVersions)
    ? fixedVersions
    : String(fixedVersions).split(',').map(s => s.trim()).filter(Boolean);

  if (list.length === 0) return null;
  const parsedInstalled = parseVersion(installedVersion);
  if (!parsedInstalled) return list[0];

  // Sort candidate fixed versions ascending
  const sorted = list
    .map(v => ({ raw: v, parsed: parseVersion(v) }))
    .filter(item => item.parsed !== null)
    .sort((a, b) => compareVersions(a.parsed, b.parsed));

  // Find the closest fixed version >= installed
  const candidate = sorted.find(item => compareVersions(item.parsed, parsedInstalled) > 0);
  return candidate ? candidate.raw : sorted[sorted.length - 1].raw;
}
