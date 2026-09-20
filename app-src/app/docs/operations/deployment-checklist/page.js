import Link from 'next/link';
import { ArrowLeft, CheckSquare, Shield, Lock, Server, Database, Key, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Production Deployment Checklist — SecretShield Docs',
  description: 'Pre-flight security, environment, database, and infrastructure readiness checklist for SecretShield.',
};

export default function DeploymentChecklistDocPage() {
  const items = [
    { label: 'DATABASE_URL configured and accessible with SSL mode enabled (sslmode=require)', tag: 'Database' },
    { label: 'AUTH_SECRET generated with high-entropy 32-byte random string (openssl rand -base64 32)', tag: 'Auth' },
    { label: 'ENCRYPTION_KEY configured with 32-byte hex/base64 key for AES-256-GCM token protection', tag: 'Security' },
    { label: 'HTTPS enforced with valid TLS certificate and HTTP-to-HTTPS redirection', tag: 'Network' },
    { label: 'Secure HTTP headers enabled (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)', tag: 'Security' },
    { label: 'Database schema migrations executed (npm run db:migrate)', tag: 'Database' },
    { label: 'Continuous or daily automated database backups configured and retention verified', tag: 'Operations' },
    { label: 'Health probes verified: GET /api/health, GET /api/health/readiness, GET /api/health/liveness', tag: 'Monitoring' },
    { label: 'GitHub App / GitLab OAuth applications configured with valid redirect URLs and HMAC webhook secrets', tag: 'Integrations' },
    { label: 'Centralized secret redaction verified (lib/security/redact.js active in logger and API handlers)', tag: 'Privacy' },
    { label: 'Rate limiting token bucket enabled for public API routes and auth endpoints', tag: 'Security' },
    { label: 'Production smoke test passed cleanly (node scripts/smoke-test.js)', tag: 'Verification' },
  ];

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-border/40 pb-6">
          <Link href="/docs" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Documentation
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Production Deployment Pre-Flight Checklist</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete this mandatory verification checklist prior to launching or promoting SecretShield to production environments.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border/50 bg-card/40 flex items-start gap-3">
              <div className="w-5 h-5 rounded border border-primary/50 flex items-center justify-center text-primary mt-0.5 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 text-xs">
                <span className="text-foreground font-medium">{item.label}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
