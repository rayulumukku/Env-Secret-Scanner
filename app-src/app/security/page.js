'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, AlertTriangle, CheckCircle2, RefreshCw,
  GitBranch, Terminal, ExternalLink, ArrowRight, Activity, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityCommandCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/overview');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const protection = data?.protectionSummary;
  const findings = data?.findingsSummary;
  const topQueue = data?.topQueue || [];
  const activity = data?.recentActivity || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Security Command Center</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time organization security posture, repository coverage, active credentials, and audit velocity.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/security/report">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Executive Report
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchOverview}
              disabled={loading}
              className="text-xs border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <SecurityNav />

        {/* Top Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Repos</div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{protection?.totalRepositories || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Connected in org</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-emerald-400 uppercase font-semibold">Protected</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{protection?.protectedRepositories || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{protection?.coverageRate || '0%'} coverage</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-amber-400 uppercase font-semibold">Needs Attention</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{protection?.needsAttentionRepositories || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Missing CI or open finding</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-rose-400 uppercase font-semibold">Critical Secrets</div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{findings?.critical || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Immediate action</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-cyan-400 uppercase font-semibold">New This Week</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{findings?.newThisWeek || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Introduced in last 7d</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-emerald-400 uppercase font-semibold">Resolved (7d)</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{findings?.resolvedThisWeek || 0}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Remediated & rotated</div>
          </div>

        </div>

        {/* Priority Findings Queue Preview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Top Priority Findings Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Findings ranked by transparent signals (severity, presence, confidence, and context).
              </p>
            </div>
            <Link
              href="/security/queue"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              View Full Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-cyan-400" />
              Loading security queue...
            </div>
          ) : topQueue.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-lg text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              No active findings in the priority queue. All repositories clean!
            </div>
          ) : (
            <div className="space-y-3">
              {topQueue.map((f, i) => (
                <div key={f.id || i} className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        f.priorityLevel === 'P0_IMMEDIATE' ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : f.priorityLevel === 'P1_HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {f.priorityLevel || 'P2'} • {f.priorityScore || 50} pts
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{f.ruleName || f.ruleId}</span>
                      <span className="text-[11px] font-mono text-slate-400">({f.repositoryName || 'repo'})</span>
                    </div>

                    <div className="font-mono text-xs text-slate-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 inline-block">
                      {f.maskedValue}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(f.priorityFactors || []).slice(0, 2).map((factor, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/findings/${f.id || ''}`}>
                      <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900">
                        Remediate
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two-Column Grid: CI/CD Coverage & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CI/CD Protection Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                CI/CD & Hook Protection
              </h3>
              <Link href="/security/ci" className="text-xs text-cyan-400 hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs">
                <span className="text-slate-300">GitHub Actions CI Scans</span>
                <span className="font-mono text-emerald-400 font-semibold">{data?.ciProtection?.githubActionsActive || 0} Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs">
                <span className="text-slate-300">Local Git Pre-Commit Hooks</span>
                <span className="font-mono text-emerald-400 font-semibold">{data?.ciProtection?.preCommitConfigured || 0} Configured</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs">
                <span className="text-slate-300">Automated Pull Request Scanning</span>
                <span className="font-mono text-emerald-400 font-semibold">{data?.ciProtection?.prScanningActive || 0} Enabled</span>
              </div>
            </div>
          </div>

          {/* Unified Activity Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Recent Security Events
              </h3>
              <Link href="/security/activity" className="text-xs text-cyan-400 hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {activity.map(act => (
                <div key={act.id} className="text-xs p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">{act.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{act.repository} • {act.timestamp}</div>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {act.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
