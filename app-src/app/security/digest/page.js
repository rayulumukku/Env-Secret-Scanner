'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, RefreshCw, CheckCircle2, AlertTriangle, Shield,
  Copy, Check, Calendar, ArrowRight, GitBranch, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityDigestPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDigest();
  }, []);

  async function fetchDigest() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/digest');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  function handleCopySummary() {
    if (!data?.digestStatement) return;
    navigator.clipboard.writeText(
      `SecretShield Security Digest (${new Date(data.dateGenerated).toLocaleDateString()}):\n` +
      `- Scans Completed: ${data.scansCompleted}\n` +
      `- Repositories Monitored: ${data.repositoriesScanned}\n` +
      `- Pull Requests Audited: ${data.prsScanned}\n` +
      `- Resolved Findings: ${data.resolvedFindings}\n` +
      `- Active Critical: ${data.criticalFindingsOpen}\n` +
      `- Active High: ${data.highFindingsOpen}\n\n` +
      `Summary: ${data.digestStatement}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyan-400" />
              Security Digest & Weekly Brief
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Factual, non-speculative summary of recent scanning velocity, findings triage, and repository posture.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySummary}
              disabled={loading || !data}
              className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              {copied ? 'Copied Brief' : 'Copy Brief'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchDigest}
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

        {/* Digest Hero Card */}
        <div className="bg-gradient-to-r from-slate-900/90 to-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                Latest Organization Pulse
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                Weekly Posture & Triage Summary
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Generated: {data?.dateGenerated ? new Date(data.dateGenerated).toLocaleString() : 'Loading...'}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
              Generating factual digest...
            </div>
          ) : (
            <>
              {/* Highlight Statement */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-sm text-slate-200 leading-relaxed font-medium">
                {data?.digestStatement}
              </div>

              {/* Factual Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Scans Executed</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    {data?.scansCompleted || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Across CI, CLI & Web</div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Repositories Monitored</div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                    {data?.repositoriesScanned || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">In active protection</div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Pull Requests Audited</div>
                  <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                    {data?.prsScanned || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Diffs analyzed pre-merge</div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Findings Remediated</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {data?.resolvedFindings || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Resolved this cycle</div>
                </div>
              </div>

              {/* Actionable Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">Triage Priority Queue</h3>
                    <p className="text-xs text-slate-400">
                      {data?.highFindingsOpen || 0} high-priority finding requires review.
                    </p>
                  </div>
                  <Link href="/security/queue">
                    <Button size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 gap-1">
                      Open Queue <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">Export Executive Report</h3>
                    <p className="text-xs text-slate-400">
                      Generate printable PDF/HTML or CSV findings export.
                    </p>
                  </div>
                  <Link href="/security/report">
                    <Button size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 gap-1">
                      Generate Report <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
