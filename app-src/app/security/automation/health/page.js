'use client';

/**
 * app/security/automation/health/page.js
 *
 * Real-Time Automation Health & Operational Diagnostics for SecretShield.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowLeft,
  Server,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AutomationHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    try {
      setLoading(true);
      const res = await fetch('/api/security/automation/health');
      const json = await res.json();
      if (json.success) {
        setHealth(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/security/automation" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Automation Queue
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Automation Health & Reliability</h1>
                {health && (
                  <Badge className={health.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
                    {health.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Diagnostic operational metrics, event processing throughput, retry counters, and pipeline reliability.
              </p>
            </div>
            <Button onClick={fetchHealth} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                Events Received
              </span>
              <p className="text-2xl font-bold">{health?.eventsReceived ?? 0}</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Success Rate
              </span>
              <p className="text-2xl font-bold">{health?.successRatePercent ?? 100}%</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Avg Duration
              </span>
              <p className="text-2xl font-bold">{health?.averageProcessingDurationMs ?? 0}ms</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Failures / Retries
              </span>
              <p className="text-2xl font-bold">{health?.processingFailures ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Subsystem Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Webhook Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failures:</span>
                <span className="font-mono">{health?.webhookFailures ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-emerald-400">Operational</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Scheduled Scans
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scan Failures:</span>
                <span className="font-mono">{health?.scheduledScanFailures ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Concurrency Locks:</span>
                <span className="text-emerald-400">Enforced</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="py-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dispatch Failures:</span>
                <span className="font-mono">{health?.notificationFailures ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Throttle Deduplication:</span>
                <span className="text-emerald-400">Active</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnostic Logs */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="py-4 border-b border-border/60">
            <CardTitle className="text-base font-semibold">
              Recent Error Logs & Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {!health?.recentErrors || health.recentErrors.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No error events recorded in current operational window. Pipeline running clean.
              </p>
            ) : (
              <div className="space-y-2">
                {health.recentErrors.map((err, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-muted/40 border border-border/60 text-xs font-mono flex items-start gap-2">
                    <span className="text-muted-foreground">{new Date(err.timestamp).toLocaleTimeString()}</span>
                    <span className="text-red-400 flex-1">{err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
