import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMaintenanceModeActive, setMaintenanceMode, checkMaintenance, getMaintenanceState } from '../state.js';

describe('Maintenance Mode Guard', () => {
  it('should default to inactive', () => {
    setMaintenanceMode(false);
    assert.strictEqual(isMaintenanceModeActive(), false);
  });

  it('should activate and block mutating requests when enabled', () => {
    setMaintenanceMode(true, { message: 'Emergency database migration in progress.' });
    assert.strictEqual(isMaintenanceModeActive(), true);

    // Write operation on standard API route should be blocked with 503
    const blockedRes = checkMaintenance('POST', '/api/scan');
    assert.ok(blockedRes);
    assert.strictEqual(blockedRes.blocked, true);
    assert.strictEqual(blockedRes.status, 503);

    // Read operation should not be blocked
    const getRes = checkMaintenance('GET', '/api/findings');
    assert.strictEqual(getRes, null);

    // Admin endpoints should not be blocked
    const adminRes = checkMaintenance('POST', '/api/admin/features');
    assert.strictEqual(adminRes, null);

    // Admin user override should bypass
    const adminUserRes = checkMaintenance('POST', '/api/scan', true);
    assert.strictEqual(adminUserRes, null);

    // Reset back
    setMaintenanceMode(false);
    assert.strictEqual(isMaintenanceModeActive(), false);
    assert.strictEqual(checkMaintenance('POST', '/api/scan'), null);
  });
});
