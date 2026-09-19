/**
 * packages/cli/lib/commands/rules.js
 *
 * Inspect and display available SecretShield detection rules.
 * Supports filtering by enabled/disabled status from workspace configuration.
 */

import { ALL_RULES } from '@secretshield/scanner';
import { loadConfig } from '@secretshield/config';

export async function rulesCommand(filterMode = 'all', options = {}) {
  const { config } = loadConfig(options.config);
  const ruleConfig = config.rules || {};

  const rulesWithStatus = ALL_RULES.map(rule => {
    const isExplicitlyDisabled = ruleConfig[rule.id] === false || ruleConfig[rule.type] === false;
    const isEnabled = !isExplicitlyDisabled;
    return {
      id: rule.id,
      name: rule.name,
      category: rule.category || 'General',
      severity: rule.severity || 'MEDIUM',
      status: isEnabled ? 'ENABLED' : 'DISABLED',
      isProviderRule: !!rule.isProviderRule,
    };
  });

  let filtered = rulesWithStatus;
  if (filterMode === 'enabled') {
    filtered = rulesWithStatus.filter(r => r.status === 'ENABLED');
  } else if (filterMode === 'disabled') {
    filtered = rulesWithStatus.filter(r => r.status === 'DISABLED');
  }

  if (options.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return 0;
  }

  console.log('\n  SecretShield  v2.0  detection rules catalog');
  console.log('  ─────────────────────────────────────────────────────────────────────────────\n');

  console.log('  RULE ID                       CATEGORY             SEVERITY    STATUS');
  console.log('  ─────────────────────────────────────────────────────────────────────────────');

  for (const r of filtered) {
    const id = r.id.padEnd(28, ' ');
    const cat = r.category.slice(0, 18).padEnd(20, ' ');
    const sev = r.severity.padEnd(11, ' ');
    const status = r.status === 'ENABLED' ? '✔ ENABLED' : '✖ DISABLED';
    console.log(`  ${id} ${cat} ${sev} ${status}`);
  }

  console.log('\n  Total rules: ' + filtered.length + ' (' + filterMode + ')\n');
  return 0;
}
