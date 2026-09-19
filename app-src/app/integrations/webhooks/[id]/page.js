'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Webhook, ArrowLeft, RefreshCw, Key, Play,
  CheckCircle2, AlertTriangle, Shield, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WebhookDeliveriesPage() {
  const router = useRouter();
  const params = useParams();
  const webhookId = params?.id;

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (webhookId) {
      fetchDeliveries();
    }
  }, [webhookId]);

  async function fetchDeliveries() {
    setLoading(true);
    try {
      const res = await fetch(`/api/webhooks/${webhookId}/deliveries`);
      const json = await res.json();
      if (json.success) {
        setDeliveries(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`/api/webhooks/${webhookId}/test`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        fetchDeliveries();
      }
    } catch {}
    finally {
      setTesting(false);
    }
  }

  async function handleRotateSecret() {
    if (!confirm('Rotating the webhook secret will immediately invalidate the current secret. Are you sure?')) {
      return;
    }
    setRotating(true);
    try {
      const res = await fetch(`/api/webhooks/${webhookId}/rotate-secret`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setNewSecret(json.data.secret);
      }
    } catch {}
    finally {
      setRotating(false);
    }
  }

  function handleCopySecret() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-4 border-b border-slate-800/80 pb-6">
          <Link
            href="/integrations/webhooks"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Webhooks
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1">
                WEBHOOK ENDPOINT: {webhookId}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <Webhook className="w-8 h-8 text-cyan-400" />
                Webhook Deliveries & Health
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRotateSecret}
                disabled={rotating}
                className="text-xs border-amber-900/80 text-amber-300 hover:bg-amber-950/40 gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                {rotating ? 'Rotating...' : 'Rotate Secret'}
              </Button>
              <Button
                size="sm"
                onClick={handleTest}
                disabled={testing}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5 shadow-lg shadow-cyan-950"
              >
                <Play className="w-3.5 h-3.5" />
                {testing ? 'Sending Test...' : 'Test Webhook (Ping)'}
              </Button>
            </div>
          </div>
        </div>

        {/* New Secret Banner (Displayed Once) */}
        {newSecret && (
          <div className="bg-amber-950/40 border border-amber-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                New Webhook Secret Generated
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySecret}
                className="text-xs border-amber-800 hover:bg-amber-900 gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                {copied ? 'Copied' : 'Copy Secret'}
              </Button>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              This secret will <strong>never be displayed again</strong>. Copy and configure it in your endpoint validator to verify incoming HMAC-SHA256 signatures.
            </p>
            <div className="bg-slate-950 border border-amber-900/80 p-3 rounded-lg font-mono text-xs text-amber-300 select-all">
              {newSecret}
            </div>
          </div>
        )}

        {/* Delivery History Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="p-4 font-semibold">Delivery ID</th>
                <th className="p-4 font-semibold">Event Type</th>
                <th className="p-4 font-semibold">HTTP Status</th>
                <th className="p-4 font-semibold">Signature (HMAC)</th>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading webhook delivery attempts...
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-sans">
                    No webhook delivery attempts recorded yet. Click <strong>Test Webhook</strong> above to send a ping.
                  </td>
                </tr>
              ) : (
                deliveries.map(del => (
                  <tr key={del.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 text-slate-300">{del.id}</td>
                    <td className="p-4 text-cyan-400">{del.event}</td>
                    <td className="p-4 font-bold text-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        del.statusCode === 200 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {del.statusCode}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px] truncate max-w-[180px]">
                      {del.signature || 'sha256=••••••••'}
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(del.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        DELIVERED
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
