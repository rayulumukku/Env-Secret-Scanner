'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ArrowLeft, Shield, AlertTriangle, CheckCircle2,
  Calendar, RefreshCw, BarChart2, PieChart, Layers, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SecurityTrendsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const projectId = params.id;

  const [range, setRange] = useState('30d');
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, [projectId, range]);

  async function fetchTrends() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/security-trends?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setTrends(data.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const timeline = trends?.timeline || [];
  const severity = trends?.severityBreakdown || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const categories = trends?.categoryDistribution || [];
  const coverage = trends?.repositoryCoverage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Project
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              Repository Security Trends
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Historical credential introduction rates, remediation velocity, and risk mitigation over time.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1">
            {['7d', '30d', '90d', 'all'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  range === r
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400">Total Detected</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{trends?.totalDetected || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Over selected period</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-emerald-400">Total Resolved</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{trends?.totalResolved || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Remediated & removed</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-cyan-400">New This Week</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{trends?.newThisWeek || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Past 7 days</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-amber-400">Active Findings</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{trends?.activeFindingsCount || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Requiring action</div>
          </div>
        </div>

        {/* Activity & Timeline Trend Chart */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                Detection & Remediation Velocity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Timeline of findings introduced vs remediated</p>
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No historical data points available for this period.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-7 md:grid-cols-14 gap-2 items-end h-40 pt-6">
                {timeline.slice(-14).map((pt, idx) => (
                  <div key={`pt_${idx}`} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-28">
                      {pt.detected > 0 && (
                        <div
                          style={{ height: `${Math.min(100, pt.detected * 40)}%` }}
                          className="w-3 bg-rose-500/80 rounded-t"
                          title={`${pt.date}: ${pt.detected} detected`}
                        />
                      )}
                      {pt.resolved > 0 && (
                        <div
                          style={{ height: `${Math.min(100, pt.resolved * 40)}%` }}
                          className="w-3 bg-emerald-500/80 rounded-t"
                          title={`${pt.date}: ${pt.resolved} resolved`}
                        />
                      )}
                      {pt.detected === 0 && pt.resolved === 0 && (
                        <div className="w-2 h-1 bg-slate-800 rounded-full" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                      {pt.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-sm" />
                  <span>Detected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                  <span>Resolved</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Severity & Category Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Severity Distribution */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Active Severity Distribution
            </h3>
            <div className="space-y-3">
              {[
                { level: 'CRITICAL', count: severity.CRITICAL, color: 'bg-rose-500' },
                { level: 'HIGH', count: severity.HIGH, color: 'bg-orange-500' },
                { level: 'MEDIUM', count: severity.MEDIUM, color: 'bg-amber-500' },
                { level: 'LOW', count: severity.LOW, color: 'bg-blue-500' }
              ].map(s => (
                <div key={s.level} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="font-medium text-slate-300">{s.level}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secret Category Distribution */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              Secret Category Breakdown
            </h3>
            <div className="space-y-3">
              {categories.map((c, i) => (
                <div key={`cat_${i}`} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{c.category}</span>
                    <span className="font-mono text-slate-400">{c.percentage}% ({c.count})</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${c.percentage}%` }}
                      className="bg-cyan-500 h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
