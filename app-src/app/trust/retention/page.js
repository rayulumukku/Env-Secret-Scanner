'use client';

/**
 * app/trust/retention/page.js
 *
 * Data Retention & Automated Cleanup Center.
 * Factual tracking of data lifecycles, retention periods, verified cleanup jobs,
 * and next scheduled cleanup executions.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Calendar,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Play,
  Shield,
  Trash2,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustNav from '@/components/trust/TrustNav';

export default function RetentionCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);
  const [jobResult, setJobResult] = useState(null);

  useEffect(() => {
    fetchRetention();
  }, []);

  async function fetchRetention() {
    try {
      setLoading(true);
      const res = await fetch('/api/trust/retention');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function triggerCleanup(dryRun = false) {
    try {
      setRunningJob(true);
      setJobResult(null);
      const res = await fetch('/api/trust/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType: 'ALL', dryRun }),
      });
      const json = await res.json();
      if (json.success) {
        setJobResult(json.data);
        fetchRetention();
      }
    } catch {
      // fallback
    } finally {
      setRunningJob(false);
    }
  }

  const policies = data?.policies || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/5 text-xs">
            Storage & Lifecycle Engine
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Verified Cleanup Verification</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Database className="w-8 h-8 text-blue-400" />
              Data Retention & Cleanup Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Transparent management of data lifecycles, automated database pruning, point-in-time retention
              schedules, and cryptographically verified deletion status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerCleanup(true)}
              disabled={runningJob}
              className="text-xs"
            >
              Simulate Dry-Run
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => triggerCleanup(false)}
              disabled={runningJob}
              className="text-xs gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              {runningJob ? 'Executing...' : 'Run Cleanup Job'}
            </Button>
          </div>
        </div>
      </div>

      <TrustNav />

      {/* Notice Banner */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Verified Deletion Guarantee
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SecretShield does not claim data deletion until the automated background cleanup job successfully executes
            and verifies that target records have been expunged from database indexes.
          </p>
        </div>
      </div>

      {/* Job Execution Feedback */}
      {jobResult && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {jobResult.message}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Hash: {jobResult.verificationHash}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Scanned: {jobResult.scannedCount} items | Eligible: {jobResult.eligibleForDeletion} | Actually Pruned:{' '}
            {jobResult.actuallyDeleted}
          </div>
        </div>
      )}

      {/* Retention Policies Table */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Configured Resource Lifecycles & Retention Windows</span>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5 text-[11px]">
              Engine Status: {data?.overallStatus || 'HEALTHY'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                  <th className="p-3.5">Resource Category</th>
                  <th className="p-3.5">Retention Window</th>
                  <th className="p-3.5">Cleanup Schedule</th>
                  <th className="p-3.5">Last Run Status</th>
                  <th className="p-3.5">Last Run Time</th>
                  <th className="p-3.5">Pruned Last Run</th>
                  <th className="p-3.5">Next Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {policies.map((p, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-semibold text-foreground">{p.resource}</td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {p.retentionDays} Days
                      </Badge>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{p.cleanupSchedule}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {p.lastCleanupStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground text-[11px]">
                      {new Date(p.lastCleanupAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-foreground font-semibold">
                      {p.itemsCleanedLastRun} items
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400 text-[11px]">
                      {new Date(p.upcomingCleanupAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
