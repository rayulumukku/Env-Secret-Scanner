import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from '../../../app-src/lib/scanner/engine.js';

describe('Scanner Regression Suite: Multi-Language Syntax Support', () => {
  const KEY = 'AKIAIOSFODNN7EXAMPLE';

  it('scans JavaScript / TypeScript code', () => {
    const code = `export const awsKey: string = "${KEY}";`;
    const res = scanText(code, { filename: 'config.ts' });
    assert.ok(res.findings.length >= 1);
  });

  it('scans Python assignment syntax', () => {
    const code = `AWS_KEY: str = "${KEY}"`;
    const res = scanText(code, { filename: 'settings.py' });
    assert.ok(res.findings.length >= 1);
  });

  it('scans YAML configuration structures', () => {
    const code = `services:\n  backend:\n    environment:\n      AWS_ACCESS_KEY: "${KEY}"`;
    const res = scanText(code, { filename: 'docker-compose.yml' });
    assert.ok(res.findings.length >= 1);
  });

  it('scans JSON payload data', () => {
    const code = JSON.stringify({ credentials: { aws_access_key_id: KEY } }, null, 2);
    const res = scanText(code, { filename: 'creds.json' });
    assert.ok(res.findings.length >= 1);
  });

  it('scans Dockerfile directives', () => {
    const code = `FROM node:20\nENV AWS_ACCESS_KEY_ID=${KEY}\nRUN npm start`;
    const res = scanText(code, { filename: 'Dockerfile' });
    assert.ok(res.findings.length >= 1);
  });

  it('scans Terraform / HCL variable files', () => {
    const code = `variable "aws_access_key" {\n  type = string\n  default = "${KEY}"\n}`;
    const res = scanText(code, { filename: 'variables.tf' });
    assert.ok(res.findings.length >= 1);
  });

  it('scans Shell script exports', () => {
    const code = `#!/usr/bin/env bash\nexport AWS_ACCESS_KEY_ID="${KEY}"\n./run.sh`;
    const res = scanText(code, { filename: 'deploy.sh' });
    assert.ok(res.findings.length >= 1);
  });
});
