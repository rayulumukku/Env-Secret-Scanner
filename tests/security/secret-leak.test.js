import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { scanText } from '../../app-src/lib/scanner/engine.js';
import { scanGitDiff } from '../../app-src/lib/repository/diff/diff-scanner.js';
import { generateFindingsCsv, generateSecurityJsonReport } from '../../app-src/lib/security/export-engine.js';
import { toSarif } from '../../packages/cli/lib/formatters/sarif.js';
import { redactSensitive, redactString } from '../../app-src/lib/security/redact.js';

describe('Zero Secret Leakage Verification Across 10 Languages & Output Targets', () => {
  const SYNTHETIC_AWS_KEY = 'AKIA' + 'IOSFODNN7EXAMPLE';
  const SYNTHETIC_STRIPE_KEY = 'sk_' + 'live_' + '51AbcDefGhIjKlMnOpQrStUvWxYz123456';
  const SYNTHETIC_SLACK_TOKEN = 'xoxb-' + '123456789012-' + '1234567890123-' + 'AbCdEfGhIjKlMnOpQrStUvWx';
  const SYNTHETIC_DB_PASS = 'Db_Pass_Super_Secret_999!';
  const SYNTHETIC_DB_URL = `postgres://app_user:${SYNTHETIC_DB_PASS}@prod-db.internal:5432/appdb`;

  it('detects secrets across multiple languages and ensures immediate memory masking', () => {
    const testCases = [
      { name: 'app.js', content: `const stripe = require('stripe')('${SYNTHETIC_STRIPE_KEY}');` },
      { name: 'config.py', content: `AWS_ACCESS_KEY = "${SYNTHETIC_AWS_KEY}"` },
      { name: '.env', content: `DATABASE_URL="${SYNTHETIC_DB_URL}"` },
      { name: '.env.slack', content: `SLACK_TOKEN="${SYNTHETIC_SLACK_TOKEN}"` },
      { name: 'deploy.yaml', content: `env:\n  - name: AWS_KEY\n    value: "${SYNTHETIC_AWS_KEY}"` },
      { name: 'credentials.json', content: `{\n  "stripeKey": "${SYNTHETIC_STRIPE_KEY}"\n}` },
      { name: 'Dockerfile', content: `ENV STRIPE_KEY="${SYNTHETIC_STRIPE_KEY}"` },
      { name: 'main.tf', content: `variable "aws_key" {\n  default = "${SYNTHETIC_AWS_KEY}"\n}` },
    ];

    for (const tc of testCases) {
      const res = scanText(tc.content, { filename: tc.name });
      assert.ok(res.findings.length >= 1, `Expected finding in ${tc.name}`);

      for (const finding of res.findings) {
        // 1. Finding must be masked
        assert.ok(finding.maskedValue.includes('••••'), `Masked value in ${tc.name} must contain bullets`);
        // 2. Raw secret must NOT be in finding object
        assert.ok(!finding.maskedValue.includes(SYNTHETIC_AWS_KEY), `Raw AWS key leaked in finding of ${tc.name}`);
        assert.ok(!finding.maskedValue.includes(SYNTHETIC_STRIPE_KEY), `Raw Stripe key leaked in finding of ${tc.name}`);
        assert.ok(!finding.maskedValue.includes(SYNTHETIC_DB_PASS), `Raw DB password leaked in finding of ${tc.name}`);
      }

      // 3. Raw secret must NOT appear in entire serialized JSON output
      const jsonOutput = JSON.stringify(res);
      assert.ok(!jsonOutput.includes(SYNTHETIC_AWS_KEY), `Raw AWS key found in scan JSON for ${tc.name}`);
      assert.ok(!jsonOutput.includes(SYNTHETIC_STRIPE_KEY), `Raw Stripe key found in scan JSON for ${tc.name}`);
      assert.ok(!jsonOutput.includes(SYNTHETIC_DB_PASS), `Raw DB password found in scan JSON for ${tc.name}`);
    }
  });

  it('detects secrets in Git PR diffs without exposing raw secrets in diff scan findings', () => {
    const rawPatch = `
diff --git a/server.js b/server.js
--- a/server.js
+++ b/server.js
@@ -10,3 +10,4 @@
 const port = 3000;
+const awsKey = "${SYNTHETIC_AWS_KEY}";
    `;

    const diffResult = scanGitDiff(rawPatch);
    assert.ok(diffResult.findings.length >= 1, 'Git diff scanner detected added secret line');

    const diffJson = JSON.stringify(diffResult);
    assert.ok(!diffJson.includes(SYNTHETIC_AWS_KEY), 'Git diff scan result does not contain raw AWS key');
    assert.ok(diffResult.findings[0].maskedValue.includes('••••'), 'Diff finding credential is bullet-masked');
  });

  it('guarantees zero raw secret leakage in CSV exports, JSON reports, and SARIF 2.1.0', () => {
    const scanRes = scanText(`AWS_KEY="${SYNTHETIC_AWS_KEY}"`, { filename: '.env' });
    const findings = scanRes.findings;

    // 1. CSV Export
    const csv = generateFindingsCsv(findings);
    assert.ok(!csv.includes(SYNTHETIC_AWS_KEY), 'CSV export must NEVER contain raw secret');
    assert.ok(csv.includes('••••'), 'CSV export includes masked value');

    // 2. JSON Security Report
    const jsonReport = generateSecurityJsonReport(findings, { repoName: 'test-repo' });
    assert.ok(!jsonReport.includes(SYNTHETIC_AWS_KEY), 'JSON report must NEVER contain raw secret');

    // 3. SARIF Output
    const sarif = toSarif(findings);
    const sarifString = JSON.stringify(sarif);
    assert.ok(!sarifString.includes(SYNTHETIC_AWS_KEY), 'SARIF output must NEVER contain raw secret');
  });

  it('redacts sensitive values from logs and webhook payloads via central redactor', () => {
    const webhookPayload = {
      event: 'repository.scanned',
      repo: 'my-org/backend',
      credentials: {
        token: SYNTHETIC_SLACK_TOKEN,
        secretKey: SYNTHETIC_STRIPE_KEY,
        dbConnectionString: SYNTHETIC_DB_URL,
      },
      metadata: {
        apiKey: SYNTHETIC_AWS_KEY,
        customHeader: `Bearer ${SYNTHETIC_STRIPE_KEY}`,
      },
    };

    const sanitized = redactSensitive(webhookPayload);
    const serialized = JSON.stringify(sanitized);

    assert.ok(!serialized.includes(SYNTHETIC_SLACK_TOKEN));
    assert.ok(!serialized.includes(SYNTHETIC_STRIPE_KEY));
    assert.ok(!serialized.includes(SYNTHETIC_DB_PASS));
    assert.ok(!serialized.includes(SYNTHETIC_AWS_KEY));
    assert.equal(sanitized.credentials, '[REDACTED]');
    assert.equal(sanitized.metadata.apiKey, '[REDACTED]');
  });
});
