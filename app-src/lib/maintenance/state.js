/**
 * lib/maintenance/state.js
 *
 * Controlled maintenance mode state and middleware check.
 *
 * BEHAVIOR:
 * - When enabled:
 *   - Public marketing & status pages remain accessible
 *   - Authenticated write operations (POST/PUT/DELETE/PATCH) return 503:
 *     "SecretShield is temporarily undergoing maintenance."
 *   - Read-only queries (GET) remain operational where safe.
 */

let _maintenanceState = {
  enabled: false,
  message: 'SecretShield is temporarily undergoing maintenance.',
  estimatedEndTime: null,
  enabledAt: null,
  enabledBy: null,
};

export function getMaintenanceState() {
  return { ..._maintenanceState };
}

export function isMaintenanceModeActive() {
  return _maintenanceState.enabled;
}

export function setMaintenanceMode(enabled, options = {}) {
  _maintenanceState = {
    enabled: Boolean(enabled),
    message: options.message || 'SecretShield is temporarily undergoing maintenance.',
    estimatedEndTime: options.estimatedEndTime || null,
    enabledAt: enabled ? new Date().toISOString() : null,
    enabledBy: enabled ? (options.adminEmail || 'admin') : null,
  };
  return { ..._maintenanceState };
}

/**
 * Check if a request should be rejected due to maintenance mode.
 * @param {string} method - GET, POST, PUT, DELETE, etc.
 * @param {string} pathname - URL pathname
 * @param {boolean} isAdmin - whether current user has global admin override
 * @returns {{ blocked: boolean, status: number, message: string } | null}
 */
export function checkMaintenance(method, pathname, isAdmin = false) {
  if (!_maintenanceState.enabled || isAdmin) {
    return null; // not blocked
  }

  // Allow admin and status endpoints
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/status') || pathname.startsWith('/api/health')) {
    return null;
  }

  // Block write operations
  const upperMethod = method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(upperMethod)) {
    return {
      blocked: true,
      status: 503,
      message: _maintenanceState.message,
    };
  }

  return null;
}
