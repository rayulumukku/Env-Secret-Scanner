'use client';

/**
 * app/trust/data-flow/page.js
 *
 * Visual Data Flow & Boundary Map for SecretShield Trust Center.
 */

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  Server,
  ShieldCheck,
  Cpu,
  Database,
  Bell,
  Code,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DataFlowMapPage() {
  const steps = [
    {
      id: '1',
      title: 'Developer / CI Workstation',
      desc: 'Local git commits & pull request diffs.',
      icon: <Code className="w-5 h-5 text-primary" />,
      boundary: 'Internal Dev Environment',
      data: 'Plaintext source code diffs (Pre-commit)',
    },
    {
      id: '2',
      title: 'SecretShield Scanner',
      desc: 'Deterministic regex & Shannon entropy engine running 100% in-memory.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      boundary: 'Execution Sandbox',
      data: 'Immediate SHA-256 masking; Raw secrets dropped immediately',
    },
    {
      id: '3',
      title: 'Storage & Database',
      desc: 'Multi-tenant database engine storing masked findings and metadata.',
      icon: <Database className="w-5 h-5 text-blue-400" />,
      boundary: 'Tenant-Scoped Database',
      data: 'Masked values (AKIA••••••••), line numbers, rule IDs',
    },
    {
      id: '4',
      title: 'Security Events & Evidence',
      desc: 'Immutable audit logs and cryptographic evidence records.',
      icon: <Layers className="w-5 h-5 text-purple-400" />,
      boundary: 'Internal Audit Log',
      data: 'Audit events with SHA-256 hashes & timestamps',
    },
    {
      id: '5',
      title: 'Outbound Notifications',
      desc: 'Deduplicated alerts via Slack webhooks or email.',
      icon: <Bell className="w-5 h-5 text-amber-400" />,
      boundary: 'External Notification Service',
      data: 'Finding title, severity, repository name (Zero credentials)',
    },
    {
      id: '6',
      title: 'Optional AI Provider (Opt-In)',
      desc: 'Optional LLM remediation analysis with client-side scrubbing.',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      boundary: 'External Model Provider (Optional)',
      data: 'Anonymized rule name & code structure only; Secrets redacted',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/trust" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Trust Center
                </Link>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Data Flow & Boundary Architecture</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Visual data lifecycle map illustrating in-memory secret masking, tenant isolation, and strict external boundaries.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Visual Pipeline Flow */}
        <div className="space-y-4">
          {steps.map((s, idx) => (
            <Card key={s.id} className="border-border/60 bg-card/60">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="p-3 rounded-lg bg-muted border border-border/60 mt-0.5">
                    {s.icon}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">Step {s.id}</Badge>
                      <h3 className="font-semibold text-sm text-foreground">{s.title}</h3>
                      <Badge className="bg-muted text-muted-foreground text-[10px]">{s.boundary}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                    <div className="text-[11px] text-muted-foreground pt-1">
                      <span>Transmitted Payload: </span>
                      <span className="font-mono text-foreground">{s.data}</span>
                    </div>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center p-2 text-muted-foreground">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
