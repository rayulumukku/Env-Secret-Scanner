/**
 * lib/scanner/rule-packs/registry.js
 *
 * Rule Pack Registry for SecretShield.
 * Manages installed, custom, and community rule packs with version resolution and safety checks.
 */

import { validateRulePackManifest, validateRule } from '../../../../packages/rules/src/schema.js';
import { verifyPackIntegrity, computePackIntegrity } from './integrity.js';
import corePackJson from '../../../../packages/rules/core/pack.json' with { type: 'json' };
import communityPackJson from '../../../../packages/rules/community/pack.json' with { type: 'json' };

const CURRENT_SCANNER_VERSION = '2.0.0';

// In-memory registry store
const _installedPacks = new Map();
const _lockedVersions = new Map();
const _disabledPacks = new Set();

/**
 * Initialize built-in core and community packs.
 */
function initBuiltinPacks() {
  if (_installedPacks.size === 0) {
    // Core Pack
    const corePack = { ...corePackJson };
    corePack.integrity = computePackIntegrity(corePack);
    _installedPacks.set(corePack.id, {
      manifest: corePack,
      isBuiltin: true,
      enabled: true,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Community Pack (available but disabled until activated if desired, or enabled by default)
    const commPack = { ...communityPackJson };
    commPack.integrity = computePackIntegrity(commPack);
    _installedPacks.set(commPack.id, {
      manifest: commPack,
      isBuiltin: true,
      enabled: true,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

initBuiltinPacks();

/**
 * Compare two semver strings (returns 1 if a > b, -1 if a < b, 0 if equal).
 */
export function compareSemver(a, b) {
  const pa = (a || '0.0.0').split('.').map(Number);
  const pb = (b || '0.0.0').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/**
 * Verify compatibility of a manifest with current scanner version.
 */
export function checkCompatibility(manifest, scannerVersion = CURRENT_SCANNER_VERSION) {
  const minVersion = manifest.minimumScannerVersion || '1.0.0';
  const isCompatible = compareSemver(scannerVersion, minVersion) >= 0;
  return {
    compatible: isCompatible,
    currentScannerVersion: scannerVersion,
    minimumRequired: minVersion,
    error: isCompatible ? undefined : `Rule pack requires scanner version >= ${minVersion} (current: ${scannerVersion})`,
  };
}

/**
 * Register or install a new Rule Pack.
 * @param {object} manifest
 * @param {object} [options] - { verifyIntegrity: true, enabled: true, organizationId: null }
 */
export function registerRulePack(manifest, options = {}) {
  // 1. Validate manifest structure and rule safety
  const val = validateRulePackManifest(manifest);
  if (!val.valid) {
    throw new Error(`Manifest validation failed: ${val.errors.join('; ')}`);
  }

  // 2. Check compatibility
  const compat = checkCompatibility(manifest);
  if (!compat.compatible) {
    throw new Error(compat.error);
  }

  // 3. Verify integrity if declared
  if (options.verifyIntegrity !== false && manifest.integrity) {
    const integ = verifyPackIntegrity(manifest);
    if (!integ.valid) {
      throw new Error(`Pack integrity verification failed: ${integ.error}`);
    }
  }

  const packId = manifest.id;
  const existing = _installedPacks.get(packId);

  // Check version resolution if pack exists
  if (existing) {
    const locked = _lockedVersions.get(packId);
    if (locked && locked !== manifest.version) {
      throw new Error(`Rule pack '${packId}' is locked at version ${locked}. Unlock before installing version ${manifest.version}.`);
    }
  }

  const record = {
    manifest: { ...manifest, integrity: manifest.integrity || computePackIntegrity(manifest) },
    isBuiltin: Boolean(options.isBuiltin),
    enabled: options.enabled !== undefined ? Boolean(options.enabled) : true,
    organizationId: options.organizationId || null,
    installedAt: existing?.installedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  _installedPacks.set(packId, record);
  return record;
}

/**
 * List all installed rule packs.
 */
export function getInstalledPacks(filter = {}) {
  initBuiltinPacks();
  let list = Array.from(_installedPacks.values());

  if (filter.organizationId) {
    list = list.filter(p => !p.organizationId || p.organizationId === filter.organizationId);
  }
  if (filter.enabled !== undefined) {
    list = list.filter(p => p.enabled === filter.enabled);
  }

  return list.map(item => ({
    id: item.manifest.id,
    name: item.manifest.name,
    version: item.manifest.version,
    description: item.manifest.description,
    author: item.manifest.author,
    license: item.manifest.license,
    ruleCount: item.manifest.rules?.length || 0,
    isBuiltin: item.isBuiltin,
    enabled: item.enabled && !_disabledPacks.has(item.manifest.id),
    isLocked: _lockedVersions.has(item.manifest.id),
    lockedVersion: _lockedVersions.get(item.manifest.id) || null,
    installedAt: item.installedAt,
    updatedAt: item.updatedAt,
    integrity: item.manifest.integrity,
  }));
}

/**
 * Get a specific rule pack by ID.
 */
export function getPackById(packId) {
  initBuiltinPacks();
  const pack = _installedPacks.get(packId);
  if (!pack) return null;

  return {
    ...pack.manifest,
    isBuiltin: pack.isBuiltin,
    enabled: pack.enabled && !_disabledPacks.has(packId),
    isLocked: _lockedVersions.has(packId),
    lockedVersion: _lockedVersions.get(packId) || null,
    installedAt: pack.installedAt,
    updatedAt: pack.updatedAt,
  };
}

/**
 * Enable or disable a rule pack.
 */
export function setPackEnabled(packId, enabled) {
  const pack = _installedPacks.get(packId);
  if (!pack) {
    throw new Error(`Rule pack '${packId}' is not installed`);
  }
  pack.enabled = Boolean(enabled);
  if (enabled) {
    _disabledPacks.delete(packId);
  } else {
    _disabledPacks.add(packId);
  }
  return pack;
}

/**
 * Lock a rule pack to a specific version.
 */
export function lockPackVersion(packId, version) {
  const pack = _installedPacks.get(packId);
  if (!pack) {
    throw new Error(`Rule pack '${packId}' is not installed`);
  }
  if (version) {
    _lockedVersions.set(packId, version);
  } else {
    _lockedVersions.delete(packId);
  }
  return { packId, lockedVersion: version || null };
}

/**
 * Uninstall a rule pack.
 */
export function uninstallPack(packId) {
  const pack = _installedPacks.get(packId);
  if (!pack) {
    return false;
  }
  if (pack.isBuiltin && pack.manifest.id === 'core-rules') {
    throw new Error(`Cannot uninstall core built-in rule pack`);
  }
  _installedPacks.delete(packId);
  _lockedVersions.delete(packId);
  _disabledPacks.delete(packId);
  return true;
}

/**
 * Resolve all active rules across all enabled rule packs.
 * @param {object} [context] - { organizationId, projectId, disabledPackIds, disabledRuleIds }
 * @returns {object[]} Resolved rules with rulePack metadata
 */
export function resolveActiveRules(context = {}) {
  initBuiltinPacks();
  const rules = [];
  const seenRuleIds = new Map(); // ruleId -> rule

  const disabledPacks = new Set([..._disabledPacks, ...(context.disabledPackIds || [])]);
  const disabledRules = new Set(context.disabledRuleIds || []);

  for (const packRecord of _installedPacks.values()) {
    const manifest = packRecord.manifest;
    if (disabledPacks.has(manifest.id) || !packRecord.enabled) {
      continue;
    }

    if (context.organizationId && packRecord.organizationId && packRecord.organizationId !== context.organizationId) {
      continue;
    }

    for (const rule of (manifest.rules || [])) {
      if (disabledRules.has(rule.id)) {
        continue;
      }

      const decoratedRule = {
        ...rule,
        rulePackId: manifest.id,
        rulePackName: manifest.name,
        rulePackVersion: manifest.version,
        ruleVersion: rule.version || manifest.version || '1.0.0',
        scannerVersion: CURRENT_SCANNER_VERSION,
      };

      // If duplicate rule ID across packs, higher priority / first loaded wins
      if (!seenRuleIds.has(rule.id)) {
        seenRuleIds.set(rule.id, decoratedRule);
        rules.push(decoratedRule);
      }
    }
  }

  return rules;
}
