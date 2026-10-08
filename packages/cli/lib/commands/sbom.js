/**
 * packages/cli/lib/commands/sbom.js
 *
 * SecretShield CLI SBOM Command.
 *
 * Usage:
 *   secretshield sbom [path]
 *   secretshield sbom [path] --format cyclonedx
 *   secretshield sbom [path] --format spdx
 *   secretshield sbom [path] --format json
 *
 * SECURITY INVARIANT:
 * - NEVER includes raw secrets, tokens, or environment credentials.
 */

import { resolve, basename } from 'path';
import { scanProjectDependencies, generateSbom } from '../../../dependency-engine/index.js';

export async function sbomCommand(targetPath = '.', options = {}) {
  const normPath = resolve(targetPath || '.');
  const format = (options.format || 'cyclonedx').toLowerCase();

  const scanResult = scanProjectDependencies(normPath, { checkReachability: false });
  const sbomOutput = generateSbom(scanResult.graph, format, {
    appName: basename(normPath),
    version: '1.0.0',
  });

  if (options.output || options.file) {
    const fs = await import('fs');
    fs.writeFileSync(resolve(options.output || options.file), sbomOutput, 'utf8');
    if (!options.quiet) {
      console.log(`\n  ✓ SBOM exported successfully (${format}) to ${options.output || options.file}\n`);
    }
    return 0;
  }

  // Stdout
  console.log(sbomOutput);
  return 0;
}
