import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ThreatIntelSource,
  ThreatIntelItem,
  normalizeThreatIntelItem,
  dedupeThreatIntelItems,
  correlateThreatsWithDependencies,
  ThreatImpact,
} from '../index.js';

import { threatsCommand } from '../../../../packages/cli/lib/commands/threats.js';

test('normalizes and deduplicates threat intelligence items', () => {
  const source = new ThreatIntelSource({
    id: 'ghsa',
    name: 'GitHub Advisory Database',
    type: 'advisory-feed',
    url: 'https://example.com/advisories',
    freshnessWindowMs: 86400000,
  });

  const input = [
    {
      sourceId: 'ghsa',
      title: 'Prototype pollution in lodash',
      summary: 'Prototype pollution in lodash before 4.17.21.',
      ecosystem: 'npm',
      packageNames: ['lodash'],
      severity: 'HIGH',
      advisoryId: 'GHSA-p6mc-m468-83gw',
      references: ['https://github.com/advisories/GHSA-p6mc-m468-83gw'],
      evidence: { source: 'ghsa' },
      publishedAt: '2024-01-05T00:00:00.000Z',
    },
    {
      sourceId: 'ghsa',
      title: 'Prototype pollution in lodash',
      summary: 'Prototype pollution in lodash before 4.17.21.',
      ecosystem: 'npm',
      packageNames: ['lodash'],
      severity: 'HIGH',
      advisoryId: 'GHSA-p6mc-m468-83gw',
      references: ['https://github.com/advisories/GHSA-p6mc-m468-83gw'],
      evidence: { source: 'ghsa' },
      publishedAt: '2024-01-05T00:00:00.000Z',
    },
  ];

  const items = input.map(item => normalizeThreatIntelItem(item, source));
  const unique = dedupeThreatIntelItems(items);

  assert.equal(unique.length, 1);
  assert.equal(unique[0].sourceId, 'ghsa');
  assert.equal(unique[0].packageNames[0], 'lodash');
  assert.equal(unique[0].severity, 'HIGH');
});

test('correlates threat intelligence with installed packages and marks confirmed relevance', () => {
  const item = new ThreatIntelItem({
    id: 'intel-1',
    sourceId: 'ghsa',
    title: 'Prototype pollution in lodash',
    summary: 'Prototype pollution in lodash before 4.17.21.',
    ecosystem: 'npm',
    packageNames: ['lodash'],
    severity: 'HIGH',
    sourceType: 'advisory-feed',
    evidence: { advisoryId: 'GHSA-p6mc-m468-83gw' },
  });

  const dependencies = [{ name: 'lodash', ecosystem: 'npm', version: '4.17.20' }];
  const impacts = correlateThreatsWithDependencies([item], dependencies);

  assert.equal(impacts.length, 1);
  assert.equal(impacts[0].relevance, 'CONFIRMED_RELEVANT');
  assert.ok(impacts[0].evidence.some(item => item.packageName === 'lodash'));
  assert.ok(impacts[0].summary.includes('lodash'));
});

test('threats command returns a successful status for the list view', async () => {
  const result = await threatsCommand('list', '', { json: true });
  assert.equal(result, 0);
});
