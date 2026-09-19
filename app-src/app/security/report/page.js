'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Download, Printer, Filter, RefreshCw,
  Shield, CheckCircle2, AlertTriangle, ExternalLink, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SecurityNav from '@/components/security/SecurityNav';

export default function SecurityReportPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    fetchReport();
  }, [severity, status, category]);

  async function fetchReport() {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        format: 'json',
        severity,
        status,
        category
      }).toString();
      const res = await fetch(`/api/security/report?${query}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  function handleDownload(format) {
    const query = new URLSearchParams({
      format,
      severity,
      status,
      category
    }).toString();
    window.open(`/api/security/report?${query}`, '_blank');
  }

  const findings = reportData?.findings || [];
  const statistics = reportData?.statistics;
  const protectionCoverage = reportData?.protectionCoverage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-cyan-400" />
              Executive Security Report & Export
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Generate audit-ready security posture reports in HTML, CSV (sanitized against formula injection), and JSON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload('html')}
              className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              Print / HTML View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload('csv')}
              className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload('json')}
              className="text-xs border-slate-800 hover:bg-slate-900 gap-1.5"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              Export JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchReport}
              disabled={loading}
              className="text-xs border-slate-800 hover:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <SecurityNav />

        {/* Filter Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400" />
            Report Scope Filters:
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>

            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Active / Open Only</option>
              <option value="RESOLVED">Resolved Only</option>
              <option value="FALSE_POSITIVE">False Positives</option>
            </select>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              <option value="CLOUD_PROVIDER">Cloud Providers</option>
              <option value="DATABASE">Databases</option>
              <option value="PAYMENT">Payment Gateways</option>
              <option value="API">API Keys</option>
              <option value="AUTH">Authentication</option>
            </select>
          </div>
        </div>

        {/* Report Preview Container */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                Live Audit Preview
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">
                {reportData?.organization?.name || 'Organization'} Security Posture Report
              </h2>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Generated: {reportData?.metadata?.dateGenerated ? new Date(reportData.metadata.dateGenerated).toLocaleString() : new Date().toLocaleString()}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
              Compiling report data...
            </div>
          ) : (
            <>
              {/* Report Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Total Findings in Scope</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    {findings.length}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Critical / High Open</div>
                  <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                    {(statistics?.criticalCount || 0) + (statistics?.highCount || 0)}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Repository Protection</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {protectionCoverage?.coveragePercentage || '100%'}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Total Scanned Repos</div>
                  <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
                    {protectionCoverage?.totalRepositories || 0}
                  </div>
                </div>
              </div>

              {/* Scope Findings Table Preview */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                      <th className="p-3.5 font-semibold">Priority</th>
                      <th className="p-3.5 font-semibold">Rule / Description</th>
                      <th className="p-3.5 font-semibold">Category</th>
                      <th className="p-3.5 font-semibold">Severity</th>
                      <th className="p-3.5 font-semibold">Location</th>
                      <th className="p-3.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {findings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No findings match the selected report filter criteria.
                        </td>
                      </tr>
                    ) : (
                      findings.map((f, idx) => (
                        <tr key={f.id || idx} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-mono font-bold text-cyan-400">
                            {f.priorityLevel || 'P2'} ({f.priorityScore || 50})
                          </td>
                          <td className="p-3.5 font-medium text-slate-200">
                            {f.ruleName || f.ruleId}
                          </td>
                          <td className="p-3.5 font-mono text-slate-400">
                            {f.category || 'GENERIC'}
                          </td>
                          <td className="p-3.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              f.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                              f.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              f.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {f.severity}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-400">
                            {f.file}:{f.line}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                              f.status === 'RESOLVED' ? 'text-emerald-400 bg-emerald-950/60' :
                              f.status === 'FALSE_POSITIVE' ? 'text-slate-400 bg-slate-800' :
                              'text-amber-400 bg-amber-950/60'
                            }`}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Security & Sanitization Note */}
              <div className="flex items-start gap-2.5 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/80 rounded-lg p-3">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300">CSV Formula Injection Defense:</span> All exported CSV fields are sanitized by prefixing formula-triggering characters (<code className="text-cyan-300">=</code>, <code className="text-cyan-300">+</code>, <code className="text-cyan-300">-</code>, <code className="text-cyan-300">@</code>) with single quotes to prevent code execution in spreadsheet viewers.
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
