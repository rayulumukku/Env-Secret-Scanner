'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, ToggleLeft, ToggleRight, AlertTriangle,
  Activity, BarChart3, MessageSquare, ListFilter,
  ShieldCheck, ArrowRight, RefreshCw, Key, Settings,
  Radio, Lock, Database, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function GlobalAdminDashboard() {
  const [flags, setFlags] = useState({});
  const [maintenance, setMaintenance] = useState({ enabled: false, message: '' });
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [auditCount, setAuditCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingFlag, setUpdatingFlag] = useState(null);
  const [updatingMaint, setUpdatingMaint] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [flagsRes, maintRes, fbRes, auditRes] = await Promise.all([
        fetch('/api/features').then(r => r.json()).catch(() => ({})),
        fetch('/api/admin/maintenance').then(r => r.json()).catch(() => ({ enabled: false })),
        fetch('/api/feedback').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/admin/audit-logs').then(r => r.json()).catch(() => ({ data: [] })),
      ]);

      if (flagsRes.data) setFlags(flagsRes.data);
      if (maintRes.data) setMaintenance(maintRes.data);
      if (fbRes.data) setFeedbackCount(fbRes.data.length);
      if (auditRes.data) setAuditCount(auditRes.data.length);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (key, currentVal) => {
    setUpdatingFlag(key);
    try {
      const res = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !currentVal }),
      });
      if (res.ok) {
        setFlags(prev => ({ ...prev, [key]: !currentVal }));
      }
    } catch {
    } finally {
      setUpdatingFlag(null);
    }
  };

  const handleToggleMaintenance = async () => {
    setUpdatingMaint(true);
    try {
      const nextState = !maintenance.enabled;
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: nextState,
          message: nextState ? 'Scheduled platform maintenance in progress.' : '',
        }),
      });
      if (res.ok) {
        setMaintenance(prev => ({ ...prev, enabled: nextState }));
      }
    } catch {
    } finally {
      setUpdatingMaint(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                GLOBAL ADMIN PORTAL
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">RBAC: GLOBAL_ADMIN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Platform Administration & Governance
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Feature flags, maintenance mode overrides, feedback triage, and audit trail logs.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAdminData}
            disabled={loading}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh State
          </Button>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Link href="/admin/feedback" className="group">
            <div className="p-5 rounded-xl border border-border/60 bg-card/40 hover:border-primary/50 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">User Feedback</span>
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black font-mono text-foreground">{feedbackCount}</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary">
                Triage Submissions <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </Link>

          <Link href="/admin/analytics" className="group">
            <div className="p-5 rounded-xl border border-border/60 bg-card/40 hover:border-primary/50 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Product Analytics</span>
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black font-mono text-foreground">7d / 30d / 90d</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary">
                View Telemetry <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </Link>

          <Link href="/admin/analytics/activation" className="group">
            <div className="p-5 rounded-xl border border-border/60 bg-card/40 hover:border-primary/50 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Activation Funnel</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-foreground">Funnel Metrics</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary">
                View Conversion <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </Link>

          <Link href="/admin/audit-logs" className="group">
            <div className="p-5 rounded-xl border border-border/60 bg-card/40 hover:border-primary/50 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Audit Log Trail</span>
                <Lock className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-black font-mono text-foreground">{auditCount} events</div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary">
                View Audit Trail <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </Link>
        </div>

        {/* Maintenance Mode Guard */}
        <div className={`p-6 rounded-2xl border transition-all ${
          maintenance.enabled
            ? 'border-red-500/40 bg-red-500/10'
            : 'border-border/70 bg-card/50'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className={`w-5 h-5 ${maintenance.enabled ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
                <h3 className="font-bold text-base text-foreground">
                  Global Maintenance Mode (503 Guard)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl">
                When enabled, all mutating API operations (scans, project creation, settings updates) will safely return HTTP 503 Service Unavailable, while read-only public routes remain accessible.
              </p>
            </div>

            <Button
              variant={maintenance.enabled ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleToggleMaintenance}
              disabled={updatingMaint}
              className="gap-2 font-bold"
            >
              {maintenance.enabled ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
            </Button>
          </div>
        </div>

        {/* Feature Flags Registry */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Global Feature Flags</h2>
              <p className="text-xs text-muted-foreground">
                Control system capabilities and experimental modules in real-time.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {Object.keys(flags).length} Registered Flags
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(flags).map(([key, enabled]) => (
              <div
                key={key}
                className="p-4 rounded-xl border border-border/60 bg-card/40 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-semibold text-sm text-foreground font-mono">{key}</div>
                  <div className="text-xs text-muted-foreground">
                    {enabled ? 'Active for all requests' : 'Disabled platform-wide'}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={enabled ? 'default' : 'secondary'}
                  disabled={updatingFlag === key}
                  onClick={() => handleToggleFlag(key, enabled)}
                  className={`gap-1.5 text-xs font-semibold ${
                    enabled ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {enabled ? 'ENABLED' : 'DISABLED'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
