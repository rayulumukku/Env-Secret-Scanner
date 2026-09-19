'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitBranch, RefreshCw, Shield, AlertTriangle, CheckCircle2,
  ExternalLink, ArrowRight, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityRepositoriesPage() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepositories();
  }, []);

  async function fetchRepositories() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/repositories');
      const json = await res.json();
      if (json.success) {
        setRepositories(json.data || []);
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
              <GitBranch className="w-8 h-8 text-cyan-400" />
              Repository Security Posture
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Factual security coverage, protection status, and scan state across all organization repositories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRepositories}
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

        {/* Table View */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="p-4 font-semibold">Repository</th>
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Protection Status</th>
                <th className="p-4 font-semibold">Current Secrets</th>
                <th className="p-4 font-semibold">Historical Exposure</th>
                <th className="p-4 font-semibold">CI / PR Protection</th>
                <th className="p-4 font-semibold">Last Audit</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading repository posture...
                  </td>
                </tr>
              ) : repositories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No repositories connected yet.
                  </td>
                </tr>
              ) : (
                repositories.map(repo => (
                  <tr key={repo.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      {repo.name}
                    </td>
                    <td className="p-4 text-slate-400">
                      {repo.projectName || 'Default'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        repo.status === 'PROTECTED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {repo.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono">
                      {repo.currentFindings > 0 ? (
                        <span className="text-rose-400 font-bold">{repo.currentFindings}</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">0 Clean</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {repo.historicalFindings || 0}
                    </td>
                    <td className="p-4 text-[11px] text-slate-300">
                      <div>PR: <span className="font-semibold">{repo.prProtection}</span></div>
                      <div className="text-slate-500 text-[10px]">{repo.ciProtection}</div>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {repo.lastScan || 'Never'}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/projects/${repo.projectId || 'proj_core'}`}>
                        <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1">
                          Manage <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
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
