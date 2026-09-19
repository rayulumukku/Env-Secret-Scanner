'use client';

/**
 * app/remediation/page.js
 *
 * SecretShield Remediation Center.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  BarChart2, 
  ArrowRight, 
  CheckSquare, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export default function RemediationCenterPage() {
  const [findings, setFindings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [findingsRes, statsRes] = await Promise.all([
        fetch('/api/findings?limit=100'),
        fetch('/api/remediation/stats'),
      ]);

      if (findingsRes.ok) {
        const data = await findingsRes.json();
        setFindings(data.findings || []);
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
    } catch (err) {
      console.error('Failed to load remediation data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function toggleSelect(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredFindings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFindings.map(f => f.id)));
    }
  }

  async function handleBulkApply() {
    if (selectedIds.size === 0 || !bulkAction) return;

    if (!confirm(`Apply "${bulkAction}" to ${selectedIds.size} selected finding(s)?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch('/api/remediation/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingIds: Array.from(selectedIds),
          action: 'STATUS',
          status: bulkAction,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully updated ${selectedIds.size} findings.` });
        setSelectedIds(new Set());
        setBulkAction('');
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkProcessing(false);
    }
  }

  const filteredFindings = findings.filter(f => {
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    if (selectedStatus === 'ACTIVE') {
      return f.status !== 'RESOLVED' && f.status !== 'FALSE_POSITIVE' && f.status !== 'IGNORED';
    }
    if (selectedStatus === 'RESOLVED') return f.status === 'RESOLVED';
    if (selectedStatus === 'FALSE_POSITIVE') return f.status === 'FALSE_POSITIVE';
    if (selectedStatus === 'IGNORED') return f.status === 'IGNORED';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              Remediation Center
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Prioritize, track, and remediate exposed credentials across all connected repositories and branches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/remediation/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-xs font-medium text-gray-300 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              Remediation Metrics
            </Link>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <div className="p-4 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="text-xs text-gray-400 font-medium">Open Critical</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{stats?.openCriticals || 0}</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="text-xs text-gray-400 font-medium">Open High</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats?.openHighs || 0}</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="text-xs text-gray-400 font-medium">In Progress</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{stats?.inProgress || 0}</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="text-xs text-gray-400 font-medium">Awaiting Rescan</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{stats?.awaitingRescan || 0}</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="text-xs text-gray-400 font-medium">SLA Overdue</div>
            <div className="text-2xl font-black text-red-500 mt-1">{stats?.overdueCount || 0}</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-gray-800 rounded-xl">
            <div className="text-xs text-gray-400 font-medium">Resolved</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats?.resolved || 0}</div>
          </div>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            {message.text}
          </div>
        )}

        {/* Filter Controls */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
            >
              <option value="ACTIVE">Active Findings</option>
              <option value="RESOLVED">Resolved Findings</option>
              <option value="FALSE_POSITIVE">False Positives</option>
              <option value="IGNORED">Ignored</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl flex items-center justify-between gap-4">
            <div className="text-xs font-semibold text-indigo-300">
              {selectedIds.size} finding(s) selected
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-2.5 py-1 bg-gray-900 border border-indigo-700/60 rounded-lg text-xs text-white"
              >
                <option value="">Choose Bulk Action...</option>
                <option value="IN_PROGRESS">Mark In Progress</option>
                <option value="AWAITING_ROTATION">Mark Awaiting Rotation</option>
                <option value="AWAITING_RESCAN">Mark Awaiting Rescan</option>
                <option value="RESOLVED">Mark Resolved</option>
                <option value="FALSE_POSITIVE">Mark False Positive</option>
                <option value="IGNORED">Ignore</option>
              </select>
              <button
                onClick={handleBulkApply}
                disabled={!bulkAction || bulkProcessing}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {bulkProcessing ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        )}

        {/* Findings Table */}
        <div className="mt-6 bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden">
          {filteredFindings.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              No findings matching the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              <div className="p-3 bg-gray-900/60 text-gray-400 text-xs font-semibold flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredFindings.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-700 bg-gray-900"
                />
                <span className="flex-1">Finding / Location</span>
                <span className="w-28 text-center">Severity</span>
                <span className="w-36 text-center">Remediation Status</span>
                <span className="w-24 text-right">Action</span>
              </div>

              {filteredFindings.map(f => {
                const isSelected = selectedIds.has(f.id);

                return (
                  <div
                    key={f.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : 'hover:bg-gray-900/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(f.id)}
                        className="mt-1 rounded border-gray-700 bg-gray-900"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white truncate">{f.type || f.ruleId}</span>
                          <span className="font-mono text-[11px] text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                            {f.maskedValue}
                          </span>
                        </div>

                        <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                          <span className="text-gray-300">{f.file}:{f.line}</span>
                          {f.repository?.fullName && (
                            <span className="text-gray-500">({f.repository.fullName})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="w-28 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          f.severity === 'CRITICAL'
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                            : f.severity === 'HIGH'
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                            : 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                        }`}>
                          {f.severity}
                        </span>
                      </div>

                      <div className="w-36 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-900 border border-gray-800 rounded text-gray-300">
                          {f.status || 'UNREVIEWED'}
                        </span>
                      </div>

                      <div className="w-24 text-right">
                        <Link
                          href={`/findings/${f.id}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Remediate <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
