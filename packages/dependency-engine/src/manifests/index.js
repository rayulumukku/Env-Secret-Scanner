/**
 * packages/dependency-engine/src/manifests/index.js
 *
 * Deterministic Manifest & Lockfile Parser for All Supported Ecosystems.
 * Parses project manifests and lockfiles without executing external package managers.
 *
 * SECURITY INVARIANTS:
 * - NO external script or binary execution (no npm, pip, go, cargo, mvn execution).
 * - Max file size limits enforced (rejects oversized files to prevent DoS/memory exhaustion).
 * - Safe regex and streaming-style line parsing prevents ReDoS and parser-differential attacks.
 * - XML parsing for pom.xml strips all DOCTYPE and external entity definitions (XXE prevention).
 */

export const MAX_MANIFEST_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_LOCKFILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const SUPPORTED_MANIFEST_FILES = [
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'requirements.txt',
  'poetry.lock',
  'Pipfile',
  'Pipfile.lock',
  'go.mod',
  'go.sum',
  'Cargo.toml',
  'Cargo.lock',
  'Gemfile',
  'Gemfile.lock',
  'composer.json',
  'composer.lock',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts'
];

export const ECOSYSTEMS = {
  NPM: 'npm',
  PYPI: 'pypi',
  GOLANG: 'golang',
  CARGO: 'cargo',
  RUBYGEMS: 'rubygems',
  PACKAGIST: 'packagist',
  MAVEN: 'maven',
};

/**
 * Identifies the ecosystem and role (manifest vs lockfile) for a filename.
 * @param {string} fileName
 * @returns {{ ecosystem: string, isLockfile: boolean, fileType: string }|null}
 */
export function identifyManifestType(fileName) {
  const base = fileName.split(/[/\\]/).pop();
  switch (base) {
    case 'package.json':
      return { ecosystem: ECOSYSTEMS.NPM, isLockfile: false, fileType: 'package.json' };
    case 'package-lock.json':
      return { ecosystem: ECOSYSTEMS.NPM, isLockfile: true, fileType: 'package-lock.json' };
    case 'npm-shrinkwrap.json':
      return { ecosystem: ECOSYSTEMS.NPM, isLockfile: true, fileType: 'npm-shrinkwrap.json' };
    case 'yarn.lock':
      return { ecosystem: ECOSYSTEMS.NPM, isLockfile: true, fileType: 'yarn.lock' };
    case 'pnpm-lock.yaml':
      return { ecosystem: ECOSYSTEMS.NPM, isLockfile: true, fileType: 'pnpm-lock.yaml' };
    case 'requirements.txt':
      return { ecosystem: ECOSYSTEMS.PYPI, isLockfile: false, fileType: 'requirements.txt' };
    case 'poetry.lock':
      return { ecosystem: ECOSYSTEMS.PYPI, isLockfile: true, fileType: 'poetry.lock' };
    case 'Pipfile':
      return { ecosystem: ECOSYSTEMS.PYPI, isLockfile: false, fileType: 'Pipfile' };
    case 'Pipfile.lock':
      return { ecosystem: ECOSYSTEMS.PYPI, isLockfile: true, fileType: 'Pipfile.lock' };
    case 'go.mod':
      return { ecosystem: ECOSYSTEMS.GOLANG, isLockfile: false, fileType: 'go.mod' };
    case 'go.sum':
      return { ecosystem: ECOSYSTEMS.GOLANG, isLockfile: true, fileType: 'go.sum' };
    case 'Cargo.toml':
      return { ecosystem: ECOSYSTEMS.CARGO, isLockfile: false, fileType: 'Cargo.toml' };
    case 'Cargo.lock':
      return { ecosystem: ECOSYSTEMS.CARGO, isLockfile: true, fileType: 'Cargo.lock' };
    case 'Gemfile':
      return { ecosystem: ECOSYSTEMS.RUBYGEMS, isLockfile: false, fileType: 'Gemfile' };
    case 'Gemfile.lock':
      return { ecosystem: ECOSYSTEMS.RUBYGEMS, isLockfile: true, fileType: 'Gemfile.lock' };
    case 'composer.json':
      return { ecosystem: ECOSYSTEMS.PACKAGIST, isLockfile: false, fileType: 'composer.json' };
    case 'composer.lock':
      return { ecosystem: ECOSYSTEMS.PACKAGIST, isLockfile: true, fileType: 'composer.lock' };
    case 'pom.xml':
      return { ecosystem: ECOSYSTEMS.MAVEN, isLockfile: false, fileType: 'pom.xml' };
    case 'build.gradle':
    case 'build.gradle.kts':
      return { ecosystem: ECOSYSTEMS.MAVEN, isLockfile: false, fileType: base };
    default:
      return null;
  }
}

