'use client';

import { useState, useEffect, Suspense, startTransition } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GitCommit, ChevronRight, AlertTriangle, Clock, FileCode2,
  ChevronDown, Shield, Info, Loader2, History, ExternalLink,
  GitBranch, RotateCcw, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExposureStatus, EXPOSURE_STATUS_LABELS } from '@/lib/models/index';

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-red-400',    dot: 'bg-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  HIGH:     { color: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  MEDIUM:   { color: 'text-yellow-400', dot: 'bg-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  LOW:      { color: 'text-blue-400',   dot: 'bg-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── LIFECYCLE CARD ─────────────────────────────────────────────────────────────

function LifecycleCard({ lifecycle }) {
  const cfg = SEVERITY_CONFIG[lifecycle.severity] || SEVERITY_CONFIG.LOW;
  const statusLabel = EXPOSURE_STATUS_LABELS[lifecycle.exposureStatus];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-xl border transition-colors ${cfg.border} ${cfg.bg}`}>
      <button
        className="w-full p-4 text-left flex items-start gap-3"
        onClick={() => setExpanded(v => !v)}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{lifecycle.description || lifecycle.type}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
              {lifecycle.severity}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className={`font-semibold ${statusLabel?.color}`}>
              {lifecycle.exposureStatus === ExposureStatus.ACTIVE   && '🔴 Active in current code'}
              {lifecycle.exposureStatus === ExposureStatus.REMOVED  && '🟡 Removed from current code'}
              {lifecycle.exposureStatus === ExposureStatus.ALLOWLISTED && '🔵 Allowlisted'}
            </span>
            <span>Found in {lifecycle.commitCount} commit{lifecycle.commitCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-4 py-3 space-y-3">
          {/* Masked value */}
          {lifecycle.maskedValue && (
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Masked Value</div>
              <code className="text-xs font-mono text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
                {lifecycle.maskedValue}
              </code>
            </div>
          )}

          {/* Lifecycle timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">First Seen</div>
              <div className="text-xs font-mono text-foreground">{lifecycle.firstCommit?.slice(0, 7) || '—'}</div>
              <div className="text-[10px] text-muted-foreground">{formatDate(lifecycle.firstCommitDate)}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Last Seen</div>
              <div className="text-xs font-mono text-foreground">{lifecycle.lastCommit?.slice(0, 7) || '—'}</div>
              <div className="text-[10px] text-muted-foreground">{formatDate(lifecycle.lastCommitDate)}</div>
            </div>
          </div>

          {/* REMOVED notice */}
          {lifecycle.exposureStatus === ExposureStatus.REMOVED && (
            <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                This secret no longer appears in the current code, but it exists in Git history.
                <strong className="block mt-0.5">Rotate the credential if it may have been real.</strong>
              </span>
            </div>
          )}

          {/* Fingerprint */}
          <div className="text-[10px] font-mono text-muted-foreground/60">fp: {lifecycle.fingerprint}</div>
        </div>
      )}
    </div>
  );
}

// ── COMMIT ROW ─────────────────────────────────────────────────────────────────

function CommitRow({ commit }) {
  const [expanded, setExpanded] = useState(false);

  const hasCritical = commit.findings.some(f => f.severity === 'CRITICAL');
  const hasHigh = commit.findings.some(f => f.severity === 'HIGH');

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="w-full p-4 text-left flex items-start gap-4 hover:bg-secondary/20 transition-colors"
        onClick={() => commit.findingCount > 0 && setExpanded(v => !v)}
      >
        {/* Finding indicator */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          hasCritical ? 'bg-red-500/10 border border-red-500/30' :
          hasHigh     ? 'bg-orange-500/10 border border-orange-500/30' :
          commit.findingCount > 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
          'bg-secondary/50 border border-border/50'
        }`}>
          <GitCommit className={`w-4 h-4 ${
            hasCritical ? 'text-red-400' :
            hasHigh     ? 'text-orange-400' :
            commit.findingCount > 0 ? 'text-yellow-400' :
            'text-muted-foreground'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs font-mono text-primary">{commit.shortHash}</code>
            <span className="text-sm font-medium text-foreground truncate">{commit.message}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{commit.author}</span>
            <span><Clock className="w-3 h-3 inline mr-1" />{formatDate(commit.date)}</span>
            <span>{commit.filesChanged?.length || 0} files</span>
            {commit.findingCount > 0 && (
              <span className={`font-semibold ${hasCritical ? 'text-red-400' : hasHigh ? 'text-orange-400' : 'text-yellow-400'}`}>
                {commit.findingCount} finding{commit.findingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {commit.findingCount > 0 && (
          <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        )}
      </button>

      {expanded && commit.findings.length > 0 && (
        <div className="border-t border-border/30 p-4 space-y-2">
          {commit.findings.map((f, i) => {
            const cfg = SEVERITY_CONFIG[f.severity] || SEVERITY_CONFIG.LOW;
            return (
              <div key={i} className={`p-3 rounded-lg border ${cfg.border} ${cfg.bg} flex items-start gap-3`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">{f.description || f.type}</div>
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                    <span className="font-mono">{f.file}:{f.line}</span>
                    {f.maskedValue && <span className="font-mono">{f.maskedValue}</span>}
                    {f.confidence !== undefined && <span>{f.confidence}% confidence</span>}
                  </div>
                  {f.exposureStatus === ExposureStatus.REMOVED && (
                    <div className="mt-1.5 text-[10px] text-yellow-400">
                      ⚠ Removed from current code — rotate if credential was real
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold flex-shrink-0 ${cfg.color}`}>{f.severity}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

function HistoryPageInner() {
  const { scanId } = useParams();
  const searchParams = useSearchParams();

  const [scanResult, setScanResult] = useState(null);
  const [historyResult, setHistoryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maxCommits, setMaxCommits] = useState(200);
  const [progressMsg, setProgressMsg] = useState('');

  async function doHistoryScan(scan, commits, sid) {
    if (!scan?.repository) return;
    const { owner, repo, branch } = scan.repository;
    if (!owner || !repo) {
      setError('Git history is only available for GitHub repository scans, not ZIP uploads.');
      return;
    }
    setLoading(true);
    setError(null);
    setProgressMsg('Starting history scan…');
    try {
      const currentFingerprints = (scan.findings || []).map(f => f.fingerprint).filter(Boolean);
      const res = await fetch(`/api/providers/github/${owner}/${repo}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: branch || 'HEAD', maxCommits: commits, currentFingerprints, allowlistFingerprints: [] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `History scan failed (${res.status})`);
      }
      const data = await res.json();
      setHistoryResult(data);
      sessionStorage.setItem(`repo_history_${sid}`, JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  }

  const runHistoryScan = () => doHistoryScan(scanResult, maxCommits, scanId);

  // Load base scan result + maybe auto-start history scan
  useEffect(() => {
    startTransition(() => {
      try {
        const raw = sessionStorage.getItem(`repo_scan_${scanId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setScanResult(parsed);
          if (searchParams.get('runHistory') === '1') {
            doHistoryScan(parsed, maxCommits, scanId);
          }
        }
      } catch {
        setError('Scan result not found. Please run a new scan.');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  // Load cached history if available
  useEffect(() => {
    startTransition(() => {
      try {
        const raw = sessionStorage.getItem(`repo_history_${scanId}`);
        if (raw) setHistoryResult(JSON.parse(raw));
      } catch { /* ignore */ }
    });
  }, [scanId]);

  const isGitHubRepo = scanResult?.repository?.provider === 'github';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/repositories" className="hover:text-foreground">Repositories</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/repositories/${scanId}`} className="hover:text-foreground truncate max-w-xs">
            {scanResult?.repository?.name || scanId}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">History</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-2">
          <History className="w-6 h-6 text-primary" />
          Git History Scan
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Scans commit history for secrets that may have been introduced and later removed.
        </p>

        {/* ZIP notice */}
        {!isGitHubRepo && !loading && (
          <div className="mb-8 flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-secondary/20">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-foreground mb-1">Git history not available for ZIP uploads</div>
              <div className="text-xs text-muted-foreground">
                ZIP archives do not contain Git history. Connect a GitHub repository to enable historical scanning.
              </div>
              <Link href="/repositories/github" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <GitBranch className="w-3 h-3" /> Connect GitHub
              </Link>
            </div>
          </div>
        )}

        {/* Controls — only for GitHub repos */}
        {isGitHubRepo && !historyResult && !loading && (
          <div className="mb-8 p-5 rounded-xl border border-border/60 bg-card/40 space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">Max commits to scan:</label>
              <select
                value={maxCommits}
                onChange={e => setMaxCommits(Number(e.target.value))}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {[50, 100, 200, 500].map(n => (
                  <option key={n} value={n}>{n} commits</option>
                ))}
              </select>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              More commits = longer scan time. GitHub API rate limits apply (5000 req/hr for authenticated users).
            </div>
            <Button onClick={runHistoryScan} className="gap-2">
              <History className="w-4 h-4" /> Scan Git History
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/60">
            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{progressMsg || 'Scanning commit history…'}</span>
          </div>
        )}

        {/* History results */}
        {historyResult && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Commits Scanned', value: historyResult.statistics?.commitsScanned ?? 0 },
                { label: 'Unique Secrets', value: historyResult.statistics?.totalFindings ?? 0 },
                { label: 'Active', value: historyResult.statistics?.activeFindings ?? 0, color: 'text-red-400' },
                { label: 'Removed', value: historyResult.statistics?.removedFindings ?? 0, color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl border border-border/60 bg-card/40">
                  <div className={`text-2xl font-bold font-mono ${s.color || 'text-foreground'}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Exposure lifecycles */}
            {historyResult.lifecycles?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Exposure Lifecycle
                </h2>
                <div className="space-y-2">
                  {historyResult.lifecycles.map((lc, i) => (
                    <LifecycleCard key={lc.fingerprint || i} lifecycle={lc} />
                  ))}
                </div>
              </section>
            )}

            {/* Commit timeline */}
            {historyResult.scannedCommits?.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Commit Timeline
                </h2>
                <div className="space-y-2">
                  {historyResult.scannedCommits
                    .filter(c => c.findingCount > 0)
                    .map((c, i) => <CommitRow key={c.hash || i} commit={c} />)}
                </div>
                {historyResult.scannedCommits.filter(c => c.findingCount > 0).length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No secrets found in scanned commit history.</p>
                  </div>
                )}
              </section>
            )}

            {/* Re-scan button */}
            <div className="mt-8">
              <button
                onClick={runHistoryScan}
                disabled={loading}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Re-scan history
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HistoryPageInner />
    </Suspense>
  );
}
