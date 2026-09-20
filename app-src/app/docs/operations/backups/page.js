import Link from 'next/link';
import { ArrowLeft, Database, Shield, Clock, CheckCircle2, AlertTriangle, HardDrive } from 'lucide-react';

export const metadata = {
  title: 'Database Backup & Recovery Runbook — SecretShield Docs',
  description: 'Procedures for backing up PostgreSQL databases, verifying integrity, and performing point-in-time restores.',
};

export default function BackupsDocPage() {
  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-border/40 pb-6">
          <Link href="/docs" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Documentation
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Database Backup & Recovery Operations</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Standard operating procedures for regular automated database backups, verification drills, and disaster restoration.
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6">
          <section className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              1. What Must Be Backed Up
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li><strong className="text-foreground">PostgreSQL Database Volume</strong>: Contains organizations, projects, repository linkage, finding fingerprints, custom detection rules, baselines, and audit logs.</li>
              <li><strong className="text-foreground">Application Encryption Key (<code className="text-primary">ENCRYPTION_KEY</code>)</strong>: 32-byte secret used for AES-256-GCM token storage. Must be backed up securely in a dedicated secret manager (e.g. AWS Secrets Manager, HashiCorp Vault, 1Password Secrets Automation).</li>
              <li><strong className="text-foreground">Environment Configuration</strong>: OAuth client IDs, webhook secrets, and application parameters.</li>
            </ul>
          </section>

          <section className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              2. Backup Schedule & Retention Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-border/40 rounded-lg">
                <thead className="bg-secondary/50 text-foreground font-semibold">
                  <tr>
                    <th className="p-2.5 border-b border-border/40">Tier</th>
                    <th className="p-2.5 border-b border-border/40">Frequency</th>
                    <th className="p-2.5 border-b border-border/40">Target Retention</th>
                    <th className="p-2.5 border-b border-border/40">Storage Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-muted-foreground">
                  <tr>
                    <td className="p-2.5 font-medium text-foreground">Continuous WAL (Point-In-Time)</td>
                    <td className="p-2.5">Continuous streaming</td>
                    <td className="p-2.5">7 Days</td>
                    <td className="p-2.5">Provider Automated Backups</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-foreground">Daily Logical Snapshot</td>
                    <td className="p-2.5">Daily @ 02:00 UTC</td>
                    <td className="p-2.5">30 Days</td>
                    <td className="p-2.5">Encrypted Object Store</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-foreground">Weekly Archive</td>
                    <td className="p-2.5">Every Sunday</td>
                    <td className="p-2.5">90 Days</td>
                    <td className="p-2.5">Cold / Glacier Storage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              3. Logical Backup Command Examples
            </h2>
            <p className="text-muted-foreground">
              Run <code className="text-primary">pg_dump</code> securely using encrypted pipes without storing raw database passwords on disk:
            </p>
            <pre className="p-3 bg-secondary/60 rounded-lg font-mono text-[11px] overflow-x-auto text-primary">
              # Create a compressed custom-format backup with SHA-256 checksum{'\n'}
              pg_dump -Fc -Z 6 -d &quot;$DATABASE_URL&quot; &gt; &quot;secretshield-backup-$(date +%Y%m%d%H%M%S).dump&quot;{'\n'}
              sha256sum secretshield-backup-*.dump &gt; secretshield-backup.sha256
            </pre>
          </section>

          <section className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              4. Restoration & Integrity Drill Procedure
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Provision or isolate a temporary scratch database instance.</li>
              <li>Restore dump file: <code className="text-primary">pg_restore -d &quot;$TARGET_DB_URL&quot; --clean --if-exists secretshield-backup.dump</code></li>
              <li>Run SecretShield smoke test suite: <code className="text-primary">node scripts/smoke-test.js</code></li>
              <li>Verify finding fingerprints match without missing relations or orphaned foreign keys.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
