/**
 * packages/copilot/__tests__/final-security-gate.test.js
 *
 * Final Production Security Gate Tests.
 *
 * Covers:
 *   1. RBAC & Authorization Matrix
 *   2. Tenant Isolation & IDOR Protection
 *   3. Environment Variable Safety Boundaries
 *   4. Zero-Leak Invariants across Exports & Reports
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { hasPermission, enforceTenantAccess, ROLES } from '../../../app-src/lib/security/auth-matrix.js';
import { validateEnvironment, getPublicConfig } from '../../../app-src/lib/env.js';
import { redactSecrets, maskSecretValue, sanitizeDataDeep } from '../redaction/index.js';

describe('Final Security Gate — RBAC & Authorization Matrix', () => {
  it('should allow Owner and Admin to manage policies, but disallow Viewer from modifying', () => {
    assert.strictEqual(hasPermission(ROLES.OWNER, 'policies', 'create'), true);
    assert.strictEqual(hasPermission(ROLES.ADMIN, 'policies', 'create'), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'policies', 'create'), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, 'policies', 'create'), false);
    assert.strictEqual(hasPermission(ROLES.VIEWER, 'policies', 'view'), true);
  });

  it('should allow Members to trigger scans and execute remediation fixes, but deny deleting orgs', () => {
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'scans', 'trigger'), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'remediation', 'execute_fix'), true);
    assert.strictEqual(hasPermission(ROLES.MEMBER, 'organization', 'delete_org'), false);
    assert.strictEqual(hasPermission(ROLES.OWNER, 'organization', 'delete_org'), true);
  });
});

describe('Final Security Gate — Tenant Isolation & IDOR Guards', () => {
  it('should reject operations where user organization does not match resource organization', () => {
    const userContext = { orgId: 'org_acme_corp', role: 'ADMIN' };
    const validTargetOrg = 'org_acme_corp';
    const attackerTargetOrg = 'org_victim_corp';

    const validCheck = enforceTenantAccess(userContext, validTargetOrg);
    assert.strictEqual(validCheck.authorized, true);

    const crossTenantCheck = enforceTenantAccess(userContext, attackerTargetOrg);
    assert.strictEqual(crossTenantCheck.authorized, false);
    assert.ok(crossTenantCheck.error.includes('Cross-tenant operation rejected'));
  });

  it('should reject access if user context is missing orgId', () => {
    const unauthenticated = enforceTenantAccess({}, 'org_acme_corp');
    assert.strictEqual(unauthenticated.authorized, false);
    assert.ok(unauthenticated.error.includes('Authentication required'));
  });
});

describe('Final Security Gate — Environment Variable Boundary', () => {
  it('should detect and flag any secret key leaked via NEXT_PUBLIC_ prefix', () => {
    const maliciousEnv = {
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_URL: 'https://api.secretshield.dev',
      NEXT_PUBLIC_ADMIN_SECRET: 'super_secret_leak_12345'
    };

    const res = validateEnvironment(maliciousEnv);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('NEXT_PUBLIC_ADMIN_SECRET')));
  });

  it('should expose only safe public configuration without internal secrets', () => {
    const env = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_NAME: 'SecretShield Security',
      DATABASE_URL: 'postgres://user:secret@localhost:5432/db',
      JWT_SECRET: 'private_jwt_secret_key'
    };

    const pub = getPublicConfig(env);
    assert.strictEqual(pub.appName, 'SecretShield Security');
    assert.strictEqual(pub.DATABASE_URL, undefined);
    assert.strictEqual(pub.JWT_SECRET, undefined);
  });
});

describe('Final Security Gate — Zero-Leak Audit across Data Layers', () => {
  it('should sanitize raw credentials in telemetry payloads and audit entries', () => {
    const auditEntry = {
      action: 'SCAN_COMPLETED',
      repo: 'acme/backend',
      rawSecret: 'AKIA1234567890ABCDEF',
      details: {
        token: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        note: 'Detected credential on line 42'
      }
    };

    const clean = sanitizeDataDeep(auditEntry);
    assert.strictEqual(clean.rawSecret, '[REDACTED_SECRET]');
    assert.strictEqual(clean.details.token, '[REDACTED_SECRET]');
    assert.strictEqual(clean.repo, 'acme/backend');
  });
});
