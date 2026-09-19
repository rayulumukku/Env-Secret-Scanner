'use client';

/**
 * app/integrations/slack/page.js
 *
 * Slack Alert Integration Configuration & Testing.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Send, 
  ShieldCheck, 
  Trash2, 
  RefreshCw,
  BellRing
} from 'lucide-react';

export default function SlackIntegrationPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('#security-alerts');
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/slack');
      const data = await res.json();
      setIsConfigured(data.isConfigured || false);
      if (data.targetChannel) setChannelName(data.targetChannel);
    } catch (err) {
      console.error('Failed to fetch Slack status:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, channelName }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Slack webhook saved successfully!' });
        setIsConfigured(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save Slack webhook.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl || undefined, test: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Test alert sent successfully to Slack! Check your channel.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test alert.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect Slack alerts?')) return;
    try {
      const res = await fetch('/api/integrations/slack', { method: 'DELETE' });
      if (res.ok) {
        setIsConfigured(false);
        setWebhookUrl('');
        setMessage({ type: 'success', text: 'Slack integration disconnected.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Integrations
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            Slack Alerts Integration
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Deliver real-time Block Kit incident alerts to your security and developer channels whenever critical secrets are detected.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="bg-[#161b22] border border-gray-800 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-indigo-400" />
                Slack Incoming Webhook
              </h2>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Webhook URL
                </label>
                <input
                  type="password"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={isConfigured ? '••••••••••••••••••••••••••••••••' : 'https://hooks.slack.com/services/...'}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Obtained from your Slack App configuration under Incoming Webhooks.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing || (!isConfigured && !webhookUrl)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {testing ? 'Sending...' : 'Send Test Alert'}
                  </button>
                </div>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Disconnect
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Preview Card */}
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Sample Incident Card
              </h3>

              <div className="p-3.5 bg-[#0d1117] border border-gray-800 rounded-lg text-xs space-y-2.5">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  🚨 SecretShield: CRITICAL Secret Detected
                </div>
                <div className="text-[11px] text-gray-300 space-y-1">
                  <div><strong>Repo:</strong> <span className="text-gray-400 font-mono">acme/backend</span></div>
                  <div><strong>Type:</strong> <span className="text-gray-400">AWS Access Key</span></div>
                  <div><strong>Location:</strong> <span className="text-gray-400 font-mono">src/config.js:42</span></div>
                  <div><strong>Confidence:</strong> <span className="text-emerald-400">97%</span></div>
                </div>
                <div className="pt-2 border-t border-gray-800/80">
                  <span className="inline-block px-2.5 py-1 bg-rose-900/40 text-rose-300 border border-rose-800/60 rounded text-[10px] font-semibold">
                    View Finding in Dashboard →
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Raw credentials are redacted from Slack payloads.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
