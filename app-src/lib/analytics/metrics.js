export const SUPPORTED_METRICS = Object.freeze({
  open_findings: 'open_findings',
  critical_findings: 'critical_findings',
  high_findings: 'high_findings',
  unique_exposed_fingerprints: 'unique_exposed_fingerprints',
  repositories_with_findings: 'repositories_with_findings',
  dependency_vulnerabilities: 'dependency_vulnerabilities',
  deployment_violations: 'deployment_violations',
  policy_violations: 'policy_violations',
  incidents: 'incidents',
  remediation_backlog: 'remediation_backlog',
  exposure_duration: 'exposure_duration',
  finding_count: 'finding_count',
  threat_relevance: 'threat_relevance',
});

export function isSupportedMetric(metric) {
  return !!SUPPORTED_METRICS[metric];
}
