'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, Activity, ShieldCheck, ArrowLeft, RefreshCw,
  Clock, Zap, CheckCircle2, AlertTriangle, Key, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('30d');
  const [metrics, setMetrics] = useState({
    totalScans: 0,
    totalFindings: 0,
    baselinesGenerated: 0,
    prChecks: 0,
    avgScanLatencyMs: 24,
    eventsByType: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      const data = await res.json();
      if (data.data) {
        setMetrics(data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Global Admin
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                  PRIVACY-FIRST TELEMETRY
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Anonymous Aggregate Metrics
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
                Product Usage Analytics
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                High-level adoption statistics and scanner performance without personal or repository data.
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-2 bg-card/60 p-1 rounded-xl border border-border/60">
              {['7d', '30d', '90d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-primary text-primary-foreground font-bold shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zero PII Guarantee Banner */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Zero-PII Architecture:</strong> Telemetry contains zero repository names, file contents, secret tokens, or developer identities.
            </span>
          </div>
          <Link href="/docs/privacy/analytics" className="text-emerald-400 hover:underline font-semibold ml-4">
            View Telemetry Spec &rarr;
          </Link>
        </div>

        {/* Key Aggregate Metrics Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-border/70 bg-card/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Scans Executed
            </span>
            <div className="text-3xl font-black font-mono text-foreground">
              {loading ? '-' : metrics.totalScans}
            </div>
            <p className="text-[11px] text-muted-foreground">In-memory & CLI scan operations</p>
          </div>

          <div className="p-5 rounded-xl border border-border/70 bg-card/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Secrets Detected (Masked)
            </span>
            <div className="text-3xl font-black font-mono text-amber-400">
              {loading ? '-' : metrics.totalFindings}
            </div>
            <p className="text-[11px] text-muted-foreground">Deterministic pattern matches</p>
          </div>

          <div className="p-5 rounded-xl border border-border/70 bg-card/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Baselines Generated
            </span>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {loading ? '-' : metrics.baselinesGenerated}
            </div>
            <p className="text-[11px] text-muted-foreground">Legacy debt suppressions</p>
          </div>

          <div className="p-5 rounded-xl border border-border/70 bg-card/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg Scan Latency
            </span>
            <div className="text-3xl font-black font-mono text-primary">
              {loading ? '-' : `${metrics.avgScanLatencyMs} ms`}
            </div>
            <p className="text-[11px] text-muted-foreground">Sub-50ms engine benchmark</p>
          </div>
        </div>

        {/* Event Breakdown Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Anonymous Event Distribution</h3>
            <Link href="/admin/analytics/activation">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                View Activation Funnel
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40">
            {Object.entries(metrics.eventsByType || {}).length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No events recorded for this timeframe yet.
              </div>
            ) : (
              Object.entries(metrics.eventsByType).map(([event, count]) => (
                <div key={event} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div className="font-mono text-xs text-foreground font-medium">{event}</div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {count} occurrences
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
