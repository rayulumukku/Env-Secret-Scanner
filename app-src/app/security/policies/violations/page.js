'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle, RefreshCw, CheckCircle2, Shield,
  Filter, Check, ArrowRight, GitBranch, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function PolicyViolationsPage() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionReason, setResolutionReason] = useState('');

  useEffect(() => {
    fetchViolations();
  }, [severityFilter, statusFilter]);

  async function fetchViolations() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        severity: severityFilter,
        status: statusFilter
      }).toString();
      const res = await fetch(`/api/policies/violations?${query}`);
      const json = await res.json();
      if (json.success) {
        setViolations(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleResolve(violationId) {
    try {
      const res = await fetch(`/api/policies/violations/${violationId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: resolutionReason || 'Approved security waiver / remediated' })
      });
      const json = await res.json();
      if (json.success) {
        setResolvingId(null);
        setResolutionReason('');
        fetchViolations();
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              Security Policy Violations
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active and resolved policy non-compliance events across evaluated repositories, pull requests, and CI runs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings/policies">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Manage Policies
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchViolations}
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

        {/* Filter Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            Filter Violations:
          </div>

          <div className="flex items-center gap-3">
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="RESOLVED">Resolved Only</option>
            </select>
          </div>
        </div>

        {/* Violations Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="p-4 font-semibold">Policy Name</th>
                <th className="p-4 font-semibold">Repository & Target</th>
                <th className="p-4 font-semibold">Severity</th>
                <th className="p-4 font-semibold">Masked Value</th>
                <th className="p-4 font-semibold">Actions Triggered</th>
                <th className="p-4 font-semibold">Detected At</th>
                <th className="p-4 font-semibold text-right">Status / Resolve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading policy violations...
                  </td>
                </tr>
              ) : violations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    No policy violations found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                violations.map(v => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{v.policyName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">v{v.policyVersion} &bull; {v.scope}</div>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                        {v.repositoryName}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {v.branch ? `branch: ${v.branch}` : ''} {v.prNumber ? `(PR #${v.prNumber})` : ''}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        v.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        v.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {v.severity}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      <code>{v.maskedValue || '••••••••'}</code>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {v.actions?.map(act => (
                          <span key={act} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            {act}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="p-4 text-right">
                      {v.status === 'RESOLVED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : resolvingId === v.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="text"
                            placeholder="Resolution reason..."
                            value={resolutionReason}
                            onChange={e => setResolutionReason(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleResolve(v.id)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setResolvingId(null)}
                            className="h-7 text-xs text-slate-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResolvingId(v.id)}
                          className="text-xs border-slate-800 hover:bg-slate-800 text-slate-300 h-7"
                        >
                          Resolve Waiver
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
