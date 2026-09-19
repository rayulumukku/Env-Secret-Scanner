'use client';

/**
 * app/integrations/page.js
 *
 * Integrations Health & Management Hub.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  GitBranch, 
  MessageSquare, 
  Webhook, 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowUpRight, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchIntegrations() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      setIntegrations(data);
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const cards = [
    {
      key: 'github',
      title: 'GitHub App',
      icon: GitBranch,
      desc: 'Automatic push & PR secret scanning with GitHub Checks & zero-exposure annotations.',
      manageUrl: '/integrations/github',
      docsUrl: '/docs/github-protection',
    },
    {
      key: 'gitlab',
      title: 'GitLab Webhooks',
      icon: Cpu,
      desc: 'Webhook-driven secret scanning for GitLab pushes and merge requests.',
      manageUrl: '/docs',
      docsUrl: '/docs',
    },
    {
      key: 'slack',
      title: 'Slack Alerts',
      icon: MessageSquare,
      desc: 'Instant Block Kit incident cards for critical & high secrets in team channels.',
      manageUrl: '/integrations/slack',
      docsUrl: '/integrations/slack',
    },
    {
      key: 'webhooks',
      title: 'Custom Webhooks',
      icon: Webhook,
      desc: 'HMAC-SHA256 signed event streams for custom SIEM, SOAR, or incident management.',
      manageUrl: '/settings',
      docsUrl: '/docs',
    },
    {
      key: 'cli',
      title: 'Developer CLI',
      icon: Terminal,
      desc: 'Pre-commit and staged scanning with zero credential persistence or transmission.',
      manageUrl: '/docs',
      docsUrl: '/docs',
    },
    {
      key: 'cicd',
      title: 'CI/CD Pipelines',
      icon: ShieldCheck,
      desc: 'GitHub Actions, GitLab CI workflows, and SARIF 2.1.0 security ingestion.',
      manageUrl: '/docs',
      docsUrl: '/docs',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Integrations & Developer Workflows
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Connect SecretShield to your source code providers, communication channels, and automated CI/CD pipelines.
            </p>
          </div>
          <button
            onClick={fetchIntegrations}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-xs font-medium text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {cards.map(c => {
            const data = integrations?.[c.key];
            const Icon = c.icon;
            const isConnected = data?.isConnected || data?.status === 'AVAILABLE';

            let badgeBg = 'bg-gray-800 text-gray-400 border-gray-700';
            let badgeText = data?.status || 'NOT CONFIGURED';

            if (data?.status === 'CONNECTED' || data?.status === 'AVAILABLE') {
              badgeBg = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
              badgeText = data.status === 'AVAILABLE' ? 'Active' : 'Connected';
            } else if (data?.status === 'READY_TO_CONNECT') {
              badgeBg = 'bg-blue-950/60 text-blue-400 border-blue-800/60';
              badgeText = 'Ready to Connect';
            } else if (data?.status === 'CONFIG_REQUIRED') {
              badgeBg = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
              badgeText = 'Setup Required';
            }

            return (
              <div
                key={c.key}
                className="bg-[#161b22] border border-gray-800 hover:border-gray-700 rounded-xl p-6 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg text-indigo-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeBg}`}>
                      {badgeText}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mt-4">{c.title}</h2>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{c.desc}</p>

                  {data?.accountName && (
                    <div className="mt-4 p-2.5 bg-gray-900/80 border border-gray-800 rounded-lg text-xs">
                      <span className="text-gray-500">Connected to: </span>
                      <span className="font-semibold text-gray-200">{data.accountName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between">
                  <Link
                    href={c.docsUrl}
                    className="text-xs font-medium text-gray-400 hover:text-gray-300 flex items-center gap-1"
                  >
                    Documentation <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Link
                    href={c.manageUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    Manage <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
