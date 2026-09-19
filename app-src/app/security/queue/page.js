'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ListOrdered, RefreshCw, Filter, Shield, AlertTriangle,
  CheckCircle2, ArrowRight, Eye, Key, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityQueuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority');

  useEffect(() => {
    fetchQueue();
  }, [severityFilter, categoryFilter, statusFilter]);

  async function fetchQueue() {
    setLoading(true);
    try {
      const res = await fetch(`/api/security/queue?severity=${severityFilter}&category=${categoryFilter}&status=${statusFilter}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  let findings = data?.findings || [];
  if (sortBy === 'newest') {
    findings = [...findings].sort((a, b) => new Date(b.firstSeenDate || 0) - new Date(a.firstSeenDate || 0));
  } else if (sortBy === 'confidence') {
    findings = [...findings].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  } else {
    // Default priority
    findings = [...findings].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <ListOrdered className="w-8 h-8 text-cyan-400" />
              Prioritized Security Queue
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active and historical credential findings ranked transparently by impact, presence, and context.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchQueue}
              disabled={loading}
              className="text-xs border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <SecurityNav />

        {/* Filter Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="priority">Priority Score (Highest First)</option>
              <option value="newest">Newest Discovery</option>
              <option value="confidence">Confidence Score</option>
            </select>
          </div>

        </div>

        {/* Queue List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
              Loading prioritized queue...
            </div>
          ) : findings.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              No findings matching the selected filters.
            </div>
          ) : (
            findings.map((f, i) => (
              <div
                key={f.id || i}
                className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold ${
                      f.priorityLevel === 'P0_IMMEDIATE' ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : f.priorityLevel === 'P1_HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {f.priorityLevel || 'P2'} ({f.priorityScore || 50} pts)
                    </span>

                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      f.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : f.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {f.severity}
                    </span>

                    <span className="font-bold text-slate-100 text-sm">{f.ruleName || f.ruleId}</span>
                    <span className="text-xs text-slate-400 font-mono">({f.repositoryName || 'repo'})</span>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    {f.file}:{f.line || 1}
                  </div>
                </div>

                <div className="bg-slate-950/90 rounded p-2.5 font-mono text-xs text-slate-300 border border-slate-800/80 break-all">
                  {f.maskedValue}
                </div>

                {/* Priority Factors Rationale */}
                <div className="pt-1">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">Priority Factors:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(f.priorityFactors || []).map((factor, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-950 text-slate-300 px-2.5 py-1 rounded border border-slate-800">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-500 font-mono">
                    Fingerprint: {f.fingerprint?.slice(0, 12)}...
                  </span>
                  <Link href={`/findings/${f.id || ''}`}>
                    <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      View Finding Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