/**
 * Validates manifest content against size boundaries.
 * @param {string} content
 * @param {boolean} isLockfile
 */
function assertFileSizeSafe(content, isLockfile) {
  const byteLength = Buffer.byteLength(content || '', 'utf8');
  const limit = isLockfile ? MAX_LOCKFILE_SIZE_BYTES : MAX_MANIFEST_SIZE_BYTES;
  if (byteLength > limit) {
    throw new Error(`Manifest content exceeds safe size limit (${byteLength} > ${limit} bytes)`);
  }
}

// ── 1. NPM / NODE.JS PARSERS ──────────────────────────────────────────────────

/**
 * Parses package.json content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parsePackageJson(content, filePath = 'package.json') {
  assertFileSizeSafe(content, false);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Malformed package.json syntax: ${err.message}`);
  }

  const results = [];
  const addDeps = (obj, depType, isDev = false) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [name, version] of Object.entries(obj)) {
      if (typeof version !== 'string') continue;
      results.push({
        name,
        version: version.replace(/^[\^~>=<]+/, '').trim(),
        versionConstraint: version,
        ecosystem: ECOSYSTEMS.NPM,
        isDirect: true,
        isDev,
        dependencyType: depType,
        dependencyPath: [name],
        manifestPath: filePath,
        depth: 1,
      });
    }
  };

  addDeps(parsed.dependencies, 'production', false);
  addDeps(parsed.devDependencies, 'development', true);
  addDeps(parsed.peerDependencies, 'peer', false);
  addDeps(parsed.optionalDependencies, 'optional', false);

  return results;
}

/**
 * Parses package-lock.json (supports v1, v2, and v3 schemas).
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parsePackageLockJson(content, filePath = 'package-lock.json') {
  assertFileSizeSafe(content, true);
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Malformed package-lock.json syntax: ${err.message}`);
  }

  const results = [];
  const directSet = new Set();

  // In v2/v3, root packages[""] lists direct dependencies
  if (parsed.packages && parsed.packages['']) {
    const rootPkg = parsed.packages[''];
    if (rootPkg.dependencies) Object.keys(rootPkg.dependencies).forEach(k => directSet.add(k));
    if (rootPkg.devDependencies) Object.keys(rootPkg.devDependencies).forEach(k => directSet.add(k));
  } else if (parsed.dependencies) {
    // In v1, top-level keys in dependencies are direct
    Object.keys(parsed.dependencies).forEach(k => directSet.add(k));
  }

  // Parse modern v2 / v3 packages map
  if (parsed.packages && typeof parsed.packages === 'object') {
    for (const [pkgPath, pkgInfo] of Object.entries(parsed.packages)) {
      if (!pkgPath || pkgPath === '' || typeof pkgInfo !== 'object') continue;
      
      // Path format: "node_modules/foo/node_modules/bar"
      const segments = pkgPath.split('node_modules/').filter(Boolean).map(s => s.replace(/\/$/, ''));
      const name = segments[segments.length - 1];
      const version = pkgInfo.version || '0.0.0';
      const isDirect = segments.length === 1 && directSet.has(name);

      results.push({
        name,
        version,
        versionConstraint: version,
        ecosystem: ECOSYSTEMS.NPM,
        isDirect,
        isDev: Boolean(pkgInfo.dev),
        dependencyPath: segments,
        lockfilePath: filePath,
        integrity: pkgInfo.integrity || null,
        depth: segments.length,
      });
    }
    return results;
  }

  // Fallback to legacy v1 dependencies tree
  function walkV1(deps, parentPath = []) {
    if (!deps || typeof deps !== 'object') return;
    for (const [name, info] of Object.entries(deps)) {
      if (!info || typeof info !== 'object') continue;
      const currentPath = [...parentPath, name];
      const isDirect = parentPath.length === 0;

      results.push({
        name,
        version: info.version || '0.0.0',
        versionConstraint: info.version || '0.0.0',
        ecosystem: ECOSYSTEMS.NPM,
        isDirect,
        isDev: Boolean(info.dev),
        dependencyPath: currentPath,
        lockfilePath: filePath,
        integrity: info.integrity || null,
        depth: currentPath.length,
      });

      if (info.dependencies) {
        walkV1(info.dependencies, currentPath);
      }
    }
  }

  if (parsed.dependencies) {
    walkV1(parsed.dependencies);
  }

  return results;
}

/**
 * Parses yarn.lock (v1 and berry format).
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parseYarnLock(content, filePath = 'yarn.lock') {
  assertFileSizeSafe(content, true);
  const results = [];
  const lines = content.split(/\r?\n/);
  let currentHeader = null;
  let currentVersion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#')) continue;

    // Package entry header: e.g. "lodash@^4.17.21, lodash@~4.17.20:" or "@babel/core@^7.0.0:"
    if (!line.startsWith(' ') && line.includes('@') && line.trim().endsWith(':')) {
      currentHeader = line.trim().replace(/:$/, '');
      currentVersion = null;
      continue;
    }

    if (line.startsWith('  version ') || line.startsWith('  "version" ')) {
      const match = /version\s*["']?([^"'\s]+)["']?/.exec(line);
      if (match) {
        currentVersion = match[1];
        if (currentHeader && currentVersion) {
          // Parse package name from first specifier
          const firstSpec = currentHeader.split(',')[0].trim().replace(/^["']|["']$/g, '');
          const atIdx = firstSpec.lastIndexOf('@');
          const name = atIdx > 0 ? firstSpec.slice(0, atIdx) : firstSpec;

          results.push({
            name,
            version: currentVersion,
            versionConstraint: atIdx > 0 ? firstSpec.slice(atIdx + 1) : currentVersion,
            ecosystem: ECOSYSTEMS.NPM,
            isDirect: false, // will correlate with package.json if present
            dependencyPath: [name],
            lockfilePath: filePath,
            depth: 1,
          });
          currentHeader = null;
        }
      }
    }
  }

  return results;
}

/**
 * Parses pnpm-lock.yaml deterministically without executing unsafe YAML parsers.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parsePnpmLock(content, filePath = 'pnpm-lock.yaml') {
  assertFileSizeSafe(content, true);
  const results = [];
  const lines = content.split(/\r?\n/);
  let inPackages = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('packages:') || line.startsWith('snapshots:')) {
      inPackages = true;
      continue;
    }
    if (inPackages && line.length > 0 && !line.startsWith('  ')) {
      inPackages = false;
      continue;
    }

    if (inPackages && line.startsWith('  /')) {
      // e.g. "  /lodash@4.17.21:" or "  /@babel/core@7.20.0:"
      const entry = line.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '').replace(/:$/, '').replace(/^\//, '');
      const atIdx = entry.lastIndexOf('@');
      if (atIdx > 0) {
        const name = entry.slice(0, atIdx);
        const version = entry.slice(atIdx + 1).split('(')[0]; // strip peer dependencies suffix

        results.push({
          name,
          version,
          versionConstraint: version,
          ecosystem: ECOSYSTEMS.NPM,
          isDirect: false,
          dependencyPath: [name],
          lockfilePath: filePath,
          depth: 1,
        });
      }
    }
  }

  return results;
}

// ── 2. PYTHON PARSERS ─────────────────────────────────────────────────────────

/**
 * Parses requirements.txt content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parseRequirementsTxt(content, filePath = 'requirements.txt') {
  assertFileSizeSafe(content, false);
  const results = [];
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('-r') || line.startsWith('-i')) continue;

    // Pattern: package==1.2.3 or package>=1.0.0 or package~=1.4.0
    const match = /^([a-zA-Z0-9_.-]+)\s*([=><~~!]=?|[=><])\s*([0-9A-Za-z_.-]+)/.exec(line);
    if (match) {
      const name = match[1];
      const op = match[2];
      const version = match[3];

      results.push({
        name,
        version: op === '==' ? version : version.replace(/^[\^~>=<]+/, ''),
        versionConstraint: `${op}${version}`,
        ecosystem: ECOSYSTEMS.PYPI,
        isDirect: true,
        dependencyPath: [name],
        manifestPath: filePath,
        depth: 1,
      });
    } else {
      // Unpinned package name
      const simpleMatch = /^([a-zA-Z0-9_.-]+)$/.exec(line);
      if (simpleMatch) {
        results.push({
          name: simpleMatch[1],
          version: '*',
          versionConstraint: '*',
          ecosystem: ECOSYSTEMS.PYPI,
          isDirect: true,
          dependencyPath: [simpleMatch[1]],
          manifestPath: filePath,
          depth: 1,
        });
      }
    }
  }

  return results;
}

/**
 * Parses poetry.lock content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parsePoetryLock(content, filePath = 'poetry.lock') {
  assertFileSizeSafe(content, true);
  const results = [];
  const packages = content.split('[[package]]');

  for (let i = 1; i < packages.length; i++) {
    const block = packages[i];
    const nameMatch = /name\s*=\s*["']([^"']+)["']/.exec(block);
    const verMatch = /version\s*=\s*["']([^"']+)["']/.exec(block);

    if (nameMatch && verMatch) {
      results.push({
        name: nameMatch[1],
        version: verMatch[1],
        versionConstraint: verMatch[1],
        ecosystem: ECOSYSTEMS.PYPI,
        isDirect: false,
        dependencyPath: [nameMatch[1]],
        lockfilePath: filePath,
        depth: 1,
      });
    }
  }

  return results;
}

/**
 * Parses Pipfile.lock content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parsePipfileLock(content, filePath = 'Pipfile.lock') {
  assertFileSizeSafe(content, true);
  const parsed = JSON.parse(content);
  const results = [];

  const addEntries = (section) => {
    if (!section || typeof section !== 'object') return;
    for (const [name, meta] of Object.entries(section)) {
      if (!meta || typeof meta !== 'object') continue;
      const ver = (meta.version || '').replace(/^==/, '').trim();
      results.push({
        name,
        version: ver || '*',
        versionConstraint: meta.version || '*',
        ecosystem: ECOSYSTEMS.PYPI,
        isDirect: true,
        dependencyPath: [name],
        lockfilePath: filePath,
        depth: 1,
      });
    }
  };

  addEntries(parsed.default);
  addEntries(parsed.develop);

  return results;
}

// ── 3. GO PARSERS ─────────────────────────────────────────────────────────────

/**
 * Parses go.mod content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parseGoMod(content, filePath = 'go.mod') {
  assertFileSizeSafe(content, false);
  const results = [];
  const lines = content.split(/\r?\n/);
  let inRequireBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('require (')) {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && line === ')') {
      inRequireBlock = false;
      continue;
    }

    if (inRequireBlock || line.startsWith('require ')) {
      const cleanLine = line.replace(/^require\s+/, '').trim();
      const parts = cleanLine.split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0];
        const version = parts[1].replace(/^v/, '');
        const isIndirect = cleanLine.includes('// indirect');

        results.push({
          name,
          version,
          versionConstraint: parts[1],
          ecosystem: ECOSYSTEMS.GOLANG,
          isDirect: !isIndirect,
          dependencyPath: [name],
          manifestPath: filePath,
          depth: isIndirect ? 2 : 1,
        });
      }
    }
  }

  return results;
}

// ── 4. RUST CARGO PARSERS ─────────────────────────────────────────────────────

/**
 * Parses Cargo.toml content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parseCargoToml(content, filePath = 'Cargo.toml') {
  assertFileSizeSafe(content, false);
  const results = [];
  const lines = content.split(/\r?\n/);
  let inDeps = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '[dependencies]' || line === '[dev-dependencies]') {
      inDeps = true;
      continue;
    }
    if (inDeps && line.startsWith('[') && line.endsWith(']')) {
      inDeps = false;
      continue;
    }

    if (inDeps && line && !line.startsWith('#')) {
      // Example: serde = "1.0.104" or serde = { version = "1.0", features = ["derive"] }
      const match = /^([a-zA-Z0-9_-]+)\s*=\s*(.+)$/.exec(line);
      if (match) {
        const name = match[1];
        let ver = match[2].trim();
        if (ver.startsWith('{')) {
          const vMatch = /version\s*=\s*["']([^"']+)["']/.exec(ver);
          ver = vMatch ? vMatch[1] : '*';
        } else {
          ver = ver.replace(/^["']|["']$/g, '');
        }

        results.push({
          name,
          version: ver.replace(/^[\^~>=<]+/, ''),
          versionConstraint: ver,
          ecosystem: ECOSYSTEMS.CARGO,
          isDirect: true,
          dependencyPath: [name],
          manifestPath: filePath,
          depth: 1,
        });
      }
    }
  }

  return results;
}

/**
 * Parses Cargo.lock content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parseCargoLock(content, filePath = 'Cargo.lock') {
  assertFileSizeSafe(content, true);
  const results = [];
  const packages = content.split('[[package]]');

  for (let i = 1; i < packages.length; i++) {
    const block = packages[i];
    const nameMatch = /name\s*=\s*["']([^"']+)["']/.exec(block);
    const verMatch = /version\s*=\s*["']([^"']+)["']/.exec(block);

    if (nameMatch && verMatch) {
      results.push({
        name: nameMatch[1],
        version: verMatch[1],
        versionConstraint: verMatch[1],
        ecosystem: ECOSYSTEMS.CARGO,
        isDirect: false,
        dependencyPath: [nameMatch[1]],
        lockfilePath: filePath,
        depth: 1,
      });
    }
  }

  return results;
}

// ── 5. RUBY GEMFILE PARSERS ───────────────────────────────────────────────────

/**
 * Parses Gemfile.lock content.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parseGemfileLock(content, filePath = 'Gemfile.lock') {
  assertFileSizeSafe(content, true);
  const results = [];
  const lines = content.split(/\r?\n/);
  let inSpecs = false;

  for (const rawLine of lines) {
    if (rawLine === '  specs:') {
      inSpecs = true;
      continue;
    }
    if (inSpecs && rawLine.length > 0 && !rawLine.startsWith('    ')) {
      inSpecs = false;
      continue;
    }

    if (inSpecs && rawLine.startsWith('    ') && !rawLine.startsWith('      ')) {
      // E.g. "    rails (6.1.4)"
      const match = /^\s{4}([a-zA-Z0-9_-]+)\s+\(([0-9A-Za-z_.-]+)\)/.exec(rawLine);
      if (match) {
        results.push({
          name: match[1],
          version: match[2],
          versionConstraint: match[2],
          ecosystem: ECOSYSTEMS.RUBYGEMS,
          isDirect: false,
          dependencyPath: [match[1]],
          lockfilePath: filePath,
          depth: 1,
        });
      }
    }
  }

  return results;
}

// ── 6. PHP COMPOSER PARSERS ───────────────────────────────────────────────────

/**
 * Parses composer.json / composer.lock content.
 * @param {string} content
 * @param {string} filePath
 * @param {boolean} isLockfile
 * @returns {Array<object>}
 */
