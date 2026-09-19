/**
 * __tests__/sarif.test.js
 *
 * SARIF output tests.
 * All test credentials are SYNTHETIC and non-functional.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toSarif, validateSarif } from '../lib/formatters/sarif.js';
import { createFinding } from '../../../app-src/lib/models/index.js';

// Synthetic test finding — non-functional
function makeFinding(overrides = {}) {
  return {
    id:          'test-finding-1',
    ruleId:      'AWS_ACCESS_KEY_ID',
    type:        'AWS_ACCESS_KEY_ID',
    category:    'Cloud Credentials',
    severity:    'CRITICAL',
    confidence:  80,
    file:        'src/config.js',
    line:        42,
    column:      9,
    maskedValue: 'AKIA••••••••••••••••',
    description: 'AWS Access Key ID detected',
    fingerprint: 'aabbccdd11223344aabbccdd11223344',
    ...overrides,
  };
}

describe('SARIF formatter', () => {
  test('produces valid SARIF 2.1.0 structure', () => {
    const findings = [makeFinding()];
    const sarif    = toSarif(findings);
    const { valid, errors } = validateSarif(sarif);
    assert.ok(valid, `SARIF validation failed: ${errors.join(', ')}`);
  });

  test('produces valid SARIF with empty findings', () => {
    const sarif = toSarif([]);
    const { valid, errors } = validateSarif(sarif);
    assert.ok(valid, `SARIF validation failed: ${errors.join(', ')}`);
  });

  test('SARIF schema version is 2.1.0', () => {
    const sarif = JSON.parse(toSarif([makeFinding()]));
    assert.strictEqual(sarif.version, '2.1.0');
  });

  test('SARIF tool name is SecretShield', () => {
    const sarif = JSON.parse(toSarif([makeFinding()]));
    assert.strictEqual(sarif.runs[0].tool.driver.name, 'SecretShield');
  });

  test('SARIF result has correct ruleId', () => {
    const sarif = JSON.parse(toSarif([makeFinding()]));
    assert.strictEqual(sarif.runs[0].results[0].ruleId, 'AWS_ACCESS_KEY_ID');
  });

  test('SARIF result location has correct file', () => {
    const sarif = JSON.parse(toSarif([makeFinding()]));
    const loc   = sarif.runs[0].results[0].locations[0];
    assert.strictEqual(loc.physicalLocation.artifactLocation.uri, 'src/config.js');
  });

  test('SARIF result location has correct line', () => {
    const sarif = JSON.parse(toSarif([makeFinding()]));
    const region = sarif.runs[0].results[0].locations[0].physicalLocation.region;
    assert.strictEqual(region.startLine, 42);
  });

  test('SARIF result has no rawValue field', () => {
    const findingWithRaw = { ...makeFinding(), rawValue: 'AKIAREALSECRET12345' };
    const sarif = JSON.parse(toSarif([findingWithRaw]));
    const props = sarif.runs[0].results[0].properties;
    assert.ok(!('rawValue' in props), 'SARIF must not contain rawValue');
  });

  test('SARIF result has fingerprint', () => {
    const sarif = JSON.parse(toSarif([makeFinding()]));
    const result = sarif.runs[0].results[0];
    assert.ok(result.fingerprints?.['secretshield/v1'], 'SARIF result must have fingerprint');
  });

  test('SARIF result has maskedValue in properties', () => {
    const sarif = JSON.parse(toSarif([makeFinding()]));
    const props = sarif.runs[0].results[0].properties;
    assert.ok(props.maskedValue, 'SARIF should include maskedValue');
  });

  test('SARIF CRITICAL maps to error level', () => {
    const sarif = JSON.parse(toSarif([makeFinding({ severity: 'CRITICAL' })]));
    assert.strictEqual(sarif.runs[0].results[0].level, 'error');
  });

  test('SARIF HIGH maps to error level', () => {
    const sarif = JSON.parse(toSarif([makeFinding({ severity: 'HIGH' })]));
    assert.strictEqual(sarif.runs[0].results[0].level, 'error');
  });

  test('SARIF MEDIUM maps to warning level', () => {
    const sarif = JSON.parse(toSarif([makeFinding({ severity: 'MEDIUM' })]));
    assert.strictEqual(sarif.runs[0].results[0].level, 'warning');
  });

  test('SARIF LOW maps to note level', () => {
    const sarif = JSON.parse(toSarif([makeFinding({ severity: 'LOW' })]));
    assert.strictEqual(sarif.runs[0].results[0].level, 'note');
  });

  test('SARIF deduplicates rules for same ruleId', () => {
    const findings = [
      makeFinding({ file: 'a.js' }),
      makeFinding({ file: 'b.js' }),  // same ruleId
    ];
    const sarif = JSON.parse(toSarif(findings));
    assert.strictEqual(sarif.runs[0].tool.driver.rules.length, 1);
    assert.strictEqual(sarif.runs[0].results.length, 2);
  });

  test('validateSarif detects missing runs array', () => {
    const { valid, errors } = validateSarif(JSON.stringify({ version: '2.1.0' }));
    assert.ok(!valid);
    assert.ok(errors.some(e => e.includes('runs')));
  });

  test('validateSarif detects wrong version', () => {
    const sarif = { version: '1.0.0', runs: [{ tool: { driver: { name: 'test' } }, results: [] }] };
    const { valid, errors } = validateSarif(sarif);
    assert.ok(!valid);
    assert.ok(errors.some(e => e.includes('2.1.0')));
  });

  test('validateSarif detects rawValue in properties', () => {
    const sarif = {
      version: '2.1.0',
      runs: [{
        tool: { driver: { name: 'SecretShield' } },
        results: [{ properties: { rawValue: 'SECRETVALUE' } }],
      }],
    };
    const { valid, errors } = validateSarif(sarif);
    assert.ok(!valid);
    assert.ok(errors.some(e => e.includes('rawValue')));
  });

  test('SARIF handles windows backslash paths', () => {
    const finding = makeFinding({ file: 'src\\config\\aws.js' });
    const sarif = JSON.parse(toSarif([finding]));
    const uri = sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri;
    assert.ok(!uri.includes('\\'), 'SARIF URIs must use forward slashes');
  });

  test('SARIF with repo URI includes versionControlProvenance', () => {
    const sarif = JSON.parse(toSarif([makeFinding()], {
      repoUri: 'https://github.com/owner/repo',
      commitSha: 'abc1234def5678',
    }));
    assert.ok(sarif.runs[0].versionControlProvenance, 'Should have versionControlProvenance');
    assert.strictEqual(
      sarif.runs[0].versionControlProvenance[0].repositoryUri,
      'https://github.com/owner/repo'
    );
  });
});
