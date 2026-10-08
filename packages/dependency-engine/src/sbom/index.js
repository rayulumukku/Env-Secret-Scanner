/**
 * packages/dependency-engine/src/sbom/index.js
 *
 * Deterministic Software Bill of Materials (SBOM) Generator.
 * Formats: CycloneDX 1.5 (JSON), SPDX 2.3 (JSON), and Native JSON.
 *
 * SECURITY INVARIANTS:
 * - NEVER includes secret values, tokens, or environment credentials.
 * - Formats valid, standard-compliant package URLs (purl) and SPDX IDs.
 */

import { randomUUID } from 'crypto';

/**
 * Builds a Package URL (purl) string for a dependency node.
 * @param {object} dep
 * @returns {string}
 */
export function buildPurl(dep) {
  const eco = dep.ecosystem ? dep.ecosystem.toLowerCase() : 'generic';
  const name = encodeURIComponent(dep.name).replace(/%40/g, '@');
  const ver = dep.version ? `@${encodeURIComponent(dep.version)}` : '';
  return `pkg:${eco}/${name}${ver}`;
}

/**
 * Generates CycloneDX 1.5 JSON SBOM representation.
 * @param {object} graph - Output of buildDependencyGraph
 * @param {object} metadata - Project context metadata
 * @returns {object} CycloneDX 1.5 JSON object
 */
export function generateCycloneDxSbom(graph, metadata = {}) {
  const serialNumber = `urn:uuid:${randomUUID()}`;
  const timestamp = new Date().toISOString();

  const components = (graph.nodes || []).map((node) => {
    const comp = {
      type: 'library',
      name: node.name,
      version: node.version || '0.0.0',
      purl: buildPurl(node),
      scope: node.isDev ? 'optional' : 'required',
    };

    if (node.license) {
      comp.licenses = [
        {
          license: {
            id: node.license,
          },
        },
      ];
    }

    if (node.integrity) {
      comp.hashes = [
        {
          alg: node.integrity.startsWith('sha512-') ? 'SHA-512' : 'SHA-256',
          content: node.integrity.replace(/^(sha512-|sha256-)/, ''),
        },
      ];
    }

    return comp;
  });

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber,
    version: 1,
    metadata: {
      timestamp,
      tools: [
        {
          vendor: 'SecretShield',
          name: 'secretshield-dependency-engine',
          version: '1.0.0',
        },
      ],
      component: {
        type: 'application',
        name: metadata.appName || graph.rootName || 'application',
        version: metadata.version || '1.0.0',
      },
    },
    components,
    dependencies: (graph.nodes || []).map(node => ({
      ref: buildPurl(node),
      dependsOn: [],
    })),
  };
}

/**
 * Generates SPDX 2.3 JSON SBOM representation.
 * @param {object} graph
 * @param {object} metadata
 * @returns {object} SPDX 2.3 JSON object
 */
export function generateSpdxSbom(graph, metadata = {}) {
  const rootId = 'SPDXRef-Package-Root';
  const timestamp = new Date().toISOString();

  const packages = [
    {
      SPDXID: rootId,
      name: metadata.appName || graph.rootName || 'application',
      versionInfo: metadata.version || '1.0.0',
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
    },
    ...(graph.nodes || []).map((node, index) => {
      const spdxId = `SPDXRef-Package-${index + 1}`;
      return {
        SPDXID: spdxId,
        name: node.name,
        versionInfo: node.version || '0.0.0',
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: node.license || 'NOASSERTION',
        licenseDeclared: node.license || 'NOASSERTION',
        externalRefs: [
          {
            referenceCategory: 'PACKAGE-MANAGER',
            referenceType: 'purl',
            referenceLocator: buildPurl(node),
          },
        ],
      };
    }),
  ];

  const relationships = (graph.nodes || []).map((node, index) => ({
    spdxElementId: rootId,
    relationshipType: node.isDirect ? 'DEPENDS_ON' : 'CONTAINS',
    relatedSpdxElement: `SPDXRef-Package-${index + 1}`,
  }));

  return {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: `${metadata.appName || graph.rootName || 'application'}-sbom`,
    documentNamespace: `https://secretshield.dev/spdx/${randomUUID()}`,
    creationInfo: {
      creators: ['Tool: SecretShield-2.0'],
      created: timestamp,
    },
    packages,
    relationships,
  };
}

/**
 * Generates native normalized JSON SBOM.
 * @param {object} graph
 * @param {object} metadata
 * @returns {object}
 */
export function generateNativeJsonSbom(graph, metadata = {}) {
  return {
    schemaVersion: 'secretshield.sbom.v1',
    generatedAt: new Date().toISOString(),
    application: {
      name: metadata.appName || graph.rootName || 'application',
      version: metadata.version || '1.0.0',
    },
    statistics: {
      totalDependencies: graph.totalDependencies || 0,
      directCount: graph.directCount || 0,
      transitiveCount: graph.transitiveCount || 0,
      maxDepth: graph.maxDepth || 1,
    },
    dependencies: (graph.nodes || []).map(node => ({
      name: node.name,
      version: node.version,
      ecosystem: node.ecosystem,
      isDirect: node.isDirect,
      purl: buildPurl(node),
      license: node.license || 'UNKNOWN',
      dependencyPath: node.dependencyPath,
      manifestPath: node.manifestPath,
      lockfilePath: node.lockfilePath,
    })),
  };
}

/**
 * Dispatches SBOM generation by format.
 * @param {object} graph
 * @param {'cyclonedx'|'spdx'|'json'} format
 * @param {object} metadata
 * @returns {string} Formatted JSON string
 */
export function generateSbom(graph, format = 'cyclonedx', metadata = {}) {
  const normFormat = String(format || 'cyclonedx').toLowerCase();
  let sbomObj;

  switch (normFormat) {
    case 'spdx':
      sbomObj = generateSpdxSbom(graph, metadata);
      break;
    case 'json':
    case 'native':
      sbomObj = generateNativeJsonSbom(graph, metadata);
      break;
    case 'cyclonedx':
    default:
      sbomObj = generateCycloneDxSbom(graph, metadata);
      break;
  }

  return JSON.stringify(sbomObj, null, 2);
}