export function parseComposer(content, filePath = 'composer.json', isLockfile = false) {
  assertFileSizeSafe(content, isLockfile);
  const parsed = JSON.parse(content);
  const results = [];

  if (isLockfile) {
    const packages = [...(parsed.packages || []), ...(parsed['packages-dev'] || [])];
    for (const pkg of packages) {
      if (!pkg.name || !pkg.version) continue;
      results.push({
        name: pkg.name,
        version: pkg.version.replace(/^v/, ''),
        versionConstraint: pkg.version,
        ecosystem: ECOSYSTEMS.PACKAGIST,
        isDirect: false,
        dependencyPath: [pkg.name],
        lockfilePath: filePath,
        depth: 1,
      });
    }
  } else {
    const deps = { ...(parsed.require || {}), ...(parsed['require-dev'] || {}) };
    for (const [name, ver] of Object.entries(deps)) {
      if (name === 'php') continue;
      results.push({
        name,
        version: String(ver).replace(/^[\^~>=<]+/, ''),
        versionConstraint: String(ver),
        ecosystem: ECOSYSTEMS.PACKAGIST,
        isDirect: true,
        dependencyPath: [name],
        manifestPath: filePath,
        depth: 1,
      });
    }
  }

  return results;
}

// ── 7. MAVEN POM.XML & GRADLE PARSERS ─────────────────────────────────────────

