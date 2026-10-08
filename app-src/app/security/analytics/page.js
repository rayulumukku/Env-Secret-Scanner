export default function SecurityAnalyticsPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <h1>Security analytics</h1>
      <p>Observed metrics only. No secrets are stored or disclosed. Every metric is derived from sanitized events and evidence references.</p>
      <ul>
        <li>Findings</li>
        <li>Exposure</li>
        <li>Dependencies</li>
        <li>Remediation</li>
        <li>Policies</li>
        <li>Incidents</li>
        <li>Threat intelligence</li>
      </ul>
    </main>
  );
}
