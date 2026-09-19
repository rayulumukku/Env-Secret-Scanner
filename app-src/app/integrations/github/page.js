'use client';

/**
 * app/integrations/github/page.js
 *
 * GitHub App Connection, Installation & Repository Sync.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  GitBranch, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  Plus, 
  FolderGit2, 
  ArrowLeft,
  KeyRound,
  FileCheck
} from 'lucide-react';

export default function GitHubIntegrationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState(null);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/github');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching GitHub status:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect GitHub App? Secret scans will no longer trigger on pushes.')) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/github', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'GitHub App disconnected successfully.' });
        fetchStatus();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Integrations
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <GitBranch className="w-6 h-6 text-indigo-400" />
              GitHub App Integration
            </h1>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Automate secret detection across pull requests and pushes using GitHub Checks and real-time status annotations.
          </p>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            {message.text}
          </div>
        )}

        {/* Configuration State */}
        {!data?.isConfigured ? (
          <div className="bg-[#161b22] border border-amber-800/60 rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">GitHub App Setup Required</h2>
                <p className="text-xs text-gray-300 mt-1">
                  To enable automatic PR scanning and push verification, register a GitHub App and set the required environment variables.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-xs text-gray-300">
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg space-y-3">
                <h3 className="font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Step 1: Create a GitHub App
                </h3>
                <p className="text-gray-400">
                  Navigate to <strong>GitHub &gt; Settings &gt; Developer Settings &gt; GitHub Apps &gt; New GitHub App</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 bg-[#0d1117] rounded border border-gray-800">
                    <span className="text-gray-400 block font-mono">Webhook URL:</span>
                    <span className="font-mono text-indigo-300">https://your-domain.com/api/webhooks/github</span>
                  </div>
                  <div className="p-2.5 bg-[#0d1117] rounded border border-gray-800">
                    <span className="text-gray-400 block font-mono">Webhook Secret:</span>
                    <span className="font-mono text-indigo-300">GITHUB_WEBHOOK_SECRET</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  Step 2: Required Permissions &amp; Events
                </h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  <li><strong>Repository Permissions</strong>: Contents (Read), Pull Requests (Read), Checks (Read &amp; Write)</li>
                  <li><strong>Subscribe to Events</strong>: Push, Pull Request, Installation, Installation Repositories</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Step 3: Set Environment Variables
                </h3>
                <pre className="p-3 bg-[#0d1117] border border-gray-800 rounded text-gray-300 font-mono text-xs overflow-x-auto">
{`GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your_secure_random_secret"`}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected App Status Card */}
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">GitHub App Ready</h2>
                    <p className="text-xs text-gray-400 mt-0.5">App ID: #{data.appId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {data.installUrl && (
                    <a
                      href={data.installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Install on Repositories
                    </a>
                  )}
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 border border-gray-800 hover:border-rose-900/60 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Installations List */}
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-gray-400">
                Connected GitHub Accounts &amp; Organizations ({data.installations?.length || 0})
              </h2>

              {data.installations?.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  No active GitHub installations found. Click "Install on Repositories" above to grant access.
                </div>
              ) : (
                <div className="divide-y divide-gray-800 mt-4">
                  {data.installations?.map(inst => (
                    <div key={inst.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {inst.avatarUrl && (
                          <img src={inst.avatarUrl} alt={inst.account} className="w-8 h-8 rounded-full border border-gray-700" />
                        )}
                        <div>
                          <div className="text-sm font-semibold text-white">{inst.account}</div>
                          <div className="text-xs text-gray-500 capitalize">{inst.targetType} Installation</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 text-xs bg-gray-900 border border-gray-800 rounded-full text-gray-400">
                          {inst.repositoriesCount || 'All'} Repositories
                        </span>
                        <Link
                          href="/projects"
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                        >
                          Attach to Projects <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
