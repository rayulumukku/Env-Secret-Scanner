/**
 * lib/auth/__tests__/auth.test.js
 *
 * Authentication, password hashing, and session management tests.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../password.js';
import { createSession, validateSession, invalidateSession } from '../session.js';
import { hasPermission, hasMinRole, ROLES } from '../rbac.js';
import { createUser } from '../../db/users.js';
import { checkRateLimit } from '../rate-limit.js';

describe('Password Hashing & Verification', () => {
  test('hashes password with salt and verifies correctly', async () => {
    const raw = 'superSecretPass123';
    const hash = await hashPassword(raw);

    assert.ok(hash.startsWith('scrypt$'), 'Hash should use scrypt format');
    assert.notStrictEqual(hash, raw, 'Hash should never equal raw password');

    const isValid = await verifyPassword(raw, hash);
    assert.strictEqual(isValid, true, 'Valid password must verify to true');

    const isWrong = await verifyPassword('wrongPassword123', hash);
    assert.strictEqual(isWrong, false, 'Wrong password must verify to false');
  });

  test('rejects short passwords under 8 characters', async () => {
    await assert.rejects(async () => {
      await hashPassword('short');
    }, /at least 8 characters/);
  });
});

describe('Session Management', () => {
  test('creates and validates session', async () => {
    const user = await createUser({
      email: 'session-test@example.com',
      passwordHash: 'dummy',
      name: 'Session Tester',
    });

    const { token, session } = await createSession(user.id);
    assert.ok(token, 'Session token must be generated');

    const validated = await validateSession(token);
    assert.ok(validated, 'Session must validate');
    assert.strictEqual(validated.user.email, 'session-test@example.com');
    assert.strictEqual(validated.user.passwordHash, undefined, 'passwordHash must never be exposed');

    // Invalidation
    await invalidateSession(token);
    const expired = await validateSession(token);
    assert.strictEqual(expired, null, 'Invalidated session must return null');
  });
});

describe('Role-Based Access Control (RBAC)', () => {
  test('owner has all permissions', () => {
    assert.strictEqual(hasPermission(ROLES.OWNER, 'ORG_DELETE'), true);
    assert.strictEqual(hasPermission(ROLES.OWNER, 'PROJECT_CREATE'), true);
    assert.strictEqual(hasPermission(ROLES.OWNER, 'SCAN_CREATE'), true);
    assert.strictEqual(hasPermission(ROLES.OWNER, 'RULE_MANAGE'), true);
  });

  test('admin can manage projects but not delete organization', () => {
    assert.strictEqual(hasPermission(ROLES.ADMIN, 'PROJECT_CREATE'), true);
    assert.strictEqual(hasPermission(ROLES.ADMIN, 'RULE_MANAGE'), true);
    assert.strictEqual(hasPermission(ROLES.ADMIN, 'ORG_DELETE'), false);
  });

  test('member can scan but not manage rules or org members', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'SCAN_CREATE'), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'FINDING_UPDATE'), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'RULE_MANAGE'), false);
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'ORG_MANAGE_MEMBERS'), false);
  });

  test('viewer has only read-only access', () => {
    assert.strictEqual(hasPermission(ROLES.VIEWER, 'PROJECT_VIEW'), true);
    assert.strictEqual(hasPermission(ROLES.VIEWER, 'FINDING_VIEW'), true);
    assert.strictEqual(hasPermission(ROLES.VIEWER, 'SCAN_CREATE'), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, 'FINDING_UPDATE'), false);
  });

  test('role hierarchy ranking', () => {
    assert.strictEqual(hasMinRole('OWNER', 'ADMIN'), true);
    assert.strictEqual(hasMinRole('ADMIN', 'MEMBER'), true);
    assert.strictEqual(hasMinRole('VIEWER', 'MEMBER'), false);
  });
});

describe('Rate Limiting', () => {
  test('tracks sliding window and blocks excessive attempts', () => {
    const key = 'test-ip-1';
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(key, 5, 1000);
      assert.strictEqual(res.allowed, true);
    }
    const blocked = checkRateLimit(key, 5, 1000);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.remaining, 0);
  });
});
