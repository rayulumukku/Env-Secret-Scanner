/**
 * packages/cli/lib/commands/threats.js
 *
 * Threat intelligence command suite for SecretShield.
 */

import {
  DEFAULT_THREAT_SOURCES,
  buildThreatIntelSnapshot,
  getThreatIntelligenceOverview,
} from '../../../../app-src/lib/threat-intelligence/index.js';

const SAMPLE_THREATS = [
  {
    id: 'intel-ghsa-lodash',
    sourceId: 'github-advisory-db',
    sourceName: 'GitHub Advisory Database',
    sourceType: 'advisory-feed',
    title: 'Prototype pollution in lodash',
    summary: 'Prototype pollution in lodash before 4.17.21 allows unsafe property manipulations.',
    severity: 'HIGH',
    ecosystem: 'npm',
    packageNames: ['lodash'],
    advisoryId: 'GHSA-p6mc-m468-83gw',
    references: ['https://github.com/advisories/GHSA-p6mc-m468-83gw'],
    evidence: { advisoryId: 'GHSA-p6mc-m468-83gw' },
    publishedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'intel-osv-axios',
    sourceId: 'osv',
    sourceName: 'OSV',
    sourceType: 'advisory-feed',
    title: 'Axios SSRF vulnerability',
    summary: 'Axios versions before 0.21.2 may be vulnerable to SSRF in some request flows.',
    severity: 'MEDIUM',
    ecosystem: 'npm',
    packageNames: ['axios'],
    advisoryId: 'OSV-AXIOS-1',
    references: ['https://osv.dev/vulnerability/OSV-AXIOS-1'],
    evidence: { osvId: 'OSV-AXIOS-1' },
    publishedAt: '2023-11-01T00:00:00.000Z',
  },
];

export async function threatsCommand(action = 'list', target = '', options = {}) {
  const packageInventory = target
    ? [{ name: target, ecosystem: 'npm', version: '4.17.20' }]
    : [
        { name: 'lodash', ecosystem: 'npm', version: '4.17.20' },
        { name: 'axios', ecosystem: 'npm', version: '1.6.0' },
        { name: 'next', ecosystem: 'npm', version: '16.3.5' },
      ];

  const snapshot = buildThreatIntelSnapshot({
    sources: DEFAULT_THREAT_SOURCES,
    items: SAMPLE_THREATS,
    dependencies: packageInventory,
  });

  if (options.json) {
    const payload = action === 'overview' ? getThreatIntelligenceOverview({
      sources: DEFAULT_THREAT_SOURCES,
      items: SAMPLE_THREATS,
      dependencies: packageInventory,
    }) : snapshot.toJSON();

    console.log(JSON.stringify(payload, null, 2));
    return 0;
  }

  if (action === 'sources') {
    console.log('\n  SecretShield Threat Intelligence Sources');
    for (const source of snapshot.sources) {
      console.log(`  - ${source.name} (${source.type}) :: ${source.status}`);
    }
    return 0;
  }

  if (action === 'analyze') {
    console.log('\n  SecretShield Threat Impact Analysis');
    for (const impact of snapshot.impacts) {
      console.log(`  [${impact.relevance}] ${impact.packageName || 'unknown'} :: ${impact.threatTitle}`);
    }
    return 0;
  }

  console.log('\n  SecretShield  v2.0  Threat Intelligence');
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');
  console.log(`  Sources: ${snapshot.sources.length}`);
  console.log(`  Items: ${snapshot.items.length}`);
  console.log(`  Correlated impacts: ${snapshot.impacts.length}\n`);

  for (const item of snapshot.items) {
    console.log(`  - [${item.severity}] ${item.title} (${item.sourceName})`);
  }

  return 0;
}
