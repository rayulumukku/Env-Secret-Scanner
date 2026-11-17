import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parsePackageJson,
  compareVersions,
  classifyLicense,
  generateNativeJsonSbom,
} from '../../packages/dependency-engine/index.js';

describe('Dependency Intelligence Engine', () => {
  it('parses package.json manifests accurately', () => {
    const content = JSON.stringify({
      name: 'sample-app',
      dependencies: { lodash: '^4.17.21' },
      devDependencies: { mocha: '^10.0.0' },
    });
    const parsed = parsePackageJson(content, 'package.json');
    assert.strictEqual(Array.isArray(parsed), true);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].name, 'lodash');
  });

  it('compares semver versions correctly', () => {
    assert.strictEqual(compareVersions('1.2.3', '1.2.4'), -1);
    assert.strictEqual(compareVersions('2.0.0', '1.9.9'), 1);
    assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0);
  });

  it('classifies standard open-source licenses', () => {
    const mit = classifyLicense('MIT');
    assert.strictEqual(mit.classification, 'PERMISSIVE');
    const gpl = classifyLicense('GPL-3.0');
    assert.strictEqual(gpl.classification, 'COPYLEFT');
  });

  it('generates schema-compliant SBOM structure', () => {
    const graph = {
      rootName: 'test-project',
      nodes: [
        { name: 'express', version: '4.18.2', ecosystem: 'npm', license: 'MIT', isDirect: true },
      ],
      totalDependencies: 1,
      directCount: 1,
      transitiveCount: 0,
      maxDepth: 1,
    };
    const sbom = generateNativeJsonSbom(graph, { appName: 'test-project', version: '1.0.0' });
    assert.strictEqual(sbom.schemaVersion, 'secretshield.sbom.v1');
    assert.strictEqual(sbom.dependencies.length, 1);
  });
});
