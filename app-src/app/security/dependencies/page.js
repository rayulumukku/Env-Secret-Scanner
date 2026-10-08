'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, ShieldAlert, AlertTriangle, Layers, FileCode,
  Download, RefreshCw, ExternalLink, CheckCircle2, ShieldCheck,
  Search, Filter, ArrowUpRight
} from 'lucide-react';

export default function DependencyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('vulns');
  const [search, setSearch] = useState('');
  const [filterEcosystem, setFilterEcosystem] = useState('ALL');

  useEffect(() => {
    fetchDependencyData();
  }, []);

  async function fetchDependencyData() {
    setLoading(true);
    try {
      const [vulnRes, graphRes] = await Promise.all([
        fetch('/api/dependencies/vulnerabilities'),
        fetch('/api/dependencies/graph')
      ]);

      const [vulnJson, graphJson] = await Promise.all([
        vulnRes.json(),
        graphRes.json()
      ]);

      setData({
        vulnerabilities: vulnJson.data?.vulnerabilities || [],
        graph: graphJson.data?.graph || { nodes: [] },
        statistics: graphJson.data?.statistics || {
          totalDependencies: 0,
          directCount: 0,
          transitiveCount: 0,
          vulnerabilitiesCount: 0,
          criticalHighCount: 0,
          suspiciousSignalsCount: 0,
          licenseReviewItemsCount: 0
        }
      });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    setScanning(true);
    try {
      await fetch('/api/dependencies/scan', { method: 'POST', body: JSON.stringify({}) });
      await fetchDependencyData();
    } catch {
      // Handle gracefully
    } finally {
      setScanning(false);
    }
  }

  function handleExportSbom(format) {
    window.open(`/api/dependencies/sbom?format=${format}`, '_blank');
  }

  const stats = data?.statistics || {
    totalDependencies: 0,
    directCount: 0,
    transitiveCount: 0,
    vulnerabilitiesCount: 0,
    criticalHighCount: 0,
    outdatedCount: 0,
    deprecatedCount: 0,
    suspiciousSignalsCount: 0,
    licenseReviewItemsCount: 0,
  };

  const vulns = data?.vulnerabilities || [];
  const nodes = data?.graph?.nodes || [];

  const filteredVulns = vulns.filter(v => {
    if (filterEcosystem !== 'ALL' && v.ecosystem?.toLowerCase() !== filterEcosystem.toLowerCase()) return false;
    if (search && !v.package?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredNodes = nodes.filter(n => {
    if (filterEcosystem !== 'ALL' && n.ecosystem?.toLowerCase() !== filterEcosystem.toLowerCase()) return false;
    if (search && !n.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
                <Package className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Software Supply-Chain Intelligence</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1.5">
              Evidence-backed Software Bill of Materials (SBOM), dependency reachability, advisory intelligence, and license compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative inline-block text-left">
              <button
                id="export-sbom-btn"
                onClick={() => handleExportSbom('cyclonedx')}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-slate-400" />
                Export CycloneDX SBOM
              </button>
            </div>

            <button
              id="rescan-deps-btn"
              onClick={handleScan}
              disabled={scanning}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Auditing...' : 'Audit Dependencies'}
            </button>
          </div>
        </div>

        {/* Factual Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Dependencies</span>
              <Layers className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{stats.totalDependencies}</div>
            <div className="text-[11px] text-slate-500 mt-1">Direct: {stats.directCount} | Transitive: {stats.transitiveCount}</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Vulnerabilities</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">{stats.vulnerabilitiesCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Authoritative advisories</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Critical / High</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-2">{stats.criticalHighCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Requires immediate remediation</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Suspicious Signals</span>
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400 mt-2">{stats.suspiciousSignalsCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Heuristic typosquat/scripts</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>License Review</span>
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400 mt-2">{stats.licenseReviewItemsCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Copyleft / missing licenses</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Deprecated Packages</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-2">{stats.deprecatedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Lifecycle verified</div>
          </div>
        </div>

        {/* Search & Ecosystem Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by package name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Ecosystem:</span>
            {['ALL', 'NPM', 'PYPI', 'GOLANG', 'CARGO', 'MAVEN'].map(eco => (
              <button
                key={eco}
                onClick={() => setFilterEcosystem(eco)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                  filterEcosystem === eco
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {eco}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('vulns')}
            className={`pb-3 relative transition ${
              activeTab === 'vulns'
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vulnerabilities ({filteredVulns.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 relative transition ${
              activeTab === 'inventory'
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Packages ({filteredNodes.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading dependency intelligence...</div>
        ) : activeTab === 'vulns' ? (
          filteredVulns.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <div className="text-slate-200 font-medium">No Known Vulnerabilities Detected</div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No dependencies in the current inventory match known security advisories.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVulns.map(v => (
                <div key={v.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          v.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          v.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {v.severity}
                        </span>
                        <Link
                          href={`/security/dependencies/${v.ecosystem}/${encodeURIComponent(v.package)}`}
                          className="font-semibold text-white hover:text-indigo-400 transition"
                        >
                          {v.package} <span className="text-slate-400 font-normal text-xs">@{v.installedVersion}</span>
                        </Link>
                        <span className="text-xs text-slate-500">({v.ecosystem})</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.isDirect ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                          {v.isDirect ? 'Direct' : 'Transitive'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 mt-2 font-medium">{v.summary}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Affected Range: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">{v.affectedRange}</code>
                        {v.fixedVersion && (
                          <span className="ml-3">
                            Fixed in: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300">{v.fixedVersion}</code>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <Link
                        href={`/security/dependencies/vulnerabilities/${encodeURIComponent(v.advisoryId)}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        {v.advisoryId} <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <div className="text-[11px] text-slate-500">
                        Reachability: <span className="text-slate-300 font-medium">{v.reachabilityStatus || 'DECLARED'}</span>
                      </div>
                    </div>
                  </div>

                  {v.dependencyPath && v.dependencyPath.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400 flex items-center gap-1.5 overflow-x-auto">
                      <span className="text-slate-500">Exposure Path:</span>
                      {v.dependencyPath.map((seg, idx) => (
                        <span key={idx} className="flex items-center gap-1.5">
                          <code className="text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded">{seg}</code>
                          {idx < v.dependencyPath.length - 1 && <span className="text-slate-600">→</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Package</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">Ecosystem</th>
                  <th className="p-3.5">Relationship</th>
                  <th className="p-3.5">License</th>
                  <th className="p-3.5">Reachability</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredNodes.map(node => (
                  <tr key={node.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-medium text-white">{node.name}</td>
                    <td className="p-3.5 font-mono text-slate-400">{node.version}</td>
                    <td className="p-3.5 uppercase text-slate-400">{node.ecosystem}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${node.isDirect ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                        {node.isDirect ? 'Direct' : 'Transitive'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-950 px-2 py-0.5 rounded text-slate-300">
                        {node.license || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{node.reachabilityStatus || 'DECLARED'}</td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/security/dependencies/${node.ecosystem}/${encodeURIComponent(node.name)}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