/**
 * Safe pom.xml parser.
 * SECURITY: Strips all DOCTYPE / ENTITY declarations to eliminate XXE vulnerabilities completely.
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<object>}
 */
export function parsePomXml(content, filePath = 'pom.xml') {
  assertFileSizeSafe(content, false);
  // Strip DOCTYPE and entities
  const safeContent = content.replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<!ENTITY[^>]*>/gi, '');
  const results = [];

  const depBlocks = safeContent.match(/<dependency>[\s\S]*?<\/dependency>/gi) || [];
  for (const block of depBlocks) {
    const gMatch = /<groupId>\s*([^<]+)\s*<\/groupId>/.exec(block);
    const aMatch = /<artifactId>\s*([^<]+)\s*<\/artifactId>/.exec(block);
    const vMatch = /<version>\s*([^<]+)\s*<\/version>/.exec(block);

    if (gMatch && aMatch) {
      const name = `${gMatch[1].trim()}:${aMatch[1].trim()}`;
      const version = vMatch ? vMatch[1].trim() : '*';

      results.push({
        name,
        version: version.replace(/^[\^~>=<]+/, ''),
        versionConstraint: version,
        ecosystem: ECOSYSTEMS.MAVEN,
        isDirect: true,
        dependencyPath: [name],
        manifestPath: filePath,
        depth: 1,
      });
    }
  }

  return results;
}

