'use client';

import { useState, useEffect, startTransition } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, BarChart3, AlertTriangle, CheckCircle2,
  Minus, Plus, ArrowRight, Loader2, Info, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  MEDIUM:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  LOW:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
};

const CHANGE_CONFIG = {
  NEW:        { label: 'NEW',       icon: Plus,        color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  RESOLVED:   { label: 'RESOLVED',  icon: CheckCircle2,color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  PERSISTENT: { label: 'PERSISTS',  icon: Minus,       color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
};

// ── FINDING CHANGE ROW ────────────────────────────────────────────────────────

function FindingChangeRow({ finding, changeType }) {
  const change = CHANGE_CONFIG[changeType];
  const cfg = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.LOW;
  const Icon = change.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.border} ${cfg.bg}`}>
      <div className={`flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-bold ${change.color} ${change.bg} ${change.border}`}>
        <Icon className="w-3 h-3" />
        {change.label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{finding.description || finding.type}</div>
        <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span className="font-mono">{finding.file}:{finding.line}</span>
          {finding.maskedValue && <span className="font-mono text-muted-foreground/70">{finding.maskedValue}</span>}
        </div>
      </div>
      <span className={`text-[10px] font-bold flex-shrink-0 ${cfg.color}`}>{finding.severity}</span>
    </div>
  );
}

// ── SCAN SELECTOR ─────────────────────────────────────────────────────────────

function ScanSelector({ label, value, onChange, exclude }) {
  // Derive scan list — no effect needed, useMemo re-runs when exclude changes
  // Note: useMemo is synchronous so no setState-in-effect rule applies
  const scans = (() => {
    try {
      const raw = typeof localStorage !== 'undefined'
        ? localStorage.getItem('secretshield_repo_history')
        : null;
      if (!raw) return [];
      const all = JSON.parse(raw);
      return exclude ? all.filter(s => s.scanId !== exclude) : all;
    } catch {
      return [];
    }
  })();

  return (
    <div className="flex-1">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">— Select scan —</option>
        {scans.map(s => (
          <option key={s.scanId} value={s.scanId}>
            {s.repository?.name || s.scanId} — {new Date(s.timestamp).toLocaleDateString()} ({s.statistics?.total ?? 0} findings)
          </option>
        ))}
      </select>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const { scanId } = useParams();

  const [currentScanId, setCurrentScanId] = useState(scanId);
  const [previousScanId, setPreviousScanId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-load current scan name
  const [currentName, setCurrentName] = useState('');
  useEffect(() => {
    startTransition(() => {
      try {
        const raw = sessionStorage.getItem(`repo_scan_${scanId}`);
        if (raw) {
          const data = JSON.parse(raw);
          setCurrentName(data.repository?.name || scanId);
        }
      } catch { /* ignore */ }
    });
  }, [scanId]);

  const runComparison = async () => {
    if (!previousScanId) {
      setError('Please select a previous scan to compare against.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load both scans from sessionStorage
      const currRaw = sessionStorage.getItem(`repo_scan_${currentScanId}`);
      const prevRaw = sessionStorage.getItem(`repo_scan_${previousScanId}`);

      if (!currRaw) throw new Error('Current scan result not found in session. Please navigate to its results page first.');
      if (!prevRaw) throw new Error('Previous scan result not found in session. Please navigate to its results page first and then return here.');

      const currentScan  = JSON.parse(currRaw);
      const previousScan = JSON.parse(prevRaw);

      const res = await fetch('/api/repository/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousFindings: previousScan.findings || [],
          currentFindings:  currentScan.findings  || [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Comparison failed');
      }

      const data = await res.json();
      setResult({
        ...data,
        currentScan,
        previousScan,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const delta = result?.summary?.delta ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/repositories" className="hover:text-foreground">Repositories</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/repositories/${scanId}`} className="hover:text-foreground truncate max-w-xs">
            {currentName || scanId}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">Compare</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Scan Comparison
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Compare two scans to see new, resolved, and persistent findings.
        </p>

        {/* Scan selectors */}
        <div className="p-5 rounded-xl border border-border/60 bg-card/40 mb-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <ScanSelector
              label="Previous Scan (baseline)"
              value={previousScanId}
              onChange={setPreviousScanId}
              exclude={currentScanId}
            />
            <div className="flex-shrink-0 pb-2">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Scan</label>
              <div className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-secondary/30 text-foreground">
                {currentName || scanId}
              </div>
            </div>
            <Button onClick={runComparison} disabled={loading || !previousScanId} className="flex-shrink-0 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Compare
            </Button>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Both scans must be loaded in this browser session. Navigate to each scan&apos;s results page first, then return here.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Previous', value: result.summary.previousTotal },
                { label: 'Current',  value: result.summary.currentTotal },
                { label: 'New',      value: result.summary.newCount,       color: result.summary.newCount > 0 ? 'text-red-400' : 'text-foreground' },
                { label: 'Resolved', value: result.summary.resolvedCount,  color: result.summary.resolvedCount > 0 ? 'text-emerald-400' : 'text-foreground' },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl border border-border/60 bg-card/40">
                  <div className={`text-2xl font-bold font-mono ${s.color || 'text-foreground'}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Delta banner */}
            <div className={`mb-8 flex items-center gap-3 px-4 py-3 rounded-xl border ${
              delta > 0  ? 'border-red-500/20 bg-red-500/5' :
              delta < 0  ? 'border-emerald-500/20 bg-emerald-500/5' :
              'border-border/40 bg-secondary/20'
            }`}>
              {delta > 0  && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />}
              {delta < 0  && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              {delta === 0 && <Minus className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
              <span className="text-sm font-medium">
                {delta > 0  && `${delta} more finding${delta !== 1 ? 's' : ''} compared to previous scan`}
                {delta < 0  && `${Math.abs(delta)} fewer finding${Math.abs(delta) !== 1 ? 's' : ''} — improvement detected`}
                {delta === 0 && 'No change in finding count'}
              </span>
            </div>

            {/* New findings */}
            {result.newFindings.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Findings ({result.newFindings.length})
                </h2>
                <div className="space-y-2">
                  {result.newFindings.map((f, i) => (
                    <FindingChangeRow key={f.fingerprint || i} finding={f} changeType="NEW" />
                  ))}
                </div>
              </section>
            )}

            {/* Resolved findings */}
            {result.resolvedFindings.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Resolved ({result.resolvedFindings.length})
                </h2>
                <div className="space-y-2">
                  {result.resolvedFindings.map((f, i) => (
                    <FindingChangeRow key={f.fingerprint || i} finding={f} changeType="RESOLVED" />
                  ))}
                </div>
              </section>
            )}

            {/* Persistent findings */}
            {result.persistentFindings.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Minus className="w-4 h-4" /> Persistent ({result.persistentFindings.length})
                </h2>
                <div className="space-y-2">
                  {result.persistentFindings.map((f, i) => (
                    <FindingChangeRow key={f.fingerprint || i} finding={f} changeType="PERSISTENT" />
                  ))}
                </div>
              </section>
            )}

            {/* Clean */}
            {result.newFindings.length === 0 && result.resolvedFindings.length === 0 && result.persistentFindings.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-1">No differences found</p>
                <p className="text-sm text-muted-foreground">Both scans have identical findings (by fingerprint).</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
