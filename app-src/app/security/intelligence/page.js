'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SecurityIntelligencePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/security/intelligence')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-10 text-slate-300">Loading unified intelligence…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2 text-cyan-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Security Intelligence</h1>
              <p className="text-sm text-slate-400">Unified security signals, graph context, and attack-surface reasoning.</p>
            </div>
          </div>
          <Link href="/security">
            <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">
              Back to command center
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-400">Total Signals</div>
            <div className="mt-2 text-3xl font-bold text-cyan-400">{data?.totals?.totalSignals ?? 0}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-400">Critical</div>
            <div className="mt-2 text-3xl font-bold text-rose-400">{data?.totals?.critical ?? 0}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-400">High</div>
            <div className="mt-2 text-3xl font-bold text-orange-400">{data?.totals?.high ?? 0}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Activity className="h-4 w-4 text-cyan-400" />
              Recent signals
            </div>
            <div className="space-y-3">
              {(data?.signals || []).map((signal) => (
                <div key={signal.signalId} className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-100">{signal.type}</div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase text-cyan-300">{signal.severity}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                    {signal.entityType} / {signal.entityId}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <ArrowRight className="h-4 w-4 text-cyan-400" />
              Intelligence posture
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-200">
              {data?.posture || 'STABLE'}
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              {Object.entries(data?.byType || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span>{key}</span>
                  <span className="font-mono text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
