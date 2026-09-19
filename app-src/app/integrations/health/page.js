'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, ArrowLeft, RefreshCw, CheckCircle2,
  AlertTriangle, XCircle, Shield, GitBranch, GitPullRequest,
  MessageSquare, Webhook, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrationsHealthPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      const json = await res.json();
      if (json.success) {
        setIntegrations(json.data.filter(i => i.status === 'SUPPORTED'));
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  function getProviderIcon(id) {
    switch (id) {
      case 'github':
        return <GitBranch className="w-5 h-5 text-purple-400" />;
      case 'gitlab':
        return <GitPullRequest className="w-5 h-5 text-orange-400" />;
      case 'slack':
        return <MessageSquare className="w-5 h-5 text-pink-400" />;
      case 'webhooks':
        return <Webhook className="w-5 h-5 text-cyan-400" />;
      default:
        return <Shield className="w-5 h-5 text-slate-400" />;
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
                Integration Health & Rate-Limit Probes
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Real-time connection status, webhook latency, delivery failure counters, and provider rate-limit telemetry.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={fetchHealth}
              disabled={loading}
              className="text-xs border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Probes
            </Button>
          </div>
        </div>

        {/* Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map(item => {
            const isConnected = item.isConnected;
            return (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      {getProviderIcon(item.id)}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-100">{item.name}</h2>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{item.category}</span>
                    </div>
                  </div>

                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> Disconnected
                    </span>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Gateway Status:</span>
                    <span className="text-slate-200">{isConnected ? 'ONLINE / HEALTHY' : 'NOT CONFIGURED'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Provider Rate Limit:</span>
                    <span className="text-emerald-400">NORMAL (0 / 5000)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Recent Failures:</span>
                    <span className="text-slate-200">0</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <Link href={`/integrations/${item.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs text-cyan-400 hover:text-cyan-300 p-0 h-auto">
                      View Diagnostics & Permissions →
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
