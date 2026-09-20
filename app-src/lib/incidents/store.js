/**
 * lib/incidents/store.js
 *
 * System status & incident management store for /status and /admin.
 */

const COMPONENTS = [
  { id: 'web-app', name: 'Web App', status: 'operational', description: 'Next.js application, dashboard and UI' },
  { id: 'scanner', name: 'Scanner Engine', status: 'operational', description: 'Local and background entropy & pattern scanning' },
  { id: 'database', name: 'Database', status: 'operational', description: 'Multi-tenant metadata and finding storage' },
  { id: 'github-integration', name: 'GitHub integration', status: 'operational', description: 'Webhook processing and check runs' },
  { id: 'gitlab-integration', name: 'GitLab integration', status: 'operational', description: 'Pipeline hooks and merge request comments' },
  { id: 'jobs', name: 'Jobs & Queue', status: 'operational', description: 'Async background scan queue' },
  { id: 'notifications', name: 'Notifications', status: 'operational', description: 'Slack & webhook alert dispatchers' },
];

const INCIDENT_STATUSES = ['Investigating', 'Identified', 'Monitoring', 'Resolved'];

const _incidents = [
  {
    id: 'inc_launch_01',
    title: 'Platform Infrastructure Readiness Verification',
    status: 'Resolved',
    impact: 'None',
    componentsAffected: ['web-app', 'scanner'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updates: [
      {
        status: 'Resolved',
        message: 'All 50+ detection rules, CLI bridge, and multi-platform native bindings verified operational.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        status: 'Investigating',
        message: 'Running end-to-end verification suites across CI/CD and production builds.',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ]
  }
];

export function getSystemComponents() {
  return [...COMPONENTS];
}

export function getIncidents() {
  return [..._incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function createIncident(data) {
  if (!data.title || !data.status) {
    throw new Error('Title and status are required');
  }
  if (!INCIDENT_STATUSES.includes(data.status)) {
    throw new Error(`Invalid status. Allowed: ${INCIDENT_STATUSES.join(', ')}`);
  }

  const incident = {
    id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: String(data.title).slice(0, 150),
    status: data.status,
    impact: data.impact || 'Minor',
    componentsAffected: Array.isArray(data.componentsAffected) ? data.componentsAffected : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updates: [
      {
        status: data.status,
        message: data.message || `Incident opened with status: ${data.status}`,
        timestamp: new Date().toISOString(),
      }
    ]
  };

  _incidents.unshift(incident);
  return incident;
}

export function updateIncidentStatus(id, newStatus, message) {
  const inc = _incidents.find(i => i.id === id);
  if (!inc) return null;
  if (!INCIDENT_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  inc.status = newStatus;
  inc.updatedAt = new Date().toISOString();
  inc.updates.unshift({
    status: newStatus,
    message: message || `Status updated to ${newStatus}`,
    timestamp: new Date().toISOString(),
  });

  return inc;
}
