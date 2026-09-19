'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye, RefreshCw, Shield, AlertTriangle, CheckCircle2,
  GitBranch, Clock, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityExposurePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExposure();
  }, []);

  async function fetchExposure() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/exposure');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const exposures = data?.exposures || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Eye className="w-8 h-8 text-cyan-400" />
              Secret Exposure & Correlation Analysis
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic fingerprint correlation across repository history, multiple codebases, and branch lifecycles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchExposure}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-rose-400 font-semibold uppercase">Active Exposures</div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{data?.activeExposures || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Present in current source tree</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold uppercase">Historical Exposures</div>
            <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{data?.historicalExposures || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Removed from HEAD (rotate advised)</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-amber-400 font-semibold uppercase">Cross-Repo Reused Secrets</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{data?.multiRepoOccurrences || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Detected across &gt;1 repositories</div>
          </div>
        </div>

        {/* Exposure Items List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            Fingerprint Exposure Registry
          </h2>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
              Aggregating exposure fingerprints...
            </div>
          ) : exposures.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-lg">
              No exposed credentials detected.
            </div>
          ) : (
            <div className="space-y-4">
              {exposures.map((exp, i) => (
                <div key={exp.fingerprint || i} className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold ${
                        exp.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-orange-950 text-orange-300 border border-orange-800'
                      }`}>
                        {exp.severity}
                      </span>
                      <span className="font-bold text-slate-100 text-sm">{exp.ruleName}</span>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-semibold ${
                      exp.currentStatus === 'ACTIVE_IN_SOURCE'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {exp.currentStatus === 'ACTIVE_IN_SOURCE' ? 'ACTIVE IN SOURCE' : 'REMOVED FROM CURRENT SOURCE'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 rounded p-2.5 font-mono text-xs text-slate-300 border border-slate-800/60 break-all">
                    {exp.maskedValue}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500">First Detected:</span>{' '}
                      <span className="font-mono text-slate-300">{exp.firstDetected}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Detected:</span>{' '}
                      <span className="font-mono text-slate-300">{exp.lastDetected}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Occurrences:</span>{' '}
                      <span className="font-mono text-slate-300">{exp.occurrences} location(s)</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Repositories:</span>{' '}
                      <span className="font-mono text-slate-300">{(exp.repositories || []).join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
