'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plug, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  ExternalLink, GitBranch, GitPullRequest, MessageSquare, Terminal, Webhook, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityIntegrationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    setLoading(true);
    try {
      const res = await fetch('/api/security/integrations');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const integrations = data?.integrations || [];

  function getProviderIcon(provider) {
    switch (provider) {
      case 'GITHUB':
        return <GitBranch className="w-5 h-5 text-purple-400" />;
      case 'GITLAB':
        return <GitPullRequest className="w-5 h-5 text-orange-400" />;
      case 'SLACK':
        return <MessageSquare className="w-5 h-5 text-pink-400" />;
      case 'WEBHOOK':
        return <Webhook className="w-5 h-5 text-cyan-400" />;
      case 'CLI':
        return <Terminal className="w-5 h-5 text-emerald-400" />;
      default:
        return <Plug className="w-5 h-5 text-slate-400" />;
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'CONNECTED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configured
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Degraded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3.5 h-3.5" /> Not Configured
          </span>
        );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Plug className="w-8 h-8 text-cyan-400" />
              Integration Health & Gateways
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor security webhooks, GitHub/GitLab Apps, notifications, and CLI developer agents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <Button size="sm" variant="outline" className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                Manage Keys & Webhooks
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchIntegrations}
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

        {/* Integration Security Notice */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-100">Zero Credential Exposure Guarantee:</span> SecretShield integration health probes verify webhook handshake integrity, permission scopes, and event delivery latency without storing or displaying sensitive authorization tokens in telemetry responses.
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-400" />
              Checking integration connectivity...
            </div>
          ) : (
            integrations.map((item, idx) => (
              <div
                key={item.provider || idx}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        {getProviderIcon(item.provider)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{item.name}</h3>
                        <span className="text-[11px] font-mono text-slate-500 uppercase">{item.provider}</span>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                    <div className="flex items-center justify-between">
                      <span>Last Event:</span>
                      <span className="font-mono text-slate-200">{item.lastEvent || 'Never'}</span>
                    </div>

                    {item.channel && (
                      <div className="flex items-center justify-between">
                        <span>Target Channel:</span>
                        <span className="font-mono text-pink-300">{item.channel}</span>
                      </div>
                    )}

                    {item.activeEndpoints !== undefined && (
                      <div className="flex items-center justify-between">
                        <span>Active Endpoints:</span>
                        <span className="font-mono text-cyan-300">{item.activeEndpoints}</span>
                      </div>
                    )}

                    {item.activeTokens !== undefined && (
                      <div className="flex items-center justify-between">
                        <span>Active CLI Tokens:</span>
                        <span className="font-mono text-emerald-300">{item.activeTokens}</span>
                      </div>
                    )}

                    {item.permissions && (
                      <div className="pt-1">
                        <span className="block text-[11px] text-slate-500 mb-1">Granted Permissions:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.permissions.map(perm => (
                            <span key={perm} className="text-[10px] font-mono bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.lastError && (
                      <div className="bg-rose-950/30 border border-rose-900/50 rounded p-2 text-rose-300 text-[11px]">
                        Last Error: {item.lastError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/40 flex items-center justify-end">
                  <Link href="/settings">
                    <Button size="sm" variant="ghost" className="text-xs text-cyan-400 hover:text-cyan-300 p-0 h-auto">
                      Configure →
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
