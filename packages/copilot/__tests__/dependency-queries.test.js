/**
 * packages/copilot/__tests__/dependency-queries.test.js
 *
 * Tests for Copilot Dependency & Supply-Chain Safe Questions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryCopilot } from '../index.js';

describe('Copilot Dependency & Supply-Chain Safe Questions (Local Deterministic Mode)', () => {
  it('should answer "Why is this dependency vulnerable?" factually with reachability context', async () => {
    const context = {
      vulnerability: {
        package: 'lodash',
        installedVersion: '4.17.15',
        affectedRange: '<4.17.21',
        advisoryId: 'GHSA-p6mc-m468-83gw',
        reachabilityStatus: 'POTENTIALLY_REACHABLE',
        evidence: { manifestPath: 'package.json' }
      }
    };
    const res = await queryCopilot({ query: 'Why is this dependency vulnerable?', context });
    assert.equal(res.intent, 'DEPENDENCY_VULNERABILITY_REASON_QUERY');
    assert.ok(res.answer.includes('lodash@4.17.15 is vulnerable'));
    assert.ok(res.answer.includes('POTENTIALLY_REACHABLE'));
    assert.ok(!res.answer.includes('exploitable'));
  });

  it('should answer "Where is this package used?" with dependency path', async () => {
    const context = {
      dependency: {
        name: 'qs',
        isDirect: false,
        dependencyPath: ['my-app', 'express', 'qs']
      }
    };
    const res = await queryCopilot({ query: 'Where is this package used?', context });
    assert.equal(res.intent, 'PACKAGE_USAGE_LOCATION_QUERY');
    assert.ok(res.answer.includes('transitive dependency'));
    assert.ok(res.answer.includes('my-app → express → qs'));
  });

  it('should answer "Which repositories are affected?"', async () => {
    const context = {
      affectedRepositories: ['web-frontend', 'api-backend', 'worker-service']
    };
    const res = await queryCopilot({ query: 'Which repositories are affected?', context });
    assert.equal(res.intent, 'AFFECTED_REPOSITORIES_QUERY');
    assert.equal(res.repositoriesCount, 3);
    assert.ok(res.answer.includes('web-frontend, api-backend, worker-service'));
  });

  it('should answer "Can I upgrade safely?" with fixed version proposal', async () => {
    const context = {
      vulnerability: {
        installedVersion: '4.17.15',
        fixedVersion: '4.17.21',
      },
      isDirect: true
    };
    const res = await queryCopilot({ query: 'Can I upgrade safely?', context });
    assert.equal(res.intent, 'SAFE_UPGRADE_ASSESSMENT_QUERY');
    assert.ok(res.answer.includes('4.17.15 → 4.17.21'));
  });

  it('should answer "What does this advisory affect?"', async () => {
    const context = {
      advisory: {
        id: 'GHSA-p6mc-m468-83gw',
        package: 'lodash',
        ecosystem: 'npm',
        affectedRange: '<4.17.21',
        severity: 'HIGH'
      }
    };
    const res = await queryCopilot({ query: 'What does this advisory affect?', context });
    assert.equal(res.intent, 'ADVISORY_IMPACT_QUERY');
    assert.ok(res.answer.includes('GHSA-p6mc-m468-83gw affects package lodash (npm)'));
    assert.ok(res.answer.includes('<4.17.21'));
  });

  it('should answer "What changed in this PR?" with dependency changes', async () => {
    const context = {
      prDiff: {
        dependencyChanges: [
          { package: 'lodash', changeType: 'UPGRADED_DEPENDENCY' },
          { package: 'axios', changeType: 'NEW_DEPENDENCY' }
        ]
      }
    };
    const res = await queryCopilot({ query: 'What changed in this PR for dependencies?', context });
    assert.equal(res.intent, 'PR_DEPENDENCY_CHANGES_QUERY');
    assert.equal(res.totalChanges, 2);
    assert.ok(res.answer.includes('PR modifies 2 dependency(ies)'));
  });
});
