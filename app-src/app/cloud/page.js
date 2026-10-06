'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cloud, Server, ShieldCheck, AlertTriangle, Layers, ExternalLink, RefreshCw, Key } from 'lucide-react';

export default function CloudOverviewPage() {
  const [accounts, setAccounts] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [accRes, resRes] = await Promise.all([
        fetch('/api/cloud/accounts'),
        fetch('/api/cloud/resources'),
      ]);
      const accJson = await accRes.json();
      const resJson = await resRes.json();
      if (accJson.success) setAccounts(accJson.data.accounts || []);
      if (resJson.success) setResources(resJson.data.resources || []);
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const secureCount = resources.filter(r => r.postureStatus === 'SECURE').length;
  const warningCount = resources.filter(r => r.postureStatus === 'WARNING').length;
  const deficientCount = resources.filter(r => r.postureStatus === 'DEFICIENT').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Cloud Security & Resource Posture</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Read-only cloud configuration metadata, resource inventory, and environment boundary mapping.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cloud/accounts"
              className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors flex items-center gap-2 shadow-sm"
              id="manage-accounts-btn"
            >
              <Key className="w-3.5 h-3.5" />
              Manage Cloud Accounts
            </Link>
            <Link
              href="/cloud/resources"
              className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
              id="view-resources-btn"
            >
              <Layers className="w-3.5 h-3.5" />
              Resource Inventory
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Connected Accounts</div>
            <div className="text-3xl font-bold text-sky-400 mt-1">{accounts.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">AWS, GCP, Azure, Generic</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Discovered Resources</div>
            <div className="text-3xl font-bold text-slate-100 mt-1">{resources.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Storage, compute, IAM, network</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Secure Posture</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{secureCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Passing read-only checks</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Posture Warnings / Deficient</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">{warningCount + deficientCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Configuration updates suggested</div>
          </div>
        </div>

        {/* Quick Links / Accounts Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-400" />
                Active Cloud Accounts
              </h2>
              <Link href="/cloud/accounts" className="text-xs text-sky-400 hover:underline">
                View all &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No cloud accounts connected yet. Connect an AWS, GCP, or Azure account to synchronize resource metadata.
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.slice(0, 4).map(acc => (
                  <div key={acc.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{acc.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{acc.provider} &bull; {acc.accountId}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {acc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Least-Privilege Cloud Boundary
              </h2>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                SecretShield connects strictly using <strong>read-only scopes</strong> to inventory resources and evaluate security posture.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Zero active intrusion testing or penetration attacks</li>
                <li>Zero permission to create, modify, or terminate cloud instances</li>
                <li>Credentials encrypted at rest using AES-256-GCM envelope</li>
                <li>SSRF guard blocks all non-approved endpoints and metadata IPs</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
