'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import {
  FolderArchive, Plus, Shield, Clock, FileCode2,
  AlertTriangle, ChevronRight, Trash2, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEVERITY_COLORS = {
  CRITICAL: 'text-red-400',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-blue-400',
};

const RISK_COLORS = [
  [75, 'text-red-400 bg-red-500/10 border-red-500/30'],
  [50, 'text-orange-400 bg-orange-500/10 border-orange-500/30'],
  [25, 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'],
  [0,  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'],
];

function getRiskStyle(score) {
  for (const [threshold, style] of RISK_COLORS) {
    if (score >= threshold) return style;
  }
  return RISK_COLORS[RISK_COLORS.length - 1][1];
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function RepositoriesPage() {
  const [scans, setScans] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    startTransition(() => {
      try {
        const raw = localStorage.getItem('secretshield_repo_history');
        if (raw) setScans(JSON.parse(raw));
      } catch {
        setScans([]);
      }
    });
  }, []);

  const handleDelete = (scanId) => {
    const updated = scans.filter(s => s.scanId !== scanId);
    setScans(updated);
    localStorage.setItem('secretshield_repo_history', JSON.stringify(updated));
    sessionStorage.removeItem(`repo_scan_${scanId}`);
  };

  const filtered = scans.filter(s =>
    !query ||
    s.repository?.name?.toLowerCase().includes(query.toLowerCase()) ||
    s.scanId.includes(query)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Repository Scans</h1>
            <p className="text-muted-foreground mt-1">
              {scans.length === 0 ? 'No scans yet' : `${scans.length} scan${scans.length === 1 ? '' : 's'} in history`}
            </p>
          </div>
          <Link href="/repositories/new">
            <Button className="gap-2 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              New Scan
            </Button>
          </Link>
        </div>

        {/* Empty state */}
        {scans.length === 0 && (
          <div className="text-center py-24 px-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mx-auto mb-6">
              <FolderArchive className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No repository scans yet</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
              Upload a ZIP archive of your repository to scan for exposed API keys,
              tokens, passwords, and other secrets.
            </p>
            <Link href="/repositories/new">
              <Button className="gap-2 font-semibold">
                <Plus className="w-4 h-4" />
                Scan Your First Repository
              </Button>
            </Link>
          </div>
        )}

        {/* Search */}
        {scans.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search repositories…"
                className="w-full pl-9 pr-4 py-2 bg-secondary/40 border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* Scan list */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((scan) => {
              const stats = scan.statistics;
              const riskScore = stats?.riskScore ?? 0;
              const riskStyle = getRiskStyle(riskScore);
              const hasFindings = (stats?.total ?? 0) > 0;

              return (
                <div
                  key={scan.scanId}
                  className="group rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 hover:border-border transition-all duration-150"
                >
                  <Link href={`/repositories/${scan.scanId}`} className="block p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center flex-shrink-0">
                          <FolderArchive className="w-5 h-5 text-muted-foreground" />
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {scan.repository?.name || 'Unknown'}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(scan.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCode2 className="w-3 h-3" />
                              {stats?.filesScanned ?? 0} files
                            </span>
                            <span>{formatDuration(scan.duration ?? 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: risk score + severity breakdown */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Severity pills */}
                        <div className="hidden sm:flex items-center gap-2 text-xs">
                          {stats?.CRITICAL > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                              {stats.CRITICAL} CRIT
                            </span>
                          )}
                          {stats?.HIGH > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                              {stats.HIGH} HIGH
                            </span>
                          )}
                          {stats?.MEDIUM > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-semibold">
                              {stats.MEDIUM} MED
                            </span>
                          )}
                          {!hasFindings && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              Clean
                            </span>
                          )}
                        </div>

                        {/* Risk score */}
                        <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${riskStyle}`}>
                          {hasFindings ? `Risk ${riskScore}` : '✓ Secure'}
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </Link>

                  {/* Delete action */}
                  <div className="border-t border-border/30 px-5 py-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">{scan.scanId}</span>
                    <button
                      onClick={() => handleDelete(scan.scanId)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete scan record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No results from search */}
        {scans.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No scans match &ldquo;{query}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}
