/**
 * @file intelligence.test.js
 * @description Unit tests for Secret Introduction, Removal, Exposure Timeline, and Multi-Repo Correlation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { trackSecretIntroduction } from '../introduction-tracker.js';
import { trackSecretRemoval, partitionFindingsBySourcePresence } from '../removal-tracker.js';
import { buildExposureTimeline } from '../exposure-timeline.js';
import { correlateOrganizationFindings } from '../multi-repo.js';

describe('Repository Intelligence Layer', () => {
  it('trackSecretIntroduction generates factual, neutral attribution statement', () => {
    const finding = {
      fingerprint: 'fp_aws_123',
      commitHash: 'a1b2c3d4e5f67890',
      author: 'alice@example.com',
      commitDate: '2026-09-18',
      file: 'src/config.js',
      line: 42
    };

    const intro = trackSecretIntroduction(finding);
    assert.strictEqual(intro.firstSeenShortCommit, 'a1b2c3d');
    assert.strictEqual(intro.firstSeenAuthor, 'alice@example.com');
    assert.strictEqual(intro.firstSeenDate, '2026-09-18');
    assert.match(intro.introductionStatement, /Introduced in commit a1b2c3d on 2026-09-18 \(src\/config\.js\)/);
    // Ensure no judgmental language
    assert.doesNotMatch(intro.introductionStatement.toLowerCase(), /guilty|blame|worst|violator/);
  });

  it('trackSecretRemoval detects removed secret without claiming revoked', () => {
    const pastFinding = {
      fingerprint: 'fp_github_token_999',
      commitHash: 'c0ffee123456',
      firstSeenShortCommit: 'c0ffee1'
    };

    const currentHeadFindings = [
      { fingerprint: 'fp_other_key_111' }
    ];

    const removal = trackSecretRemoval(pastFinding, currentHeadFindings, 'f1xed456789');

    assert.strictEqual(removal.isRemovedFromCurrentSource, true);
    assert.strictEqual(removal.currentSourceStatus, 'REMOVED_FROM_CURRENT_SOURCE');
    assert.strictEqual(removal.detectedCommit, 'c0ffee1');
    assert.strictEqual(removal.removedCommit, 'f1xed45');
    assert.match(removal.statusSummary, /Detected: c0ffee1 \| Removed: f1xed45 \| Current source: Not detected/);
    assert.match(removal.advisoryNote, /ensure the credential is rotated/);
  });

  it('partitionFindingsBySourcePresence separates active and historical findings', () => {
    const historical = [
      { fingerprint: 'fp_1', ruleId: 'AWS_KEY' },
      { fingerprint: 'fp_2', ruleId: 'STRIPE_KEY' }
    ];
    const current = [
      { fingerprint: 'fp_1', ruleId: 'AWS_KEY' }
    ];

    const { activeInSource, removedFromSource } = partitionFindingsBySourcePresence(historical, current);

    assert.strictEqual(activeInSource.length, 1);
    assert.strictEqual(activeInSource[0].fingerprint, 'fp_1');
    assert.strictEqual(removedFromSource.length, 1);
    assert.strictEqual(removedFromSource[0].fingerprint, 'fp_2');
    assert.strictEqual(removedFromSource[0].isRemovedFromCurrentSource, true);
  });

  it('buildExposureTimeline builds structured timeline from first detected to removal', () => {
    const occurrences = [
      { commitHash: 'aaa1111', date: '2026-09-10', author: 'dev1', file: 'src/a.js', line: 10, ruleId: 'AWS_ACCESS_KEY_ID', maskedValue: 'AKIA••••1111' },
      { commitHash: 'bbb2222', date: '2026-09-15', author: 'dev2', file: 'src/a.js', line: 12, ruleId: 'AWS_ACCESS_KEY_ID', maskedValue: 'AKIA••••1111' }
    ];

    const timelineObj = buildExposureTimeline('fp_aws_demo', occurrences, false);

    assert.strictEqual(timelineObj.fingerprint, 'fp_aws_demo');
    assert.strictEqual(timelineObj.occurrencesCount, 2);
    assert.strictEqual(timelineObj.currentStatus, 'REMOVED_FROM_CURRENT_SOURCE');
    assert.strictEqual(timelineObj.firstDetectedCommit, 'aaa1111');
    assert.strictEqual(timelineObj.timeline.length, 3); // FIRST_DETECTED, OBSERVED_IN_COMMIT, REMOVED_FROM_SOURCE

    assert.strictEqual(timelineObj.timeline[0].eventType, 'FIRST_DETECTED');
    assert.strictEqual(timelineObj.timeline[1].eventType, 'OBSERVED_IN_COMMIT');
    assert.strictEqual(timelineObj.timeline[2].eventType, 'REMOVED_FROM_SOURCE');
  });

  it('correlateOrganizationFindings detects cross-repo reuse and isolates orgs', () => {
    const findings = [
      { organizationId: 'org_alpha', repositoryName: 'backend-service', fingerprint: 'fp_shared_key' },
      { organizationId: 'org_alpha', repositoryName: 'frontend-app', fingerprint: 'fp_shared_key' },
      { organizationId: 'org_alpha', repositoryName: 'infra-deploy', fingerprint: 'fp_shared_key' },
      { organizationId: 'org_beta', repositoryName: 'other-org-repo', fingerprint: 'fp_shared_key' } // Out of boundary
    ];

    const map = correlateOrganizationFindings(findings, 'org_alpha');
    const result = map.get('fp_shared_key');

    assert.ok(result);
    assert.strictEqual(result.repositoryCount, 3);
    assert.deepStrictEqual(result.repositoryNames, ['backend-service', 'frontend-app', 'infra-deploy']);
    assert.match(result.summary, /Detected across 3 repositories/);
  });
});
