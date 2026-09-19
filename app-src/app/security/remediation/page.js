'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wrench, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  ArrowRight, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityRemediationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRemediation();
  }, []);

  async function fetchRemediation() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/remediation');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Wrench className="w-8 h-8 text-cyan-400" />
              Remediation Velocity & Governance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track resolution cycle times, triage statuses, and credential rotation velocity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/remediation">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                Remediation Center
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRemediation}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">Open Findings</div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{data?.open || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Awaiting action</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">Resolved Findings</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{data?.resolved || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Remediated & confirmed</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">Resolution Rate</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{data?.resolutionRate || '0%'}</div>
            <div className="text-xs text-slate-500 mt-1">Overall completion</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">Avg Resolution Time</div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{data?.averageResolutionHours || 0} hrs</div>
            <div className="text-xs text-slate-500 mt-1">From detection to fix</div>
          </div>
        </div>

        {/* Action Queues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Critical Action Items
            </h3>
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs text-slate-300">
              <div className="font-semibold text-slate-200">Critical Findings Awaiting Action</div>
              <div className="text-slate-400 mt-1">
                {data?.criticalAwaitingAction || 0} critical findings currently pending remediation.
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Historical Review Items
            </h3>
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs text-slate-300">
              <div className="font-semibold text-slate-200">Historical Findings Awaiting Audit</div>
              <div className="text-slate-400 mt-1">
                {data?.historicalAwaitingReview || 0} removed secret finding(s) awaiting provider key rotation verification.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
