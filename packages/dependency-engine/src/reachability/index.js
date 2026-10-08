/**
 * packages/dependency-engine/src/reachability/index.js
 *
 * Conservative Reachability Intelligence Engine.
 * Evaluates whether a dependency is declared, installed, imported, or referenced.
 *
 * SECURITY INVARIANTS:
 * - NEVER claims runtime exploitation or execution vulnerability without authoritative proof.
 * - Always uses factual wording: "Dependency is installed and referenced." NOT "Application is exploitable."
 */

export const REACHABILITY_STATUS = {
  DECLARED: 'DECLARED',
  INSTALLED: 'INSTALLED',
  IMPORTED: 'IMPORTED',
  REFERENCED: 'REFERENCED',
  POTENTIALLY_REACHABLE: 'POTENTIALLY_REACHABLE',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Regex patterns across ecosystems to detect direct imports in source code.
 */
const IMPORT_PATTERNS = [
  // JS/TS: require('pkg') or require("pkg/sub")
  /require\s*\(\s*['"]([@a-zA-Z0-9_.-]+)(?:\/[^'"]*)?['"]\s*\)/g,
  // JS/TS: import ... from 'pkg' or import 'pkg'
  /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([@a-zA-Z0-9_.-]+)(?:\/[^'"]*)?['"]/g,
  // Python: import pkg or from pkg import ...
  /(?:^|\n)\s*(?:from\s+([a-zA-Z0-9_]+)|import\s+([a-zA-Z0-9_]+))/g,
  // Go: "github.com/org/repo"
  /import\s+(?:\(\s*)?['"]([^'"]+)['"]/g,
  // Rust: use pkg::...
  /use\s+([a-zA-Z0-9_]+)::/g,
  // PHP: use Vendor\Package\...
  /use\s+([a-zA-Z0-9_\\]+);/g,
];

/**
 * Scans a collection of source code files to discover which packages are imported.
 *
 * @param {Array<{ path: string, content: string }>} sourceFiles
 * @returns {Map<string, Array<{ file: string, line: number, statement: string }>>}
 */
export function extractImportedPackagesFromSources(sourceFiles = []) {
  const packageReferences = new Map();

  for (const file of sourceFiles) {
    if (!file || !file.content || typeof file.content !== 'string') continue;

    const lines = file.content.split(/\r?\n/);
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      for (const pattern of IMPORT_PATTERNS) {
        // Reset lastIndex for regexes with global flag
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const pkgName = (match[1] || match[2] || '').trim();
          if (!pkgName || pkgName.startsWith('.') || pkgName.startsWith('/')) continue;

          if (!packageReferences.has(pkgName)) {
            packageReferences.set(pkgName, []);
          }
          packageReferences.get(pkgName).push({
            file: file.path,
            line: lineIdx + 1,
            statement: line.trim()
          });
        }
      }
    }
  }

  return packageReferences;
}

/**
 * Assesses the reachability status of a single dependency node.
 *
 * @param {object} dependency - Graph dependency node
 * @param {Map<string, Array<object>>} importedPackages - Map of imported package references
 * @returns {{ status: string, summary: string, evidence: object }}
 */
export function assessReachability(dependency, importedPackages = new Map()) {
  const pkgName = dependency.name;
  const isInstalled = Boolean(dependency.lockfilePath || dependency.integrity);
  const references = importedPackages.get(pkgName) || [];

  if (references.length > 0) {
    const primaryRef = references[0];
    const summary = `Dependency is installed and referenced in ${primaryRef.file}:${primaryRef.line}.`;
    return {
      status: REACHABILITY_STATUS.POTENTIALLY_REACHABLE,
      summary,
      evidence: {
        isInstalled,
        referencesCount: references.length,
        firstReference: primaryRef,
        allReferences: references.slice(0, 5)
      }
    };
  }

  if (isInstalled) {
    return {
      status: REACHABILITY_STATUS.INSTALLED,
      summary: 'Dependency is installed in lockfile but not directly imported in application source files.',
      evidence: {
        isInstalled: true,
        lockfilePath: dependency.lockfilePath,
        referencesCount: 0
      }
    };
  }

  if (dependency.isDirect) {
    return {
      status: REACHABILITY_STATUS.DECLARED,
      summary: 'Dependency is declared in manifest but no installed lockfile or source import was confirmed.',
      evidence: {
        isDeclared: true,
        manifestPath: dependency.manifestPath
      }
    };
  }

  return {
    status: REACHABILITY_STATUS.UNKNOWN,
    summary: 'Reachability status cannot be established from available evidence.',
    evidence: {}
  };
}
