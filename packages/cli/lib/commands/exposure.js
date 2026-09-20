/**
 * packages/cli/lib/commands/exposure.js
 *
 * Secret Exposure Intelligence, Timeline, Graph & Investigation CLI Commands for SecretShield.
 *
 * SECURITY INVARIANT: Never prints raw secrets to terminal or logs.
 */

import { listExposureClusters, getExposureClusterByFingerprint, getExposureTimeline } from '../../../../app-src/lib/db/exposure.js';
import { generateExposureGraph } from '../../../../app-src/lib/exposure/graph.js';
import { sanitizeForExport } from '../../../../app-src/lib/exposure/sanitizer.js';

export async function exposureCommand(subAction = 'list', targetArg = '', options = {}) {
  // 1. EXPOSURE LIST / CLUSTERS
  if (subAction === 'list' || !subAction) {
    const { clusters, total } = await listExposureClusters({
      repositoryId: options.repository || null,
      status: options.status || null,
      limit: 100,
    });

    if (options.json) {
      console.log(JSON.stringify(sanitizeForExport({ clusters, total }), null, 2));
      return 0;
    }

    console.log('\n  SecretShield  v2.0  Secret Exposure Intelligence');
    console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

    if (clusters.length === 0) {
      console.log('  ✔ Zero active exposure clusters detected.\n');
      return 0;
    }

    console.log('  FINGERPRINT           RULE ID                  SEVERITY    REPOS   DURATION');
    console.log('  ─────────────────────────────────────────────────────────────────────────────');

    for (const c of clusters) {
      const fp = (c.fingerprint || '').padEnd(20, ' ');
      const rule = (c.ruleId || 'GENERIC').slice(0, 22).padEnd(24, ' ');
      const sev = (c.severity || 'HIGH').padEnd(11, ' ');
      const repos = String(c.repositoryCount || 1).padEnd(7, ' ');
      const dur = c.durations?.historicalDurationHuman || '0m';
      console.log(`  ${fp} ${rule} ${sev} ${repos} ${dur}`);
    }

    console.log(`\n  Total clusters: ${total} | Cross-repo exposures: ${clusters.filter(c => c.isCrossRepository).length}\n`);
    return 0;
  }

  // 2. EXPOSURE DETAIL / INVESTIGATE
  if (subAction === 'detail' || subAction === 'investigate' || targetArg) {
    const fp = targetArg || subAction;
    const cluster = await getExposureClusterByFingerprint(fp);

    if (!cluster) {
      console.error(`Error: Exposure cluster not found for fingerprint: ${fp}`);
      return 1;
    }

    if (options.json) {
      console.log(JSON.stringify(sanitizeForExport(cluster), null, 2));
      return 0;
    }

    console.log(`\n  Exposure Investigation: ${cluster.maskedValue}`);
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    console.log(`  Fingerprint:          ${cluster.fingerprint}`);
    console.log(`  Rule:                 ${cluster.ruleName} (${cluster.ruleId})`);
    console.log(`  Severity:             ${cluster.severity}`);
    console.log(`  Status:               ${cluster.status}`);
    console.log(`  Affected Repos:       ${cluster.repositoryCount}`);
    console.log(`  Affected Branches:    ${cluster.branchCount}`);
    console.log(`  Affected Commits:     ${cluster.commitCount}`);
    console.log(`  Affected Files:       ${cluster.fileCount}`);
    console.log(`  Historical Duration:  ${cluster.durations?.historicalDurationHuman || '0m'}`);
    console.log(`  Correlation Reason:   ${cluster.correlationReason}`);
    console.log(`  Remediation Guide:    ${cluster.findings[0]?.remediation || 'Revoke and rotate credential immediately.'}`);
    console.log('');
    return 0;
  }

  return 0;
}

export async function historyCommand(options = {}) {
  const fp = options.fingerprint;
  if (!fp) {
    console.error('Error: Provide --fingerprint <hash> to view chronological exposure history.');
    return 1;
  }

  const timeline = await getExposureTimeline(fp);

  if (options.json) {
    console.log(JSON.stringify(sanitizeForExport(timeline), null, 2));
    return 0;
  }

  console.log(`\n  Exposure History Timeline: ${fp}`);
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

  for (const evt of timeline.events || []) {
    const time = new Date(evt.timestamp).toLocaleString();
    console.log(`  [${time}] ${evt.title} (${evt.badge || 'Event'})`);
    console.log(`    • ${evt.description}`);
    if (evt.file) console.log(`    • File: ${evt.file}${evt.commitHash ? ` @ ${evt.commitHash.slice(0, 8)}` : ''}`);
    console.log('');
  }

  console.log(`  Total events: ${timeline.totalEvents} | Duration: ${timeline.durations?.historicalDurationHuman || '0m'}\n`);
  return 0;
}

export async function graphCommand(options = {}) {
  const { clusters } = await listExposureClusters({
    repositoryId: options.repository || null,
    limit: 50,
  });

  const findings = clusters.flatMap(c => c.findings || []);
  const graph = generateExposureGraph({
    findings,
    focusFingerprint: options.fingerprint || null,
    maxDepth: options.depth ? parseInt(options.depth, 10) : 4,
  });

  if (options.json) {
    console.log(JSON.stringify(sanitizeForExport(graph), null, 2));
    return 0;
  }

  console.log('\n  SecretShield Exposure Graph Topology');
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

  for (const node of graph.nodes || []) {
    const indent = '  '.repeat(node.depth + 1);
    console.log(`${indent}├─ [${node.type}] ${node.label}`);
  }

  console.log(`\n  Total Nodes: ${graph.nodesCount} | Total Edges: ${graph.edgesCount}\n`);
  console.log(`  Notice: ${graph.validityNotice}\n`);
  return 0;
}
