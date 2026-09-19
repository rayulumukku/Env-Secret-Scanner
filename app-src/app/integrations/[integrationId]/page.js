'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
  Lock, RefreshCw, GitBranch, GitPullRequest, MessageSquare,
  Webhook, Terminal, CheckSquare, Eye, Key, Unplug, Check, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const integrationId = params?.integrationId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [credentials, setCredentials] = useState({});
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    if (integrationId) {
      fetchDetail();
    }
  }, [integrationId]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${integrationId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
      const healthRes = await fetch(`/api/integrations/${integrationId}/health`);
      const healthJson = await healthRes.json();
      if (healthJson.success) {
        setHealthStatus(healthJson.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleConnect(e) {
    e.preventDefault();
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const json = await res.json();
      if (json.success) {
        setShowConnectModal(false);
        fetchDetail();
      } else {
        setError(json.error || 'Failed to connect integration');
      }
    } catch (err) {
      setError(err.message || 'Connection error');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect this integration? Existing scan findings will remain available, but live webhook syncing will stop.')) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/integrations/${integrationId}/disconnect`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        fetchDetail();
      }
    } catch {}
    finally {
      setDisconnecting(false);
    }
  }

  function getProviderIcon(id) {
    switch (id) {
      case 'github':
        return <GitBranch className="w-6 h-6 text-purple-400" />;
      case 'gitlab':
        return <GitPullRequest className="w-6 h-6 text-orange-400" />;
      case 'slack':
        return <MessageSquare className="w-6 h-6 text-pink-400" />;
      case 'webhooks':
        return <Webhook className="w-6 h-6 text-cyan-400" />;
      default:
        return <Terminal className="w-6 h-6 text-slate-400" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
          <p className="text-xs text-slate-400">Loading integration details...</p>
        </div>
      </div>
    );
  }

  const isConnected = data?.isConnected;
  const permissions = data?.permissions || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back Link & Header */}
        <div className="space-y-4 border-b border-slate-800/80 pb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                {getProviderIcon(integrationId)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100">
                    {data?.name}
                  </h1>
                  {isConnected ? (
                    <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                      CONNECTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                      READY TO CONNECT
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{data?.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-xs border-rose-900/60 text-rose-300 hover:bg-rose-950/40 gap-1.5"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowConnectModal(true)}
                  className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5 shadow-lg shadow-cyan-950"
                >
                  <Key className="w-3.5 h-3.5" />
                  Configure & Connect
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Health Probe Strip */}
        {isConnected && healthStatus && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${healthStatus.healthy ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-amber-400'}`} />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-slate-100">Gateway Status:</span> {healthStatus.message}
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Last checked: {new Date(healthStatus.lastChecked).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Permissions Transparency Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Permission Transparency & Access Boundaries
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              SecretShield operates on the principle of least privilege. Review exactly what this integration can and cannot access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Read & Write Scopes */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Granted Access Scopes
              </h3>

              <div className="space-y-3">
                {permissions.read?.map(p => (
                  <div key={p.scope} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">READ</span>
                      {p.scope}
                    </div>
                    <p className="text-slate-400 mt-1 text-[11px]">{p.reason}</p>
                  </div>
                ))}

                {permissions.write?.map(p => (
                  <div key={p.scope} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800 px-1.5 py-0.5 rounded">WRITE</span>
                      {p.scope}
                    </div>
                    <p className="text-slate-400 mt-1 text-[11px]">{p.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Never Accesses */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                What SecretShield Will NEVER Access
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                {permissions.neverAccesses?.map(na => (
                  <div key={na} className="flex items-start gap-2 text-xs text-slate-300">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{na}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-start gap-2.5 text-[11px] text-slate-400">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>AES-256-GCM Encrypted at Rest:</strong> All authorization tokens and credentials are encrypted using standard authenticated cryptography primitives before writing to storage.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  Connect {data?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Credentials are encrypted at rest and never returned in API responses.
                </p>
              </div>

              {error && (
                <div className="bg-rose-950/40 border border-rose-800 rounded-lg p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleConnect} className="space-y-4">
                {integrationId === 'slack' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Slack Webhook URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://hooks.slack.com/services/..."
                      onChange={e => setCredentials({ webhookUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Access Token / API Secret Key *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter provider token..."
                      onChange={e => setCredentials({ token: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowConnectModal(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={connecting}
                    className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950"
                  >
                    {connecting ? 'Encrypting & Connecting...' : 'Authorize & Connect'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
