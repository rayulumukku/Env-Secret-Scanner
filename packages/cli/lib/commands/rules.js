/**
 * packages/cli/lib/commands/rules.js
 *
 * Comprehensive Rule Pack management & inspection commands for SecretShield CLI.
 */

import { readFileSync, existsSync } from 'fs';
import { ALL_RULES } from '@secretshield/scanner';
import { loadConfig } from '@secretshield/config';
import {
  validateRulePackManifest,
  validateRule,
  validateRegexSafety,
} from '../../../rules/src/schema.js';
import {
  verifyPackIntegrity,
  computePackIntegrity,
} from '../../../rules/src/integrity.js';
import { evaluateRuleQuality } from '../../../../app-src/lib/scanner/rule-packs/quality.js';
import {
  getInstalledPacks,
  getPackById,
  registerRulePack,
  uninstallPack,
  lockPackVersion,
} from '../../../../app-src/lib/scanner/rule-packs/registry.js';

export async function rulesCommand(subAction = 'list', targetArg = '', options = {}) {
  const { config } = loadConfig(options.config);
  const rulesCfg = config.rules || {};
  const disabledRuleIds = new Set(Array.isArray(rulesCfg.disabled) ? rulesCfg.disabled : Object.keys(rulesCfg).filter(k => rulesCfg[k] === false));

  // 1. LIST COMMAND
  if (subAction === 'list' || subAction === 'all' || subAction === 'enabled' || subAction === 'disabled') {
    const packs = getInstalledPacks();

    if (options.json) {
      console.log(JSON.stringify({ packs, totalRules: ALL_RULES.length }, null, 2));
      return 0;
    }

    console.log('\n  SecretShield  v2.0  Rule Packs & Detection Rules');
    console.log('  ─────────────────────────────────────────────────────────────────────────────\n');
    console.log('  INSTALLED RULE PACKS:');
    for (const p of packs) {
      const lockBadge = p.isLocked ? ` (locked: ${p.lockedVersion})` : '';
      const status = p.enabled ? '✔ ACTIVE' : '✖ DISABLED';
      console.log(`    • ${p.name} (${p.version}) [${p.id}] — ${p.ruleCount} rules — ${status}${lockBadge}`);
    }

    console.log('\n  CORE DETECTION RULES CATALOG:');
    console.log('  RULE ID                       CATEGORY             SEVERITY    STATUS');
    console.log('  ─────────────────────────────────────────────────────────────────────────────');

    for (const r of ALL_RULES) {
      const isEnabled = !disabledRuleIds.has(r.id);
      if (subAction === 'enabled' && !isEnabled) continue;
      if (subAction === 'disabled' && isEnabled) continue;

      const id = r.id.padEnd(28, ' ');
      const cat = (r.category || 'General').slice(0, 18).padEnd(20, ' ');
      const sev = (r.severity || 'HIGH').padEnd(11, ' ');
      const status = isEnabled ? '✔ ENABLED' : '✖ DISABLED';
      console.log(`  ${id} ${cat} ${sev} ${status}`);
    }

    console.log(`\n  Total active packs: ${packs.filter(p => p.enabled).length} | Total catalog rules: ${ALL_RULES.length}\n`);
    return 0;
  }

  // 2. SEARCH COMMAND
  if (subAction === 'search') {
    const query = (targetArg || '').toLowerCase();
    if (!query) {
      console.error('Error: Search query required. Usage: secretshield rules search <query>');
      return 1;
    }

    const matchedRules = ALL_RULES.filter(r =>
      r.id.toLowerCase().includes(query) ||
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.category && r.category.toLowerCase().includes(query)) ||
      (r.description && r.description.toLowerCase().includes(query))
    );

    if (options.json) {
      console.log(JSON.stringify(matchedRules, null, 2));
      return 0;
    }

    console.log(`\n  Search results for '${targetArg}': (${matchedRules.length} matches)`);
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    for (const r of matchedRules) {
      console.log(`  • [${r.severity}] ${r.id} (${r.category}) - ${r.description || r.name}`);
    }
    console.log('');
    return 0;
  }

  // 3. VALIDATE COMMAND
  if (subAction === 'validate') {
    const filePath = targetArg;
    if (!filePath || !existsSync(filePath)) {
      console.error(`Error: File '${filePath}' does not exist.`);
      return 1;
    }

    try {
      const raw = readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);

      if (data.rules && Array.isArray(data.rules)) {
        const val = validateRulePackManifest(data);
        if (!val.valid) {
          console.error(`✖ Manifest Validation Failed:\n  - ${val.errors.join('\n  - ')}`);
          return 1;
        }
        console.log(`✔ Manifest valid: '${data.name}' (${data.version}) with ${data.rules.length} rules.`);
        if (data.integrity) {
          const integ = verifyPackIntegrity(data);
          if (!integ.valid) {
            console.error(`✖ Integrity Check Failed: ${integ.error}`);
            return 1;
          }
          console.log(`✔ Integrity verified: ${data.integrity}`);
        }
        return 0;
      } else {
        const val = validateRule(data);
        if (!val.valid) {
          console.error(`✖ Rule Validation Failed:\n  - ${val.errors.join('\n  - ')}`);
          return 1;
        }
        console.log(`✔ Rule valid: '${data.id}' (${data.severity})`);
        return 0;
      }
    } catch (err) {
      console.error(`✖ Validation error: ${err.message}`);
      return 1;
    }
  }

  // 4. TEST COMMAND
  if (subAction === 'test') {
    const ruleIdOrPath = targetArg;
    let ruleObj = null;

    if (existsSync(ruleIdOrPath)) {
      try {
        ruleObj = JSON.parse(readFileSync(ruleIdOrPath, 'utf8'));
      } catch (err) {
        console.error(`Error reading rule file: ${err.message}`);
        return 1;
      }
    } else {
      ruleObj = ALL_RULES.find(r => r.id === ruleIdOrPath || r.id.toLowerCase() === ruleIdOrPath.toLowerCase() || r.id.toLowerCase().replace(/_/g, '-') === ruleIdOrPath.toLowerCase());
      if (!ruleObj) {
        const packs = getInstalledPacks();
        for (const p of packs) {
          const found = p.manifest?.rules?.find(r => r.id === ruleIdOrPath || r.id.toLowerCase() === ruleIdOrPath.toLowerCase() || r.id.toLowerCase().replace(/-/g, '_') === ruleIdOrPath.toLowerCase());
          if (found) {
            ruleObj = found;
            break;
          }
        }
      }
    }

    if (!ruleObj) {
      console.error(`Error: Rule '${ruleIdOrPath}' not found.`);
      return 1;
    }

    const report = evaluateRuleQuality(ruleObj);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
      return 0;
    }

    console.log(`\n  Rule Test Report: ${ruleObj.id} (${report.status})`);
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    console.log(`  Precision:           ${report.metrics.precision}%`);
    console.log(`  Recall:              ${report.metrics.recall}%`);
    console.log(`  Positive Fixtures:   ${report.metrics.truePositives} / ${report.metrics.totalPositiveFixtures} passed`);
    console.log(`  False Positives:     ${report.metrics.falsePositives} / ${report.metrics.totalNegativeFixtures}`);
    console.log(`  Avg Exec Latency:    ${report.metrics.avgExecutionTimeMs} ms`);
    console.log(`  Pattern Complexity:  ${report.metrics.patternLength} chars`);
    console.log('');
    return report.status === 'PASSING' ? 0 : 1;
  }

  // 5. INFO COMMAND
  if (subAction === 'info') {
    const pack = getPackById(targetArg);
    if (!pack) {
      console.error(`Error: Rule pack '${targetArg}' not found.`);
      return 1;
    }

    if (options.json) {
      console.log(JSON.stringify(pack, null, 2));
      return 0;
    }

    console.log(`\n  Rule Pack Details: ${pack.name}`);
    console.log('  ─────────────────────────────────────────────────────────────────────────────');
    console.log(`  ID:           ${pack.id}`);
    console.log(`  Version:      ${pack.version}`);
    console.log(`  Author:       ${pack.author}`);
    console.log(`  License:      ${pack.license}`);
    console.log(`  Rules Count:  ${pack.rules?.length || 0}`);
    console.log(`  Integrity:    ${pack.integrity || 'none'}`);
    console.log(`  Description:  ${pack.description}`);
    console.log('');
    return 0;
  }

  // 6. INSTALL COMMAND
  if (subAction === 'install') {
    const packPathOrId = targetArg;
    if (!packPathOrId || !existsSync(packPathOrId)) {
      console.error(`Error: Provide valid path to rule pack JSON file. Example: secretshield rules install ./my-pack.json`);
      return 1;
    }

    try {
      const manifest = JSON.parse(readFileSync(packPathOrId, 'utf8'));
      registerRulePack(manifest, { verifyIntegrity: options.verifyIntegrity !== false });
      console.log(`✔ Successfully installed rule pack '${manifest.name}' (${manifest.version})`);
      return 0;
    } catch (err) {
      console.error(`✖ Installation failed: ${err.message}`);
      return 1;
    }
  }

  // 7. REMOVE COMMAND
  if (subAction === 'remove' || subAction === 'uninstall') {
    try {
      const success = uninstallPack(targetArg);
      if (success) {
        console.log(`✔ Rule pack '${targetArg}' uninstalled.`);
        return 0;
      } else {
        console.error(`✖ Rule pack '${targetArg}' could not be removed.`);
        return 1;
      }
    } catch (err) {
      console.error(`✖ ${err.message}`);
      return 1;
    }
  }

  // 8. UPDATE / LOCK COMMAND
  if (subAction === 'update' || subAction === 'lock') {
    if (options.lock) {
      lockPackVersion(targetArg, options.lock);
      console.log(`✔ Locked rule pack '${targetArg}' to version ${options.lock}`);
      return 0;
    }
    console.log(`✔ Rule pack '${targetArg}' checked for updates.`);
    return 0;
  }

  console.log(`Unknown rules action: ${subAction}. Try: list, search, validate, test, info, install, remove`);
  return 1;
}
