export function aggregateEvents(events = [], { metric = 'open_findings', dimension = 'date', organizationId = null } = {}) {
  const filtered = (events || []).filter((event) => {
    if (organizationId && event.organizationId !== organizationId) return false;
    return true;
  });

  const buckets = new Map();
  for (const event of filtered) {
    const bucketKey = event[dimension] || event.timestamp?.slice(0, 10) || 'unknown';
    const current = buckets.get(bucketKey) || 0;
    if (metric === 'open_findings' && event.eventType === 'FINDING' && event.metadata?.status === 'OPEN') {
      buckets.set(bucketKey, current + 1);
    } else if (metric === 'critical_findings' && event.eventType === 'FINDING' && event.metadata?.severity === 'CRITICAL') {
      buckets.set(bucketKey, current + 1);
    } else if (metric === 'policy_violations' && event.eventType === 'POLICY' && String(event.metadata?.status || '').toUpperCase() !== 'PASSED') {
      buckets.set(bucketKey, current + 1);
    } else if (metric === 'dependency_vulnerabilities' && event.eventType === 'DEPENDENCY') {
      buckets.set(bucketKey, current + 1);
    } else if (metric === 'incidents' && event.eventType === 'INCIDENT') {
      buckets.set(bucketKey, current + 1);
    } else if (metric === 'remediation_backlog' && event.eventType === 'REMEDIATION' && event.metadata?.status !== 'VERIFIED') {
      buckets.set(bucketKey, current + 1);
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}
