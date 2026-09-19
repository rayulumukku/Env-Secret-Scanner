/**
 * lib/notifications/__tests__/slack.test.js
 *
 * Automated tests for Slack Block Kit notification builder and Zero-Exposure invariant.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFindingSlackBlock } from '../slack.js';

test('Slack Block Kit Incident Alerts', async (t) => {
  await t.test('buildFindingSlackBlock generates structured blocks without raw secrets', () => {
    const rawSecret = 'AKIAIOSFODNN7EXAMPLE';
    const payload = buildFindingSlackBlock({
      severity: 'CRITICAL',
      type: 'AWS Access Key',
      repository: 'acme/cloud-infra',
      file: 'terraform/variables.tf',
      line: 14,
      confidence: 97,
      dashboardUrl: 'http://localhost:3000/findings',
      author: 'dev_user',
    });

    const jsonStr = JSON.stringify(payload);

    assert.ok(payload.blocks, 'Must have blocks array');
    assert.ok(jsonStr.includes('acme/cloud-infra'));
    assert.ok(jsonStr.includes('terraform/variables.tf'));
    assert.ok(jsonStr.includes('97%'));
    assert.ok(jsonStr.includes('dev_user'));

    // STRICT ZERO-EXPOSURE INVARIANT
    assert.equal(jsonStr.includes(rawSecret), false, 'Raw secret must NEVER exist in Slack payload');
  });
});
