'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  GitCompare, ArrowLeft, Shield, AlertTriangle, CheckCircle2,
  GitBranch, RefreshCw, AlertCircle, Check, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BranchComparePage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const projectId = params.id;

  const [baseBranch, setBaseBranch] = useState('main');
  const [compareBranch, setCompareBranch] = useState('feature/payment-api');
  const [activeTab, setActiveTab] = useState('new');
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState(null);

  const availableBranches = ['main', 'develop', 'feature/payment-api', 'fix/auth-tokens', 'staging'];

  useEffect(() => {
    fetchComparison();
  }, [projectId, baseBranch, compareBranch]);

  async function fetchComparison() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/compare?base=${encodeURIComponent(baseBranch)}&compare=${encodeURIComponent(compareBranch)}`);
      const data = await res.json();
      if (data.success) {
        setComparison(data.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const newFindings = comparison?.newFindings || [];
  const resolvedFindings = comparison?.resolvedFindings || [];
  const persistentFindings = comparison?.persistentFindings || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Project
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <GitCompare className="w-8 h-8 text-cyan-400" />
              Branch Security Comparison
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Correlate secret fingerprints across branches to pinpoint new vs pre-existing credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchComparison}
              disabled={loading}
              className="border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Branch Selector Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Base Branch */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Base Branch (Target)
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <select
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {availableBranches.map(b => (
                    <option key={`base_${b}`} value={b} disabled={b === compareBranch}>
                      {b} {b === 'main' ? '(default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compare Branch */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Compare Branch (Feature / PR)
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <select
                  value={compareBranch}
                  onChange={(e) => setCompareBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {availableBranches.map(b => (
                    <option key={`comp_${b}`} value={b} disabled={b === baseBranch}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Verdict Banner */}
        {comparison && (
          <div className={`p-5 rounded-xl border flex items-center justify-between gap-4 ${
            newFindings.length > 0
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
          }`}>
            <div className="flex items-center gap-3">
              {newFindings.length > 0 ? (
                <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              )}
              <div>
                <div className="font-semibold text-base">
                  {newFindings.length > 0
                    ? `Security Warning: ${newFindings.length} new secret(s) introduced in ${compareBranch}`
                    : `Safe to Merge: No new credentials introduced compared to ${baseBranch}`}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Fingerprint matching verified against {comparison.statistics?.baseTotal || 0} findings in {baseBranch}.
                </div>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              newFindings.length > 0 ? 'bg-rose-900/50 text-rose-300 border border-rose-700' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
            }`}>
              {newFindings.length > 0 ? 'BLOCKING SECRETS' : 'PASSED'}
            </span>
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <button
            onClick={() => setActiveTab('new')}
            className={`text-left p-5 rounded-xl border transition-all ${
              activeTab === 'new'
                ? 'bg-rose-950/20 border-rose-500 ring-1 ring-rose-500'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
              Newly Introduced
            </div>
            <div className="text-3xl font-bold text-slate-100">{newFindings.length}</div>
            <div className="text-xs text-slate-400 mt-1">Found only in {compareBranch}</div>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`text-left p-5 rounded-xl border transition-all ${
              activeTab === 'resolved'
                ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Resolved in Branch
            </div>
            <div className="text-3xl font-bold text-slate-100">{resolvedFindings.length}</div>
            <div className="text-xs text-slate-400 mt-1">Existed in {baseBranch}, removed in {compareBranch}</div>
          </button>

          <button
            onClick={() => setActiveTab('persistent')}
            className={`text-left p-5 rounded-xl border transition-all ${
              activeTab === 'persistent'
                ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Pre-Existing (Persistent)
            </div>
            <div className="text-3xl font-bold text-slate-100">{persistentFindings.length}</div>
            <div className="text-xs text-slate-400 mt-1">Present in both branches (not introduced by this diff)</div>
          </button>

        </div>

        {/* Findings List Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-200">
              {activeTab === 'new' && `Newly Introduced Secrets (${newFindings.length})`}
              {activeTab === 'resolved' && `Resolved Findings (${resolvedFindings.length})`}
              {activeTab === 'persistent' && `Pre-Existing Base Findings (${persistentFindings.length})`}
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              Comparing branch fingerprints...
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'new' && (
                newFindings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    No new secrets introduced in this branch.
                  </div>
                ) : (
                  newFindings.map((f, i) => <FindingCard key={`new_${i}`} finding={f} type="new" />)
                )
              )}

              {activeTab === 'resolved' && (
                resolvedFindings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-lg">
                    No historical findings were resolved in this branch.
                  </div>
                ) : (
                  resolvedFindings.map((f, i) => <FindingCard key={`res_${i}`} finding={f} type="resolved" />)
                )
              )}

              {activeTab === 'persistent' && (
                persistentFindings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-lg">
                    No pre-existing secrets detected in base branch.
                  </div>
                ) : (
                  persistentFindings.map((f, i) => <FindingCard key={`per_${i}`} finding={f} type="persistent" />)
                )
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function FindingCard({ finding, type }) {
  const isNew = type === 'new';
  const isResolved = type === 'resolved';

  return (
    <div className={`p-4 rounded-lg border ${
      isNew
        ? 'bg-rose-950/20 border-rose-800/40'
        : isResolved
        ? 'bg-emerald-950/20 border-emerald-800/40'
        : 'bg-slate-950/60 border-slate-800/80'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            finding.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800'
            : finding.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800'
            : 'bg-amber-950 text-amber-300 border border-amber-800'
          }`}>
            {finding.severity}
          </span>
          <span className="font-semibold text-slate-200">{finding.ruleName || finding.ruleId}</span>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {finding.file}:{finding.line || 1}
        </span>
      </div>

      <div className="bg-slate-950/90 rounded border border-slate-800/80 p-2.5 font-mono text-xs text-slate-300 mb-2 break-all">
        {finding.maskedValue}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Fingerprint: <code className="text-slate-300">{finding.fingerprint?.slice(0, 10)}...</code></span>
        {finding.id && (
          <Link href={`/findings/${finding.id}`} className="text-cyan-400 hover:underline flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> View Details
          </Link>
        )}
      </div>
    </div>
  );
}
