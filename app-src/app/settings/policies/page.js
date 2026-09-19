'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Plus, Play, AlertCircle, CheckCircle2,
  AlertTriangle, RefreshCw, Trash2, Edit3, GitBranch,
  Layers, ArrowRight, Sparkles, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PoliciesSettingsPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    setLoading(true);
    try {
      const res = await fetch('/api/policies');
      const json = await res.json();
      if (json.success) {
        setPolicies(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleToggle(policy) {
    setTogglingId(policy.id);
    try {
      const res = await fetch(`/api/policies/${policy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !policy.enabled })
      });
      const json = await res.json();
      if (json.success) {
        setPolicies(prev => prev.map(p => p.id === policy.id ? json.data : p));
      }
    } catch {}
    finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(policyId) {
    if (!confirm('Are you sure you want to delete this security policy?')) return;
    try {
      const res = await fetch(`/api/policies/${policyId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPolicies(prev => prev.filter(p => p.id !== policyId));
      }
    } catch {}
  }

  const customPolicies = policies.filter(p => !p.isDefault);
  const recommendedPolicies = policies.filter(p => p.isDefault);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              Security Policies & Governance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Define enforceable rules across organizations, projects, and repositories for CI gating, PR blocking, and remediation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/security/policies/violations">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                Active Violations
              </Button>
            </Link>
            <Link href="/settings/policies/simulator">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Policy Simulator
              </Button>
            </Link>
            <Link href="/settings/policies/new">
              <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5 shadow-lg shadow-cyan-950">
                <Plus className="w-3.5 h-3.5" />
                New Policy
              </Button>
            </Link>
          </div>
        </div>

        {/* Scope Hierarchy Banner */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-slate-100">Deterministic Scope Precedence:</strong> Repository Policy overrides Project Policy, which overrides Organization Policy.
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Server-Side Evaluation</span>
        </div>

        {/* Active Policies Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Active Organization Policies ({policies.length})
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchPolicies}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                  <th className="p-4 font-semibold">Policy Name & Summary</th>
                  <th className="p-4 font-semibold">Scope</th>
                  <th className="p-4 font-semibold">Conditions</th>
                  <th className="p-4 font-semibold">Actions</th>
                  <th className="p-4 font-semibold text-center">Version</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                      Loading configured policies...
                    </td>
                  </tr>
                ) : policies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      No policies configured yet. Select a recommended policy below or create a custom policy.
                    </td>
                  </tr>
                ) : (
                  policies.map(policy => (
                    <tr key={policy.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{policy.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{policy.description}</div>
                      </td>

                      <td className="p-4 font-mono">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          policy.scope === 'ORGANIZATION' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                          policy.scope === 'PROJECT' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                          'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}>
                          {policy.scope}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="text-slate-300 font-medium">
                          {policy.conditions?.length || 0} rule(s)
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">AND logic</div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {policy.actions?.map(act => (
                            <span
                              key={act}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                act.startsWith('FAIL') ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                act === 'WARN' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 text-center font-mono text-slate-400">
                        v{policy.version || 1}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggle(policy)}
                          disabled={togglingId === policy.id}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            policy.enabled ? 'bg-emerald-600' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              policy.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/settings/policies/${policy.id}/edit`}>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {!policy.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(policy.id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Presets */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              Recommended Security Presets (Opt-In)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedPolicies.map(p => (
              <div
                key={p.id}
                className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                      RECOMMENDED
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">v{p.version || 1}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex gap-1">
                    {p.actions.map(act => (
                      <span key={act} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {act}
                      </span>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant={p.enabled ? 'outline' : 'default'}
                    onClick={() => handleToggle(p)}
                    disabled={togglingId === p.id}
                    className={`text-xs h-7 ${p.enabled ? 'border-emerald-800 text-emerald-400' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                  >
                    {p.enabled ? 'Active' : 'Enable'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
