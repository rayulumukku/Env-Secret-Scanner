'use client';

/**
 * app/settings/usage/page.js
 *
 * Real Usage & Resource Quota Dashboard.
 *
 * PRIVACY GUARANTEE:
 * Displays only aggregate statistics from persistent DB records.
 * NEVER displays secret values or raw source code.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3, FolderGit2, Shield, FileCheck, CheckCircle2,
  RefreshCw, Cpu, Database, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLANS } from '@/lib/billing/plans';

export default function UsageSettingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/usage');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const metrics = data?.metrics || {
    repositoriesCount: 0,
    projectsCount: 0,
    membersCount: 1,
    scansCompleted: 0,
    filesScanned: 0,
    findingsDetected: 0,
    findingsResolved: 0,
    ciScansCount: 0,
  };

  const plan = PLANS.FREE;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Usage & Quotas</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Monitor real repository scans, file throughput, and finding resolution counts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsage}
          disabled={loading}
          className="gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </Button>
      </div>

      <SettingsNav />

      {/* Plan Status Banner */}
      <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-foreground">{plan.name}</span>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
              {plan.badge}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {plan.description}
          </p>
        </div>

        <div className="text-right font-mono">
          <span className="text-2xl font-black text-foreground">{plan.price}</span>
          <span className="text-xs text-muted-foreground ml-1">/{plan.billingPeriod}</span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground">Total Scans Run</span>
          <div className="text-2xl font-black font-mono text-foreground">{metrics.scansCompleted}</div>
          <div className="text-[11px] text-muted-foreground">Across all projects</div>
        </div>

        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground">Files Analyzed</span>
          <div className="text-2xl font-black font-mono text-primary">{metrics.filesScanned.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">Total file throughput</div>
        </div>

        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground">Findings Detected</span>
          <div className="text-2xl font-black font-mono text-red-400">{metrics.findingsDetected}</div>
          <div className="text-[11px] text-muted-foreground">Historical detections</div>
        </div>

        <div className="p-5 rounded-xl border border-border/60 bg-card/40 space-y-1">
          <span className="text-xs text-muted-foreground">Findings Resolved</span>
          <div className="text-2xl font-black font-mono text-emerald-400">{metrics.findingsResolved}</div>
          <div className="text-[11px] text-muted-foreground">Triaged or remediated</div>
        </div>
      </div>

      {/* Quotas & Capacity */}
      <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-5">
        <h3 className="font-bold text-base text-foreground">Resource Capacity & Quotas</h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span>Connected Repositories</span>
              <span className="font-mono text-muted-foreground">{metrics.repositoriesCount} / {plan.limits.maxRepositories}</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (metrics.repositoriesCount / plan.limits.maxRepositories) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span>Monthly Scans</span>
              <span className="font-mono text-muted-foreground">{metrics.scansCompleted} / {plan.limits.maxScansPerMonth}</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (metrics.scansCompleted / plan.limits.maxScansPerMonth) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
