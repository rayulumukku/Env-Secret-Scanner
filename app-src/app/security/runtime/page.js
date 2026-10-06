'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server, Shield, Cloud, AlertTriangle, CheckCircle2,
  RefreshCw, ExternalLink, GitCommit, Layers, EyeOff, Radio
} from 'lucide-react';

export default function RuntimeExposureDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterEnv, setFilterEnv] = useState('ALL');

  useEffect(() => {
    fetchExposureData();
  }, []);

  async function fetchExposureData() {
    setLoading(true);
    try {
      const res = await fetch('/api/runtime/exposure');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch('/api/runtime/sync', { method: 'POST' });
      await fetchExposureData();
    } catch {
      // Continue
    } finally {
      setSyncing(false);
    }
  }

  const metrics = data?.metrics || {
    sourceExposedCount: 0,
    deploymentAssociatedCount: 0,
    productionAssociatedCount: 0,
    unresolvedHistoricalCount: 0,
    runtimeStatusUnknownCount: 0,
    cloudAssociatedCount: 0,
    verifiedCleanCount: 0,
  };

  const correlations = data?.correlations || [];

  const filteredCorrelations = correlations.filter(item => {
    if (filterEnv === 'ALL') return true;
    const envs = item.correlation?.affectedEnvironments || [];
    return envs.some(e => e.environmentName?.toUpperCase() === filterEnv || e.environmentType === filterEnv);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Runtime & Deployment Exposure</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Evidence-backed correlation connecting source code secret findings to deployments, environments, and cloud infrastructure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cloud"
              className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
              id="cloud-inventory-link"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              Cloud Inventory
            </Link>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors flex items-center gap-2 shadow-sm"
              id="trigger-runtime-sync-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Runtime'}
            </button>
          </div>
        </div>

        {/* Factual Notice Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <Radio className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Zero-Active-Testing Invariant:</span> SecretShield strictly analyzes verified metadata and deployment logs.
            Findings in template files (e.g. <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">.env.example</code>) are never treated as production configuration.
            Credential validity is never assumed, and SecretShield never attempts third-party authentication.
          </div>
        </div>

        {/* Factual Metric Cards Grid (NO arbitrary risk scores) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-[11px] font-medium text-slate-400">Source Exposed</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.sourceExposedCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">In active source tree</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-[11px] font-medium text-slate-400">Deployment Associated</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.deploymentAssociatedCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">In deployed builds</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-[11px] font-medium text-slate-400">Production Associated</div>
            <div className="text-2xl font-bold text-red-500 mt-1">{metrics.productionAssociatedCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Confirmed prod deploy</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-[11px] font-medium text-slate-400">Historical Exposure</div>
            <div className="text-2xl font-bold text-orange-400 mt-1">{metrics.unresolvedHistoricalCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Still in Git history</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-[11px] font-medium text-slate-400">Status Unknown</div>
            <div className="text-2xl font-bold text-slate-300 mt-1">{metrics.runtimeStatusUnknownCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Not validated by auth</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-[11px] font-medium text-slate-400">Cloud Associated</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">{metrics.cloudAssociatedCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Correlated resources</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-[11px] font-medium text-slate-400">Verified Clean</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.verifiedCleanCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Source & history clean</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {['ALL', 'PRODUCTION', 'STAGING', 'TEST', 'DEVELOPMENT'].map(env => (
              <button
                key={env}
                onClick={() => setFilterEnv(env)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filterEnv === env
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id={`filter-env-${env.toLowerCase()}`}
              >
                {env}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{filteredCorrelations.length}</span> findings with runtime correlation
          </div>
        </div>

        {/* Correlation Findings Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="runtime-exposure-table">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Finding & Credential</th>
                  <th className="py-3 px-4">File Context</th>
                  <th className="py-3 px-4">Deployment Association</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Cloud Resources</th>
                  <th className="py-3 px-4">Exposure State</th>
                  <th className="py-3 px-4 text-right">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                      Loading runtime exposure telemetry...
                    </td>
                  </tr>
                ) : filteredCorrelations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No secret findings matching the selected environment filter.
                    </td>
                  </tr>
                ) : (
                  filteredCorrelations.map(item => {
                    const corr = item.correlation;
                    const classif = item.classification;
                    const isProd = corr.isProductionAssociated;

                    return (
                      <tr key={item.findingId} className="hover:bg-slate-800/30 transition-colors">
                        {/* Finding & Masked Credential */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{item.ruleName}</div>
                          <div className="font-mono text-[11px] text-amber-300/90 mt-0.5">{item.maskedValue || '••••••••'}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{item.file}:{item.line}</div>
                        </td>

                        {/* File Context */}
                        <td className="py-3.5 px-4">
                          {corr.isExampleOrTemplate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              .env.example template
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                              {corr.fileContext?.type || 'Source code'}
                            </span>
                          )}
                        </td>

                        {/* Deployment Association */}
                        <td className="py-3.5 px-4">
                          {corr.matchingDeployments?.length > 0 ? (
                            <div className="space-y-1">
                              {corr.matchingDeployments.map(d => (
                                <div key={d.id} className="flex items-center gap-1 text-[11px] text-slate-300">
                                  <GitCommit className="w-3 h-3 text-indigo-400" />
                                  <span>#{d.id}</span>
                                  <span className="text-[10px] text-slate-500">({d.provider})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No deployments</span>
                          )}
                        </td>

                        {/* Environment */}
                        <td className="py-3.5 px-4">
                          {corr.affectedEnvironments?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {corr.affectedEnvironments.map((env, i) => (
                                <span
                                  key={i}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    env.isProduction
                                      ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                  }`}
                                >
                                  {env.environmentName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Unmapped</span>
                          )}
                        </td>

                        {/* Cloud Resources */}
                        <td className="py-3.5 px-4">
                          {corr.associatedCloudResources?.length > 0 ? (
                            <div className="space-y-1">
                              {corr.associatedCloudResources.map((res, i) => (
                                <div key={i} className="text-[11px] text-sky-400 flex items-center gap-1 font-mono">
                                  <Cloud className="w-3 h-3" />
                                  {res.resourceType}: {res.resourceId}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">None</span>
                          )}
                        </td>

                        {/* Exposure State */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {classif.states.slice(0, 2).map(st => (
                              <div
                                key={st}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded inline-block ${
                                  st === 'ACTIVE_STATUS_CONFIRMED'
                                    ? 'bg-red-500/20 text-red-300'
                                    : st === 'DEPLOYMENT_ASSOCIATION'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {st}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Provenance */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-[10px] text-slate-400 max-w-[200px] truncate ml-auto" title={corr.correlationStatement}>
                            {corr.correlationStatement}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
