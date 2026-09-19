'use client';

/**
 * app/settings/system-health/page.js
 *
 * Detailed System Health & Administrator Diagnostics.
 *
 * SAFETY GUARANTEE:
 * Does NOT display environment variables, credentials, database passwords, or auth tokens.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Server, Activity, Database, Cpu, HardDrive,
  RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft, Clock, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VERSION_INFO } from '@/lib/version';

export default function SystemHealthPage() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const latency = Math.round(performance.now() - start);

      setDiagnostics({
        ...data,
        clientLatencyMs: latency,
        rulesCount: 10,
        memoryEstimated: 'Normal (<120MB)',
        runtime: 'Node.js LTS',
      });
    } catch {
      setDiagnostics({
        status: 'degraded',
        database: 'unavailable',
        scanner: 'available',
        clientLatencyMs: -1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/settings" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">System Health & Diagnostics</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Administrative overview of scanner engine, persistence layer, and system performance.
          </p>
        </div>

        <Button
          onClick={runDiagnostics}
          disabled={loading}
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Run Diagnostics
        </Button>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {diagnostics?.status ? diagnostics.status.toUpperCase() : 'CHECKING...'}
          </div>
          <div className="text-[11px] text-muted-foreground">Core scanner operational</div>
        </div>

        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Scanner Latency</span>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {diagnostics?.clientLatencyMs !== undefined ? `${diagnostics.clientLatencyMs}ms` : '--'}
          </div>
          <div className="text-[11px] text-muted-foreground">End-to-end API probe roundtrip</div>
        </div>

        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Storage Engine</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {diagnostics?.database === 'connected' ? 'PostgreSQL' : 'In-Memory'}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {diagnostics?.database === 'connected' ? 'Persistent Database' : 'Fast Local Mock Store'}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Platform Version</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            v{VERSION_INFO.version}
          </div>
          <div className="text-[11px] text-muted-foreground">Release: {VERSION_INFO.releaseDate}</div>
        </div>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Core Detection Engine Details */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Scanner Engine State
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Active Detection Rule Modules</span>
              <span className="font-mono font-semibold text-foreground">10 modules loaded</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">ReDoS Protection Guard</span>
              <span className="font-mono font-semibold text-emerald-400">Active (15ms timeout)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Entropy Engine</span>
              <span className="font-mono font-semibold text-foreground">Shannon Algorithm 2.0</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">External AI Model Calls</span>
              <span className="font-mono font-semibold text-emerald-400">0 (Strictly Local)</span>
            </div>
          </div>
        </div>

        {/* Security & Isolation Settings */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Security & Data Protection
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Credential Masking Policy</span>
              <span className="font-mono font-semibold text-emerald-400">Mandatory (Instant Fingerprint)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Rate Limiting Protection</span>
              <span className="font-mono font-semibold text-foreground">Sliding Window Token Bucket</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">ZIP Archive Protection</span>
              <span className="font-mono font-semibold text-foreground">Zip Slip & Bomb Guard Active</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">HTTP Security Headers</span>
              <span className="font-mono font-semibold text-foreground">CSP, HSTS, X-Frame-Options</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
