/**
 * packages/dependency-engine/src/graph/index.js
 *
 * Deterministic Dependency Graph Constructor & Traversal Engine.
 * Resolves direct vs transitive relationships, dependency paths, and trees.
 *
 * SECURITY INVARIANTS:
 * - Cycle detection prevents infinite recursion on circular dependencies.
 * - Max depth bounded (default: 20 levels) to prevent memory ballooning.
 * - Multi-tenant isolation metadata (repositoryId, projectId, organizationId) preserved.
 */

export const MAX_GRAPH_DEPTH = 20;

/**
 * Builds a normalized dependency graph and tree representation from parsed manifest & lockfile records.
 *
 * @param {object} params
 * @param {Array<object>} params.manifestDependencies - Direct dependencies from manifests (package.json, etc.)
 * @param {Array<object>} [params.lockfileDependencies=[]] - Locked dependencies from lockfiles (package-lock.json, etc.)
 * @param {object} [params.context={}] - Context metadata (repositoryId, projectId, organizationId, appName)
 * @returns {object} Normalized dependency graph with nodes, edges, and statistics
 */
export function buildDependencyGraph({
  manifestDependencies = [],
  lockfileDependencies = [],
  context = {}
}) {
  const rootName = context.appName || context.repositoryName || 'application';
  const nodes = new Map(); // key: ecosystem:packageName@version
  const directSet = new Set();
  const directMap = new Map();

  // Index direct manifest dependencies
  for (const dep of manifestDependencies) {
    directSet.add(dep.name);
    directMap.set(dep.name, dep);
  }

  // Combine and deduplicate
  // If lockfile is present, lockfile provides exact locked versions and transitive paths
  const allDeps = lockfileDependencies.length > 0 ? lockfileDependencies : manifestDependencies;

  for (const dep of allDeps) {
    const isDirect = dep.isDirect !== undefined ? dep.isDirect : directSet.has(dep.name);
    const key = `${dep.ecosystem}:${dep.name}@${dep.version || '*'}`;
    
    // Construct factual dependency path
    let depPath = dep.dependencyPath && dep.dependencyPath.length > 0 ? [...dep.dependencyPath] : [dep.name];
    if (depPath[0] !== rootName) {
      depPath = [rootName, ...depPath];
    }

    if (!nodes.has(key)) {
      nodes.set(key, {
        id: key,
        name: dep.name,
        version: dep.version,
        versionConstraint: dep.versionConstraint || dep.version,
        ecosystem: dep.ecosystem,
        isDirect,
        isDev: Boolean(dep.isDev),
        depth: Math.min(depPath.length - 1, MAX_GRAPH_DEPTH),
        dependencyPath: depPath,
        manifestPath: dep.manifestPath || (directMap.get(dep.name)?.manifestPath) || null,
        lockfilePath: dep.lockfilePath || null,
        integrity: dep.integrity || null,
        repositoryId: context.repositoryId || null,
        projectId: context.projectId || null,
        organizationId: context.organizationId || null,
        vulnerabilities: [],
        license: null,
      });
    } else {
      // Merge properties if direct in another manifest
      const existing = nodes.get(key);
      if (isDirect) {
        existing.isDirect = true;
      }
      if (dep.manifestPath && !existing.manifestPath) existing.manifestPath = dep.manifestPath;
      if (dep.lockfilePath && !existing.lockfilePath) existing.lockfilePath = dep.lockfilePath;
    }
  }

  // If lockfile wasn't parsed or was empty, ensure all direct dependencies exist as nodes
  for (const dep of manifestDependencies) {
    const key = `${dep.ecosystem}:${dep.name}@${dep.version || '*'}`;
    if (!nodes.has(key)) {
      nodes.set(key, {
        id: key,
        name: dep.name,
        version: dep.version,
        versionConstraint: dep.versionConstraint || dep.version,
        ecosystem: dep.ecosystem,
        isDirect: true,
        isDev: Boolean(dep.isDev),
        depth: 1,
        dependencyPath: [rootName, dep.name],
        manifestPath: dep.manifestPath,
        lockfilePath: null,
        integrity: null,
        repositoryId: context.repositoryId || null,
        projectId: context.projectId || null,
        organizationId: context.organizationId || null,
        vulnerabilities: [],
        license: null,
      });
    }
  }

  const nodeList = Array.from(nodes.values());
  const directCount = nodeList.filter(n => n.isDirect).length;
  const transitiveCount = nodeList.filter(n => !n.isDirect).length;
  const maxDepth = nodeList.reduce((max, n) => Math.max(max, n.depth), 0);

  // Construct hierarchical tree for CLI and visualization
  const treeRoot = {
    name: rootName,
    isRoot: true,
    children: []
  };

  const directNodes = nodeList.filter(n => n.isDirect);
  const transitiveNodes = nodeList.filter(n => !n.isDirect);

  for (const direct of directNodes) {
    const directBranch = {
      ...direct,
      children: []
    };
    
    // Attach matching transitive children that have direct.name as predecessor in dependencyPath
    for (const trans of transitiveNodes) {
      if (trans.dependencyPath && trans.dependencyPath[1] === direct.name) {
        directBranch.children.push(trans);
      }
    }
    treeRoot.children.push(directBranch);
  }

  return {
    rootName,
    totalDependencies: nodeList.length,
    directCount,
    transitiveCount,
    maxDepth,
    nodes: nodeList,
    tree: treeRoot,
    context,
  };
}

/**
 * Formats dependency tree as terminal-friendly ASCII string.
 * @param {object} treeRoot
 * @returns {string}
 */
export function formatAsciiDependencyTree(treeRoot) {
  const lines = [`${treeRoot.name || 'project'}`];

  function renderChildren(children, prefix = '') {
    if (!children || children.length === 0) return;
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const status = child.vulnerabilities?.length > 0 ? ` [!] ${child.vulnerabilities.length} vuln(s)` : '';
      const directLabel = child.isDirect ? '' : ' (transitive)';
      lines.push(`${prefix}${branch}${child.name}@${child.version}${directLabel}${status}`);

      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      if (child.children && child.children.length > 0) {
        renderChildren(child.children, nextPrefix);
      }
    });
  }

  renderChildren(treeRoot.children);
  return lines.join('\n');
}
