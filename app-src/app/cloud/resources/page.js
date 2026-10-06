'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cloud, Layers, RefreshCw, ArrowLeft, Filter, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function CloudResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    setLoading(true);
    try {
      const res = await fetch('/api/cloud/resources');
      const json = await res.json();
      if (json.success) {
        setResources(json.data.resources || []);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  const filtered = resources.filter(r => {
    if (filterProvider !== 'ALL' && r.provider?.toUpperCase() !== filterProvider) return false;
    if (filterType !== 'ALL' && r.resourceType?.toUpperCase() !== filterType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/cloud" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Cloud Resource Inventory</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Discovered cloud storage, compute, networking, and identity metadata across connected environments.
              </p>
            </div>
          </div>

          <button
            onClick={fetchResources}
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Inventory
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Providers</option>
              <option value="AWS">AWS</option>
              <option value="GCP">GCP</option>
              <option value="AZURE">Azure</option>
              <option value="GENERIC">Generic</option>
            </select>
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{filtered.length}</span> cloud resources
          </div>
        </div>

        {/* Resources Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="cloud-resources-table">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Resource Identifier</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Region / Location</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Last Sync</th>
                  <th className="py-3 px-4 text-right">Configuration Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                      Loading cloud resources...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No cloud resources found. Connect cloud accounts and run sync to populate inventory.
                    </td>
                  </tr>
                ) : (
                  filtered.map(res => (
                    <tr key={res.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {res.provider}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-200 font-semibold">{res.resourceId}</div>
                        {res.arnOrUri && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{res.arnOrUri}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {res.resourceType}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {res.region || 'global'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {res.environment || 'unclassified'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {res.lastSyncedAt ? new Date(res.lastSyncedAt).toLocaleDateString() : 'Never'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          res.postureStatus === 'SECURE'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : res.postureStatus === 'WARNING'
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                            : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}>
                          {res.postureStatus === 'SECURE' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {res.postureStatus}
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
    </div>
  );
}
