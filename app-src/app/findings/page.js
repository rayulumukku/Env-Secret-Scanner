'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, AlertTriangle, CheckCircle2, Search, Filter,
  Layers, Check, X, Info, ArrowUpDown, RefreshCw, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FindingsPage() {
  const [findings, setFindings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeFinding, setActiveFinding] = useState(null);
  const [bulkModal, setBulkModal] = useState(null); // 'FALSE_POSITIVE' | 'REMEDIATED' | 'IGNORED'
  const [bulkNote, setBulkNote] = useState('');

  useEffect(() => {
    fetchFindings();
  }, [search, severityFilter, statusFilter, categoryFilter, sortBy]);

  async function fetchFindings() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (severityFilter) params.set('severity', severityFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (sortBy) params.set('sortBy', sortBy);
    params.set('limit', '50');

    try {
      const res = await fetch(`/api/findings?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setFindings(data.data.findings || []);
        setTotal(data.data.total || 0);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (selectedIds.size === findings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(findings.map(f => f.id)));
    }
  }

  async function handleSingleStatusChange(findingId, status) {
    await fetch(`/api/findings/${findingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note: `Status updated to ${status}` }),
    });
    fetchFindings();
    if (activeFinding?.id === findingId) {
      setActiveFinding(prev => ({ ...prev, status }));
    }
  }

  async function handleBulkStatusSubmit() {
    if (!bulkModal || selectedIds.size === 0) return;

    await fetch('/api/findings/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findingIds: Array.from(selectedIds),
        status: bulkModal,
        note: bulkNote,
      }),
    });

    setBulkModal(null);
    setBulkNote('');
    setSelectedIds(new Set());
    fetchFindings();
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Findings Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Global organization-wide credential exposures, triage lifecycle, and remediation tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFindings}
              className="gap-1.5 text-xs border-border/60 hover:bg-secondary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="p-4 rounded-2xl border border-border/60 bg-card/40 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by file path, fingerprint hash, rule type…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/60 bg-secondary/30 focus:bg-background focus:border-primary text-xs text-foreground outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs font-semibold text-foreground outline-none focus:border-primary"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs font-semibold text-foreground outline-none focus:border-primary"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
                <option value="REMEDIATED">REMEDIATED</option>
                <option value="IGNORED">IGNORED</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-border/60 bg-secondary/30 text-xs font-semibold text-foreground outline-none focus:border-primary"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="severity">Sort: Highest Severity</option>
                <option value="confidence">Sort: Highest Confidence</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Bar when items selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-xs animate-in fade-in">
              <span className="font-semibold text-primary">
                {selectedIds.size} finding(s) selected
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkModal('FALSE_POSITIVE')}
                  className="text-xs h-7 border-border/60"
                >
                  Mark False Positive
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkModal('IGNORED')}
                  className="text-xs h-7 border-border/60"
                >
                  Ignore
                </Button>
                <Button
                  size="sm"
                  onClick={() => setBulkModal('REMEDIATED')}
                  className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark Remediated
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Findings Table */}
        {findings.length === 0 ? (
          <div className="text-center py-20 px-4 border border-dashed border-border/60 rounded-2xl bg-card/20">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3 opacity-80" />
            <h3 className="text-base font-bold text-foreground">No findings match the current filter criteria</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query, severity, or lifecycle status filters.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === findings.length && findings.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border/60"
                      />
                    </th>
                    <th className="p-3">Severity & Type</th>
                    <th className="p-3">Location & Masked Secret</th>
                    <th className="p-3">Project / Repo</th>
                    <th className="p-3">Lifecycle Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {findings.map(f => (
                    <tr key={f.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(f.id)}
                          onChange={() => toggleSelect(f.id)}
                          className="rounded border-border/60"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            f.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            f.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {f.severity}
                          </span>
                          <span className="font-bold text-foreground">{f.type}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          FP: {f.fingerprint}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-foreground font-medium truncate max-w-xs">
                          {f.file}:{f.line}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          Masked: <span className="text-foreground">{f.maskedValue}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-foreground">{f.project?.name || 'Project'}</div>
                        <div className="text-[11px] text-muted-foreground">{f.repository?.name || 'repo'}</div>
                      </td>

                      <td className="p-3">
                        <select
                          value={f.status}
                          onChange={e => handleSingleStatusChange(f.id, e.target.value)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border outline-none cursor-pointer ${
                            f.status === 'OPEN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            f.status === 'CONFIRMED' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            f.status === 'REMEDIATED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-secondary text-muted-foreground border-border/40'
                          }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
                          <option value="REMEDIATED">REMEDIATED</option>
                          <option value="IGNORED">IGNORED</option>
                        </select>
                      </td>

                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveFinding(f)}
                          className="text-xs h-7 px-2 text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Finding Detail Modal */}
      {activeFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeFinding.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                }`}>
                  {activeFinding.severity}
                </span>
                <h3 className="text-base font-bold text-foreground">{activeFinding.type}</h3>
              </div>
              <button
                onClick={() => setActiveFinding(null)}
                className="text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Location:</span>
                <div className="font-mono text-foreground mt-0.5 bg-secondary/40 p-2 rounded-lg border border-border/40">
                  {activeFinding.file}:{activeFinding.line}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold">Masked Secret Value:</span>
                <div className="font-mono text-foreground font-bold mt-0.5 bg-secondary/40 p-2 rounded-lg border border-border/40">
                  {activeFinding.maskedValue}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold">Deterministic Fingerprint (SHA-256):</span>
                <div className="font-mono text-xs text-primary mt-0.5 bg-primary/5 p-2 rounded-lg border border-primary/20 break-all">
                  {activeFinding.fingerprint}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold">Remediation Guidance:</span>
                <p className="text-muted-foreground mt-0.5 leading-relaxed bg-secondary/20 p-2.5 rounded-lg border border-border/30">
                  {activeFinding.remediation || 'Revoke credential immediately. Rotate secret key in provider console and purge commit history if pushed remotely.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-border/40">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSingleStatusChange(activeFinding.id, 'FALSE_POSITIVE')}
                  className="text-xs"
                >
                  Mark False Positive
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSingleStatusChange(activeFinding.id, 'REMEDIATED')}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark Remediated
                </Button>
              </div>

              <Button onClick={() => setActiveFinding(null)} variant="ghost" size="sm" className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Confirm Bulk Action: {bulkModal.replace('_', ' ')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are updating {selectedIds.size} finding(s) to <span className="font-bold text-foreground">{bulkModal}</span>. This will be recorded in the security audit log.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Reason / Note (Optional)</label>
              <textarea
                rows={2}
                value={bulkNote}
                onChange={e => setBulkNote(e.target.value)}
                placeholder="e.g. Synthetic test fixture / Key revoked in IAM console"
                className="w-full p-2 rounded-lg border border-border/60 bg-secondary/30 text-xs text-foreground outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setBulkModal(null)} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={handleBulkStatusSubmit} className="text-xs bg-primary text-primary-foreground font-bold">
                Apply to {selectedIds.size} findings
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
