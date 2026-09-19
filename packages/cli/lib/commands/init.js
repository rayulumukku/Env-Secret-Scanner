/**
 * packages/cli/lib/commands/init.js
 *
 * Initialize SecretShield configuration in the current workspace.
 * Generates `.secretshield.json` and prints setup instructions for Git hooks and CI.
 */

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { generateSampleConfig } from '@secretshield/config';

export async function initCommand(options = {}) {
  const cwd = process.cwd();
  const configPath = resolve(cwd, '.secretshield.json');

  console.log('\n  SecretShield  v2.0  project initialization');
  console.log('  ───────────────────────────────────────────────────\n');

  if (existsSync(configPath) && !options.force) {
    console.log('  ⚠️  Configuration file already exists: .secretshield.json');
    console.log('     Use `secretshield init --force` to overwrite it.\n');
  } else {
    const configContent = generateSampleConfig({ severityThreshold: options.severity || 'low' });
    writeFileSync(configPath, configContent, 'utf8');
    console.log('  ✔ Created .secretshield.json with recommended developer defaults.\n');
  }

  console.log('  Next steps to secure your repository:');
  console.log('  ───────────────────────────────────────────────────');
  console.log('  1. Install Git Pre-Commit Hook:');
  console.log('     $ secretshield install-hook\n');
  console.log('  2. Scan current repository:');
  console.log('     $ secretshield scan .\n');
  console.log('  3. Create baseline for legacy findings:');
  console.log('     $ secretshield baseline create\n');
  console.log('  4. Set up CI/CD GitHub Action:');
  console.log('     Add .github/workflows/secretshield.yml to your repo.\n');

  return 0;
}
