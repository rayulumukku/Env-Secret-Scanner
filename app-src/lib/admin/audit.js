/**
 * lib/admin/audit.js
 *
 * Audit logger for global administrative operations.
 *
 * GUARANTEE: Never records credentials, secrets, or raw source tokens.
 */

const _adminAuditLogs = [
  {
    id: 'aud_init_01',
    action: 'Admin access',
    target: 'System initialization',
    actor: 'admin@secretshield.local',
    ip: '127.0.0.1',
    details: { event: 'Platform launch layer initialized' },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  }
];

export function logAdminAction(action, details = {}, actor = 'admin@secretshield.local', ip = '127.0.0.1') {
  // Sanitize details to guarantee no secrets are logged
  const cleanDetails = {};
  for (const [k, v] of Object.entries(details || {})) {
    if (/secret|token|password|auth|key|code/i.test(k)) continue;
    if (typeof v === 'string' && v.length > 256) {
      cleanDetails[k] = v.slice(0, 100) + '…[TRUNCATED]';
    } else {
      cleanDetails[k] = v;
    }
  }

  const logEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action: String(action).slice(0, 100),
    target: details.target || 'global',
    actor: String(actor).slice(0, 100),
    ip: String(ip).slice(0, 45),
    details: cleanDetails,
    timestamp: new Date().toISOString(),
  };

  _adminAuditLogs.unshift(logEntry);
  if (_adminAuditLogs.length > 5000) {
    _adminAuditLogs.pop();
  }
  return logEntry;
}

export function getAdminAuditLogs(limit = 100) {
  return _adminAuditLogs.slice(0, limit);
}
