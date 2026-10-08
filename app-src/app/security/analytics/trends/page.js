export default function SecurityAnalyticsTrendsPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <h1>Security trends</h1>
      <p>Historical trend analysis uses the authenticated organization scope and a bounded query window.</p>
      <ul>
        <li>7d, 30d, 90d, 180d, and 365d</li>
        <li>Findings, exposure, dependencies, policies, incidents</li>
        <li>Regression and improvement detection based on observed counts</li>
      </ul>
    </main>
  );
}
