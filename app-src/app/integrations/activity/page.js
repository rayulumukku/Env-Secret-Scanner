'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowLeft, RefreshCw, Filter,
  GitBranch, Webhook, Shield, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrationsActivityPage() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [integrationFilter, setIntegrationFilter] = useState('ALL');

  useEffect(() => {
    fetchActivity();
  }, [integrationFilter]);

  async function fetchActivity() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        integrationId: integrationFilter
      }).toString();
      const res = await fetch(`/api/integrations/activity?${query}`);
      const json = await res.json();
      if (json.success) {
        setActivity(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-4 border-b border-slate-800/80 pb-6">
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Integrations
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <Activity className="w-8 h-8 text-cyan-400" />
                Integration Activity Stream
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Audit stream of normalized integration events, pull request audits, and outgoing webhook deliveries.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={fetchActivity}
              disabled={loading}
              className="text-xs border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Activity
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            Filter by Provider:
          </div>

          <select
            value={integrationFilter}
            onChange={e => setIntegrationFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Integrations</option>
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
            <option value="slack">Slack</option>
            <option value="webhooks">Custom Webhooks</option>
          </select>
        </div>

        {/* Activity Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="p-4 font-semibold">Event Type & Provider</th>
                <th className="p-4 font-semibold">Target / Repository</th>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading activity stream...
                  </td>
                </tr>
              ) : activity.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    No integration activity events recorded yet.
                  </td>
                </tr>
              ) : (
                activity.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{evt.eventType || 'Event'}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{evt.integration}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {evt.repositoryName || 'Global'}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                        PROCESSED
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
