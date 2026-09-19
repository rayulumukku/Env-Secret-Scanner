/**
 * packages/cli/lib/commands/benchmark.js
 *
 * `secretshield benchmark` command implementation.
 * Measures scanner engine throughput (files/sec, MB/sec) and top rule latency.
 */

import { runBenchmark } from '../../../../app-src/lib/scanner/benchmark.js';

export async function runBenchmarkCommand(opts = {}) {
  const fileCount = Number(opts.files || 1000);
  console.log(`\n  SecretShield v2.0 Performance Benchmark`);
  console.log(`  ────────────────────────────────────────`);
  console.log(`  Generating ${fileCount.toLocaleString()} synthetic source fixtures…`);

  const startTime = Date.now();
  const res = await runBenchmark({ fileCount, linesPerFile: 35 });

  console.log(`\n  Results:`);
  console.log(`  Files:       ${res.filesCount.toLocaleString()}`);
  console.log(`  Total Size:  ${res.totalSizeMb} MB (${res.totalSizeBytes.toLocaleString()} bytes)`);
  console.log(`  Duration:    ${res.durationMs} ms`);
  console.log(`  Files/sec:   ${res.filesPerSec.toLocaleString()}`);
  console.log(`  MB/sec:      ${res.mbPerSec}`);
  console.log(`  Memory:      +${res.memoryUsageMb} MB heap`);

  console.log(`\n  Top Rule Execution Times:`);
  for (const timing of res.topRuleTimings) {
    console.log(`    • ${timing.rule.padEnd(30)} ${timing.timeMs} ms`);
  }
  console.log(`  ────────────────────────────────────────\n`);

  return 0;
}
