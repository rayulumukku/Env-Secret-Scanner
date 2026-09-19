'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal, RefreshCw, CheckCircle2, XCircle, Shield,
  GitBranch, ArrowRight, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityCIPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCI();
  }, []);

  async function fetchCI() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/ci');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const repositories = data?.repositories || [];
  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Terminal className="w-8 h-8 text-cyan-400" />
              CI/CD & Git Hook Protection
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify pipeline gate coverage across GitHub Actions, GitLab CI, pre-commit hooks, and CLI tools.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/docs/github-actions">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                Setup Guide
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchCI}
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
            <div className="text-xs text-slate-400 font-semibold">GitHub Actions</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{summary?.githubActionsCount || 0} Repos</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">GitLab CI</div>
            <div className="text-2xl font-bold font-mono text-slate-300 mt-1">{summary?.gitlabCiCount || 0} Repos</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">Pre-Commit Hooks</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{summary?.preCommitCount || 0} Configured</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="text-xs text-slate-400 font-semibold">CLI Tooling</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{summary?.cliActiveCount || 0} Active</div>
          </div>
        </div>

        {/* Repository CI Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="p-4 font-semibold">Repository</th>
                <th className="p-4 font-semibold">GitHub Actions</th>
                <th className="p-4 font-semibold">GitLab CI</th>
                <th className="p-4 font-semibold">Pre-Commit Hook</th>
                <th className="p-4 font-semibold">CLI Scanning</th>
                <th className="p-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading CI protection status...
                  </td>
                </tr>
              ) : (
                repositories.map(repo => (
                  <tr key={repo.name} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      {repo.name}
                    </td>
                    <td className="p-4">
                      {repo.githubActions ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Not enabled
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {repo.gitlabCi ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Not enabled
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {repo.preCommit ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {repo.cli ? (
                        <span className="text-cyan-400 font-semibold">Enabled</span>
                      ) : (
                        <span className="text-slate-500">Disabled</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        repo.status === 'PROTECTED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {repo.status}
                      </span>
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
