'use client';

/**
 * app/projects/[id]/pull-requests/page.js
 *
 * Project Pull Requests Security Dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  GitPullRequest, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowLeft, 
  RefreshCw,
  ExternalLink,
  GitBranch
} from 'lucide-react';

export default function ProjectPullRequestsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [projRes, prsRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/pull-requests`),
      ]);

      if (projRes.ok) {
        const projData = await projRes.json();
        setProject(projData);
      }
      if (prsRes.ok) {
        const prsData = await prsRes.json();
        setPrs(prsData.pullRequests || []);
      }
    } catch (err) {
      console.error('Failed to load project PRs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Project
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <GitPullRequest className="w-6 h-6 text-indigo-400" />
                Pull Request Security Scans
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time secret scanning results and GitHub Check status for pull requests in {project?.name || 'project'}.
              </p>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* PR List */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden">
          {prs.length === 0 ? (
            <div className="p-12 text-center">
              <GitPullRequest className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h2 className="text-sm font-semibold text-gray-300">No Pull Requests Scanned Yet</h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Install SecretShield on your GitHub repository to automatically scan PRs and prevent secrets from merging.
              </p>
              <div className="mt-4">
                <Link
                  href="/integrations/github"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Configure GitHub App
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {prs.map(pr => {
                const isPassed = pr.checkConclusion === 'success' || pr.findingCount === 0;

                return (
                  <div key={pr.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-900/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isPassed ? (
                          <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-400">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">#{pr.pullNumber}</span>
                          <span className="text-sm font-semibold text-gray-200">{pr.title}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            isPassed
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                              : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                          }`}>
                            {isPassed ? 'Passed' : 'Action Required'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1.5">
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-gray-500" />
                            <code className="text-indigo-300 font-mono text-[11px]">{pr.branch}</code> → <code className="text-gray-400 font-mono text-[11px]">{pr.targetBranch}</code>
                          </span>
                          <span>by <strong>{pr.author || 'unknown'}</strong></span>
                          <span>• Scanned: {new Date(pr.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>• {pr.filesScanned} files</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="flex items-center gap-2 text-xs">
                        {pr.criticalCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-semibold">
                            {pr.criticalCount} Critical
                          </span>
                        )}
                        {pr.highCount > 0 && (
                          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded font-semibold">
                            {pr.highCount} High
                          </span>
                        )}
                        {pr.findingCount === 0 && (
                          <span className="text-emerald-400 text-xs font-medium">0 Findings</span>
                        )}
                      </div>

                      <Link
                        href={`/findings?project=${id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        View Findings <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
