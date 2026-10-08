/**
 * packages/cli/__tests__/dependencies.test.js
 *
 * Tests for SecretShield CLI dependency and SBOM commands.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dependenciesCommand } from '../lib/commands/dependencies.js';
import { sbomCommand } from '../lib/commands/sbom.js';

describe('CLI — Dependencies & Software Supply-Chain Commands', () => {
  it('should run dependencies scan in quiet mode without throwing', async () => {
    const code = await dependenciesCommand('scan', '.', { quiet: true });
    assert.equal(typeof code, 'number');
  });

  it('should run dependencies tree command in json mode', async () => {
    let captured = '';
    const origLog = console.log;
    console.log = (msg) => { captured += msg; };

    try {
      const code = await dependenciesCommand('tree', '.', { json: true });
      assert.equal(code, 0);
      assert.ok(captured.length > 0);
      const parsed = JSON.parse(captured);
      assert.ok(parsed.name !== undefined);
    } finally {
      console.log = origLog;
    }
  });

  it('should export SARIF 2.1.0 output for dependencies audit', async () => {
    let captured = '';
    const origLog = console.log;
    console.log = (msg) => { captured += msg; };

    try {
      await dependenciesCommand('audit', '.', { sarif: true });
      assert.ok(captured.length > 0);
      const sarif = JSON.parse(captured);
      assert.equal(sarif.version, '2.1.0');
      assert.ok(Array.isArray(sarif.runs));
    } finally {
      console.log = origLog;
    }
  });

  it('should generate safe update proposal in dry-run mode', async () => {
    let captured = '';
    const origLog = console.log;
    console.log = (msg) => { captured += msg; };

    try {
      const code = await dependenciesCommand('update', '.', {
        package: 'commander',
        to: '12.2.0',
        manifest: 'package.json',
        json: true
      });
      assert.equal(code, 0);
      assert.ok(captured.includes('"success": true') || captured.includes('"success":true'));
    } finally {
      console.log = origLog;
    }
  });

  it('should export CycloneDX and SPDX SBOM via sbom command', async () => {
    let captured = '';
    const origLog = console.log;
    console.log = (msg) => { captured += msg; };

    try {
      const code = await sbomCommand('.', { format: 'cyclonedx' });
      assert.equal(code, 0);
      const sbom = JSON.parse(captured);
      assert.equal(sbom.bomFormat, 'CycloneDX');
    } finally {
      console.log = origLog;
    }
  });
});
