/**
 * lib/providers/common/__tests__/events.test.js
 *
 * Automated tests for internal repository event normalizer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGitHubEvent, normalizeGitLabEvent } from '../repository-events.js';

test('Repository Event Normalization', async (t) => {
  await t.test('normalizeGitHubEvent normalizes push event correctly', () => {
    const rawPush = {
      ref: 'refs/heads/feature/auth',
      after: 'c0ffee1234567890abcdef1234567890abcdef12',
      before: 'b45eb45e1234567890abcdef1234567890abcdef12',
      head_commit: { message: 'Add AWS auth' },
      repository: {
        id: 998877,
        name: 'secret-shield',
        full_name: 'acme/secret-shield',
        owner: { login: 'acme' },
      },
      sender: { login: 'alice' },
      commits: [
        { added: ['src/auth.js'], modified: ['config.json'], removed: [] },
      ],
      installation: { id: 112233 },
    };

    const normalized = normalizeGitHubEvent('push', rawPush);
    assert.equal(normalized.provider, 'github');
    assert.equal(normalized.eventType, 'push');
    assert.equal(normalized.branch, 'feature/auth');
    assert.equal(normalized.commit, 'c0ffee1234567890abcdef1234567890abcdef12');
    assert.equal(normalized.repositoryFullName, 'acme/secret-shield');
    assert.equal(normalized.author, 'alice');
    assert.equal(normalized.changedFiles.length, 2);
  });

  await t.test('normalizeGitHubEvent normalizes pull_request event correctly', () => {
    const rawPR = {
      action: 'opened',
      pull_request: {
        id: 554433,
        number: 42,
        title: 'Refactor database connections',
        head: { ref: 'feat/db', sha: '112233445566778899aabbccddeeff0011223344' },
        base: { ref: 'main', sha: 'aabbccddeeff00112233445566778899aabbccdd' },
        user: { login: 'bob' },
      },
      repository: {
        id: 998877,
        name: 'backend',
        full_name: 'acme/backend',
        owner: { login: 'acme' },
      },
      installation: { id: 112233 },
    };

    const normalized = normalizeGitHubEvent('pull_request', rawPR);
    assert.equal(normalized.provider, 'github');
    assert.equal(normalized.eventType, 'pull_request');
    assert.equal(normalized.pullRequestNumber, 42);
    assert.equal(normalized.pullRequestTitle, 'Refactor database connections');
    assert.equal(normalized.branch, 'feat/db');
    assert.equal(normalized.targetBranch, 'main');
    assert.equal(normalized.author, 'bob');
  });

  await t.test('normalizeGitLabEvent normalizes push event correctly', () => {
    const rawGitLabPush = {
      object_kind: 'push',
      ref: 'refs/heads/main',
      after: 'abcdef123456',
      before: '123456abcdef',
      project: {
        id: 456,
        name: 'api-service',
        path_with_namespace: 'group/api-service',
        namespace: 'group',
      },
      user_username: 'carol',
      commits: [
        { added: ['server.js'], modified: [], removed: [] },
      ],
    };

    const normalized = normalizeGitLabEvent('Push Hook', rawGitLabPush);
    assert.equal(normalized.provider, 'gitlab');
    assert.equal(normalized.eventType, 'push');
    assert.equal(normalized.branch, 'main');
    assert.equal(normalized.repositoryFullName, 'group/api-service');
    assert.equal(normalized.author, 'carol');
  });
});
