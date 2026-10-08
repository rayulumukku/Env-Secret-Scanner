/**
 * app-src/lib/dependencies/__tests__/dependencies.test.js
 *
 * Tests for Database Dependency Layer, Multi-Tenant Isolation, and Policy Integration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  upsertDependency,
  listDependencies,
  storeDependencyFindings,
  listDependencyFindings,
  recordDependencyScan,
} from '../../db/dependencies.js';

import { evaluatePolicyConditions } from '../../policies/evaluator.js';
import { ConditionField, ConditionOperator, PolicyAction } from '../../policies/schemas.js';

describe('Dependencies Database Layer & Multi-Tenant Isolation', () => {
  it('should isolate dependencies across distinct organizations', async () => {
    await upsertDependency({
      organizationId: 'org-alpha',
      ecosystem: 'npm',
      name: 'lodash',
      description: 'Lodash utilities'
    });

    await upsertDependency({
      organizationId: 'org-beta',
      ecosystem: 'npm',
      name: 'express',
      description: 'Fast web framework'
    });

    const alphaDeps = await listDependencies({ organizationId: 'org-alpha' });
    const betaDeps = await listDependencies({ organizationId: 'org-beta' });

    assert.equal(alphaDeps.items.length, 1);
    assert.equal(alphaDeps.items[0].name, 'lodash');

    assert.equal(betaDeps.items.length, 1);
    assert.equal(betaDeps.items[0].name, 'express');
  });

  it('should store and query dependency vulnerability findings scoped by organization', async () => {
    const findings = [
      {
        id: 'finding-vuln-1',
        package: 'lodash',
        ecosystem: 'npm',
        installedVersion: '4.17.15',
        affectedRange: '<4.17.21',
        fixedVersion: '4.17.21',
        advisoryId: 'GHSA-p6mc-m468-83gw',
        severity: 'HIGH',
        status: 'OPEN',
        isDirect: true,
        dependencyPath: ['app', 'lodash'],
        reachabilityStatus: 'POTENTIALLY_REACHABLE',
        evidence: { manifest: 'package.json' }
      }
    ];

    await storeDependencyFindings('org-alpha', 'repo-1', findings);

    const resAlpha = await listDependencyFindings({ organizationId: 'org-alpha' });
    assert.equal(resAlpha.items.length, 1);
    assert.equal(resAlpha.items[0].packageName, 'lodash');
    assert.equal(resAlpha.items[0].severity, 'HIGH');

    const resBeta = await listDependencyFindings({ organizationId: 'org-beta' });
    assert.equal(resBeta.items.length, 0);
  });

  it('should record dependency scan session', async () => {
    const scan = await recordDependencyScan({
      organizationId: 'org-alpha',
      repositoryId: 'repo-1',
      totalDependencies: 42,
      directCount: 12,
      transitiveCount: 30,
      vulnerabilitiesCount: 1,
    });

    assert.ok(scan.id);
    assert.equal(scan.totalDependencies, 42);
    assert.equal(scan.status, 'COMPLETED');
  });
});

describe('Policy Engine Integration — Dependency & License Rules', () => {
  it('should evaluate policy requiring review for disallowed licenses', () => {
    const policy = {
      name: 'Disallowed License Check',
      scope: 'ORGANIZATION',
      conditions: [
        {
          field: ConditionField.PACKAGE_LICENSE_DISALLOWED,
          operator: ConditionOperator.EQUALS,
          value: true
        }
      ],
      actions: [PolicyAction.REQUIRE_REVIEW]
    };

    const ctxDisallowed = { isLicenseDisallowed: true };
    const res = evaluatePolicyConditions(policy, ctxDisallowed);
    assert.equal(res.matched, true);

    const ctxAllowed = { isLicenseDisallowed: false };
    const resAllowed = evaluatePolicyConditions(policy, ctxAllowed);
    assert.equal(resAllowed.matched, false);
  });

  it('should evaluate policy failing CI when critical vulnerability exists', () => {
    const policy = {
      name: 'Block CI on Critical Vulnerabilities',
      scope: 'ORGANIZATION',
      conditions: [
        {
          field: ConditionField.CRITICAL_VULNERABILITY_EXISTS,
          operator: ConditionOperator.EQUALS,
          value: true
        }
      ],
      actions: [PolicyAction.FAIL_CI]
    };

    const ctxWithCrit = {
      vulnerabilities: [
        { package: 'log4j', severity: 'CRITICAL' }
      ]
    };
    const res = evaluatePolicyConditions(policy, ctxWithCrit);
    assert.equal(res.matched, true);

    const ctxWithoutCrit = {
      vulnerabilities: [
        { package: 'lodash', severity: 'HIGH' }
      ]
    };
    const resNo = evaluatePolicyConditions(policy, ctxWithoutCrit);
    assert.equal(resNo.matched, false);
  });

  it('should evaluate policy creating advisory when dependency is deprecated', () => {
    const policy = {
      name: 'Advisory on Deprecated Package',
      scope: 'ORGANIZATION',
      conditions: [
        {
          field: ConditionField.DEPENDENCY_IS_DEPRECATED,
          operator: ConditionOperator.EQUALS,
          value: true
        }
      ],
      actions: [PolicyAction.CREATE_ADVISORY]
    };

    const ctxDeprecated = { isDeprecated: true };
    const res = evaluatePolicyConditions(policy, ctxDeprecated);
    assert.equal(res.matched, true);
  });
});
