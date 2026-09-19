'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2, RefreshCw, Shield, AlertTriangle, CheckCircle2,
  ArrowRight, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/projects');
      const json = await res.json();
      if (json.success) {
        setProjects(json.data || []);
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
              <FolderGit2 className="w-8 h-8 text-cyan-400" />
              Project Security Posture
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Project-level protection coverage, repository aggregates, and active security findings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchProjects}
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
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Repositories</th>
                <th className="p-4 font-semibold">Open Findings</th>
                <th className="p-4 font-semibold">Critical Findings</th>
                <th className="p-4 font-semibold">Protection Coverage</th>
                <th className="p-4 font-semibold">Last Audit</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading project posture...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No projects found in organization.
                  </td>
                </tr>
              ) : (
                projects.map(proj => (
                  <tr key={proj.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div>{proj.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{proj.slug}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {proj.repositoriesCount} repos
                    </td>
                    <td className="p-4 font-mono">
                      {proj.openFindings > 0 ? (
                        <span className="text-rose-400 font-bold">{proj.openFindings}</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">0 Clean</span>
                      )}
                    </td>
                    <td className="p-4 font-mono">
                      {proj.criticalFindings > 0 ? (
                        <span className="text-rose-400 font-bold">{proj.criticalFindings}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold text-emerald-400 font-mono">
                        {proj.protectionCoverage}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {proj.lastScan || 'Never'}
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/projects/${proj.id}`}>
                        <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1">
                          View Project <ArrowRight className="w-3 h-3" />
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