/**
 * Generic Manifest/Lockfile dispatcher based on file name.
 * @param {string} filePath
 * @param {string} content
 * @returns {Array<object>}
 */
export function parseManifestContent(filePath, content) {
  const meta = identifyManifestType(filePath);
  if (!meta) {
    throw new Error(`Unsupported dependency manifest or lockfile: ${filePath}`);
  }

  switch (meta.fileType) {
    case 'package.json':
      return parsePackageJson(content, filePath);
    case 'package-lock.json':
    case 'npm-shrinkwrap.json':
      return parsePackageLockJson(content, filePath);
    case 'yarn.lock':
      return parseYarnLock(content, filePath);
    case 'pnpm-lock.yaml':
      return parsePnpmLock(content, filePath);
    case 'requirements.txt':
      return parseRequirementsTxt(content, filePath);
    case 'poetry.lock':
      return parsePoetryLock(content, filePath);
    case 'Pipfile.lock':
      return parsePipfileLock(content, filePath);
    case 'go.mod':
      return parseGoMod(content, filePath);
    case 'Cargo.toml':
      return parseCargoToml(content, filePath);
    case 'Cargo.lock':
      return parseCargoLock(content, filePath);
    case 'Gemfile.lock':
      return parseGemfileLock(content, filePath);
    case 'composer.json':
      return parseComposer(content, filePath, false);
    case 'composer.lock':
      return parseComposer(content, filePath, true);
    case 'pom.xml':
      return parsePomXml(content, filePath);
    default:
      return [];
  }
}
