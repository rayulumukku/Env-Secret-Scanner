import Link from 'next/link';
import { ArrowLeft, ShieldAlert, AlertTriangle, RefreshCw, Clock, CheckCircle2, Server, Key } from 'lucide-react';

export const metadata = {
  title: 'Disaster Recovery Playbook — SecretShield Docs',
  description: 'Incident response playbooks for application failures, database loss, webhook failures, and credential compromises.',
};

export default function DisasterRecoveryDocPage() {
  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-border/40 pb-6">
          <Link href="/docs" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Documentation
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <h1 className="text-2xl font-bold tracking-tight">Disaster Recovery (DR) Operations Playbook</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Standard recovery playbooks, objective timelines (RTO/RPO), and remediation steps for critical infrastructure outages.
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6">
          {/* RTO / RPO Objectives */}
          <section className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              1. Recovery Objectives (RTO / RPO)
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-secondary/40 border border-border/30 space-y-1">
                <div className="text-muted-foreground font-semibold">Recovery Time Objective (RTO)</div>
                <div className="text-xl font-bold font-mono text-foreground">&lt; 30 Minutes</div>
                <div className="text-[11px] text-muted-foreground">Target duration to restore application service from total infrastructure failure.</div>
              </div>

              <div className="p-3.5 rounded-lg bg-secondary/40 border border-border/30 space-y-1">
                <div className="text-muted-foreground font-semibold">Recovery Point Objective (RPO)</div>
                <div className="text-xl font-bold font-mono text-foreground">&lt; 15 Minutes</div>
                <div className="text-[11px] text-muted-foreground">Maximum acceptable data loss window using streaming WAL or point-in-time snapshots.</div>
              </div>
            </div>
          </section>

          {/* Scenario Playbooks */}
          <section className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              2. Incident Response Playbooks by Failure Mode
            </h2>

            <div className="space-y-4">
              {/* Playbook 1 */}
              <div className="p-3.5 rounded-lg bg-secondary/20 border border-border/30 space-y-2">
                <h3 className="font-bold text-foreground text-xs">Scenario A: Application Process / Container Crash</h3>
                <p className="text-muted-foreground">
                  The application is completely stateless. When containers crash, orchestrators (Docker Compose, Kubernetes, ECS) automatically restart fresh pods.
                </p>
                <div className="font-mono text-[11px] text-primary p-2 bg-secondary/60 rounded">
                  docker restart secretshield_web || kubectl rollout restart deployment secretshield
                </div>
              </div>

              {/* Playbook 2 */}
              <div className="p-3.5 rounded-lg bg-secondary/20 border border-border/30 space-y-2">
                <h3 className="font-bold text-foreground text-xs">Scenario B: Primary PostgreSQL Instance Failure</h3>
                <p className="text-muted-foreground">
                  1. Trigger failover to standby replica (if managed multi-AZ).<br />
                  2. If database is corrupted, restore the latest logical dump from backup object store.<br />
                  3. Verify connectivity using <code className="text-primary">GET /api/health/readiness</code>.
                </p>
              </div>

              {/* Playbook 3 */}
              <div className="p-3.5 rounded-lg bg-secondary/20 border border-border/30 space-y-2">
                <h3 className="font-bold text-foreground text-xs">Scenario C: Webhook Delivery / Ingestion Outage</h3>
                <p className="text-muted-foreground">
                  All incoming webhooks are deduplicated and logged. Failed dispatches automatically retry using exponential backoff with jitter. Once network connectivity is restored, trigger manual resync from the Webhook Diagnostics dashboard.
                </p>
              </div>

              {/* Playbook 4 */}
              <div className="p-3.5 rounded-lg bg-secondary/20 border border-border/30 space-y-2">
                <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5 text-red-400">
                  <Key className="w-3.5 h-3.5" />
                  Scenario D: Encryption Key or Authentication Secret Compromise
                </h3>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Generate a new 32-byte secret: <code className="text-primary">openssl rand -base64 32</code>.</li>
                  <li>Update environment variable <code className="text-primary">AUTH_SECRET</code> (invalidates all active user sessions).</li>
                  <li>Rotate <code className="text-primary">ENCRYPTION_KEY</code> and re-encrypt stored integration tokens.</li>
                  <li>Re-authenticate connected GitHub, GitLab, and Slack OAuth integrations.</li>
                </ol>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
