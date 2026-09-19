'use client';

/**
 * app/projects/[id]/activity/page.js
 *
 * Project Security Event Timeline & Activity Feed.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  GitBranch, 
  Webhook, 
  RefreshCw, 
  ArrowLeft, 
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function ProjectActivityPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [activity, setActivity] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [projRes, actRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/activity${filterType !== 'ALL' ? `?type=${filterType}` : ''}`),
      ]);

      if (projRes.ok) {
        const projData = await projRes.json();
        setProject(projData);
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivity(actData.activity || []);
      }
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [id, filterType]);

  function getEventIcon(type) {
    switch (type) {
      case 'CRITICAL_FINDING':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'SCAN_COMPLETED':
      case 'FINDING_RESOLVED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'PR_SCANNED':
        return <GitPullRequest className="w-4 h-4 text-indigo-400" />;
      case 'WEBHOOK_RECEIVED':
        return <Webhook className="w-4 h-4 text-blue-400" />;
      case 'REPOSITORY_CONNECTED':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Activity className="w-6 h-6 text-indigo-400" />
                Security Activity Timeline
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time security event feed for {project?.name || 'project'}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="CRITICAL_FINDING">Critical Findings</option>
                <option value="SCAN_COMPLETED">Scans Completed</option>
                <option value="PR_SCANNED">Pull Request Scans</option>
                <option value="WEBHOOK_RECEIVED">Webhooks Received</option>
              </select>

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
        </div>

        {/* Timeline List */}
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
          {activity.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">
              No security activity recorded yet for this project.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800">
              {activity.map(evt => (
                <div key={evt.id} className="relative flex items-start gap-4">
                  <div className="absolute -left-6 mt-1 p-1 bg-[#161b22] border border-gray-800 rounded-full">
                    {getEventIcon(evt.type)}
                  </div>

                  <div className="flex-1 bg-gray-900/60 border border-gray-800/80 rounded-lg p-3.5 hover:border-gray-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-semibold text-xs text-white">{evt.title}</div>
                      <div className="text-[11px] text-gray-500">
                        {new Date(evt.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-gray-400 mt-1">{evt.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-800/60">
                      <span>Actor: <strong className="text-gray-400">{evt.actor}</strong></span>
                      {evt.repositoryName && (
                        <span>• Repo: <strong className="text-gray-400 font-mono">{evt.repositoryName}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
