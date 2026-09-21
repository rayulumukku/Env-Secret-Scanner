import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerRulePack,
  getInstalledPacks,
  getPackById,
  setPackEnabled,
  lockPackVersion,
  uninstallPack,
  resolveActiveRules,
  checkCompatibility,
  compareSemver,
} from '../../../app-src/lib/scanner/rule-packs/registry.js';
import { computePackIntegrity } from '../src/integrity.js';

describe('@secretshield/rules — Rule Pack Registry & Version Resolution', () => {
  it('should list built-in core and community packs by default', () => {
    const packs = getInstalledPacks();
    assert.ok(packs.length >= 2, 'Expected at least core and community packs installed');
    const core = packs.find(p => p.id === 'core-rules');
    assert.ok(core, 'core-rules pack should be present');
    assert.strictEqual(core.isBuiltin, true);
    assert.strictEqual(core.enabled, true);
  });

  it('should compare semver strings accurately', () => {
    assert.strictEqual(compareSemver('2.0.0', '1.0.0'), 1);
    assert.strictEqual(compareSemver('1.0.0', '2.0.0'), -1);
    assert.strictEqual(compareSemver('1.2.3', '1.2.3'), 0);
    assert.strictEqual(compareSemver('1.2.0', '1.1.9'), 1);
  });

  it('should check compatibility against scanner version', () => {
    const manifest = {
      id: 'test-compat',
      name: 'Test Compatibility',
      version: '1.0.0',
      minimumScannerVersion: '1.5.0',
    };
    const check1 = checkCompatibility(manifest, '2.0.0');
    assert.strictEqual(check1.compatible, true);

    const check2 = checkCompatibility(manifest, '1.0.0');
    assert.strictEqual(check2.compatible, false);
    assert.ok(check2.error.includes('requires scanner version >= 1.5.0'));
  });

  it('should register, lock version, and uninstall a custom rule pack', () => {
    const customPack = {
      id: 'org-internal-pack',
      name: 'Org Internal Rules',
      version: '1.0.0',
      description: 'Private organization tokens',
      author: 'Security Admin',
      license: 'Internal',
      minimumScannerVersion: '1.0.0',
      rules: [
        {
          id: 'corp-auth-token-1',
          name: 'Corp Auth Token',
          description: 'Internal auth token',
          provider: 'Internal',
          category: 'Authentication',
          severity: 'HIGH',
          confidence: 90,
          version: '1.0.0',
          author: 'Security Admin',
          license: 'Internal',
          patterns: ['corp_auth_[A-Za-z0-9]{24}'],
          testFixtures: {
            positive: ['CORP_AUTH=corp_auth_111122223333444455556666'],
            negative: ['CORP_AUTH=corp_auth_short'],
          },
        },
      ],
    };

    customPack.integrity = computePackIntegrity(customPack);

    // 1. Register
    const reg = registerRulePack(customPack, { verifyIntegrity: true });
    assert.strictEqual(reg.manifest.id, 'org-internal-pack');

    // 2. Fetch by ID
    const retrieved = getPackById('org-internal-pack');
    assert.ok(retrieved);
    assert.strictEqual(retrieved.name, 'Org Internal Rules');

    // 3. Lock version
    lockPackVersion('org-internal-pack', '1.0.0');
    const lockedPacks = getInstalledPacks();
    const lockedPack = lockedPacks.find(p => p.id === 'org-internal-pack');
    assert.strictEqual(lockedPack.isLocked, true);
    assert.strictEqual(lockedPack.lockedVersion, '1.0.0');

    // Attempting to install version 2.0.0 while locked to 1.0.0 should fail
    const v2Pack = { ...customPack, version: '2.0.0' };
    v2Pack.integrity = computePackIntegrity(v2Pack);
    assert.throws(
      () => registerRulePack(v2Pack),
      /locked at version 1.0.0/
    );

    // Unlock version
    lockPackVersion('org-internal-pack', null);

    // 4. Disable and Enable
    setPackEnabled('org-internal-pack', false);
    assert.strictEqual(getPackById('org-internal-pack').enabled, false);

    setPackEnabled('org-internal-pack', true);
    assert.strictEqual(getPackById('org-internal-pack').enabled, true);

    // 5. Resolve active rules
    const activeRules = resolveActiveRules();
    const foundRule = activeRules.find(r => r.id === 'corp-auth-token-1');
    assert.ok(foundRule, 'Custom rule should appear in active resolved rules');
    assert.strictEqual(foundRule.rulePackId, 'org-internal-pack');
    assert.strictEqual(foundRule.ruleVersion, '1.0.0');

    // 6. Uninstall
    const uninstalled = uninstallPack('org-internal-pack');
    assert.strictEqual(uninstalled, true);
    assert.strictEqual(getPackById('org-internal-pack'), null);
  });

  it('should prevent uninstallation of core built-in rule pack', () => {
    assert.throws(
      () => uninstallPack('core-rules'),
      /Cannot uninstall core built-in/
    );
  });

  it('should isolate rules by organizationId when filtering active rules', () => {
    const org1Pack = {
      id: 'org-alpha-pack',
      name: 'Alpha Rules',
      version: '1.0.0',
      description: 'Alpha team',
      author: 'Alpha',
      license: 'MIT',
      minimumScannerVersion: '1.0.0',
      rules: [
        {
          id: 'alpha-secret-rule',
          name: 'Alpha Rule',
          description: 'Alpha only',
          provider: 'Alpha',
          category: 'Cloud',
          severity: 'HIGH',
          confidence: 90,
          version: '1.0.0',
          patterns: ['alpha_[a-z0-9]{16}'],
        },
      ],
    };
    org1Pack.integrity = computePackIntegrity(org1Pack);
    registerRulePack(org1Pack, { organizationId: 'org_alpha' });

    // Scoped resolution for org_alpha should contain alpha-secret-rule
    const alphaRules = resolveActiveRules({ organizationId: 'org_alpha' });
    assert.ok(alphaRules.some(r => r.id === 'alpha-secret-rule'));

    // Scoped resolution for org_beta should NOT contain alpha-secret-rule
    const betaRules = resolveActiveRules({ organizationId: 'org_beta' });
    assert.ok(!betaRules.some(r => r.id === 'alpha-secret-rule'));

    // Cleanup
    uninstallPack('org-alpha-pack');
  });
});
