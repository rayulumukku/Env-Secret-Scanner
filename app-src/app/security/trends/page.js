'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, RefreshCw, BarChart2, PieChart, Shield,
  AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityTrendsPage() {
  const [range, setRange] = useState('30d');
  const [unit, setUnit] = useState('count');
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, [range, unit]);

  async function fetchTrends() {
    setLoading(true);
    try {
      const res = await fetch(`/api/security/trends?range=${range}&unit=${unit}`);
      const json = await res.json();
      if (json.success) {
        setTrends(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const timeline = trends?.timeline || [];
  const categories = trends?.categoryBreakdown || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-cyan-400" />
              Organizational Security Trends
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Historical introduction rates, remediation velocity, and category distributions across all repositories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setUnit('count')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  unit === 'count' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setUnit('percentage')}
                className={`px-3 py-1 rounded font-semibold transition-all ${
                  unit === 'percentage' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Percentage
              </button>
            </div>

            {/* Range Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              {['7d', '30d', '90d', '1y'].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded font-semibold transition-all ${
                    range === r ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {r === '7d' ? '7D' : r === '30d' ? '30D' : r === '90d' ? '90D' : '1Y'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <SecurityNav />

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">Total Introduced</div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{trends?.totalIntroduced || 0}</div>
            <div className="text-xs text-slate-500 mt-1">In selected time range</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-emerald-400 font-semibold">Total Resolved</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{trends?.totalResolved || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Remediated & removed</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-amber-400 font-semibold">Net Active Findings</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{trends?.netOpen || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Currently open in source</div>
          </div>
        </div>

        {/* Chart View */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            Audit & Remediation Velocity
          </h2>

          <div className="grid grid-cols-7 md:grid-cols-14 gap-2 items-end h-48 pt-6">
            {timeline.slice(-14).map((pt, idx) => (
              <div key={`trend_${idx}`} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-36">
                  {pt.introduced > 0 && (
                    <div
                      style={{ height: `${Math.min(100, pt.introduced * 45)}%` }}
                      className="w-3 bg-rose-500/80 rounded-t"
                      title={`${pt.date}: ${pt.introduced} introduced`}
                    />
                  )}
                  {pt.resolved > 0 && (
                    <div
                      style={{ height: `${Math.min(100, pt.resolved * 45)}%` }}
                      className="w-3 bg-emerald-500/80 rounded-t"
                      title={`${pt.date}: ${pt.resolved} resolved`}
                    />
                  )}
                  {pt.introduced === 0 && pt.resolved === 0 && (
                    <div className="w-2 h-1 bg-slate-800 rounded-full" />
                  )}
                </div>
                <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                  {pt.date.slice(5)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-sm" />
              <span>Introduced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
              <span>Resolved</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-400" />
            Secret Category Distribution
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((c, i) => (
              <Link
                key={`cat_${i}`}
                href={`/security/queue?category=${encodeURIComponent(c.category)}`}
                className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-cyan-500/40 transition-all group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400">{c.category}</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">{c.count} findings</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.percentage}% of total</div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
