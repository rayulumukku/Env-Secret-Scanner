'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from '@/components/results/SeverityBadge';
import { useScanHistory } from '@/lib/hooks/useScanHistory';
import { useToast } from '@/components/ui/use-toast';
import {
  History, Trash2, ExternalLink, Shield, Clock,
  AlertTriangle, FileCode, ChevronRight, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { history, removeFromHistory, clearHistory } = useScanHistory();
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearHistory();
    setConfirmClear(false);
    toast({ title: 'History cleared', description: 'All scan history has been deleted.' });
  };

  const handleRemove = (id) => {
    removeFromHistory(id);
    toast({ title: 'Scan removed', description: 'Removed from history.' });
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Scan History</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {history.length} scan{history.length !== 1 ? 's' : ''} · Stored locally, masked values only
              </p>
            </div>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className={cn(
                'gap-1.5 text-xs border-border/60',
                confirmClear && 'border-red-900/50 text-red-400 hover:text-red-300'
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmClear ? 'Click again to confirm' : 'Clear All'}
            </Button>
          )}
        </div>

        {/* Empty state */}
        {history.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-card/30 p-16 text-center">
            <History className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h2 className="text-base font-semibold mb-2">No scan history yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Scan history will appear here after you run your first scan.
            </p>
            <Link href="/scan">
              <Button className="gap-2">
                <Shield className="w-4 h-4" />
                Run First Scan
              </Button>
            </Link>
          </div>
        )}

        {/* History list */}
        {history.length > 0 && (
          <div className="space-y-3">
            {history.map(entry => {
              const date = new Date(entry.timestamp);
              const hasCritical = entry.stats?.critical > 0;
              const hasFindings = entry.stats?.totalFindings > 0;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border/50 bg-card/50 hover:border-border/80 transition-colors p-4"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left: info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* ID + date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{entry.id}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Stats badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground gap-1">
                          <FileCode className="w-2.5 h-2.5" />
                          {entry.stats?.filesScanned ?? 0} files
                        </Badge>

                        {hasCritical && (
                          <Badge variant="outline" className="text-[10px] border-red-900/50 text-red-400 bg-red-950/20 gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {entry.stats.critical} critical
                          </Badge>
                        )}
                        {(entry.stats?.high ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[10px] border-orange-900/50 text-orange-400 bg-orange-950/20">
                            {entry.stats.high} high
                          </Badge>
                        )}
                        {(entry.stats?.medium ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[10px] border-yellow-900/50 text-yellow-400 bg-yellow-950/20">
                            {entry.stats.medium} medium
                          </Badge>
                        )}
                        {!hasFindings && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
                            Clean
                          </Badge>
                        )}
                      </div>

                      {/* File names */}
                      {entry.fileNames?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.fileNames.slice(0, 4).map(f => (
                            <span key={f} className="text-[10px] font-mono text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                          {entry.fileNames.length > 4 && (
                            <span className="text-[10px] text-muted-foreground/40">+{entry.fileNames.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(entry.id)}
                        className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-muted-foreground"
                        aria-label="Remove from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Top findings preview */}
                  {entry.findingSummaries?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
                      {entry.findingSummaries.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <SeverityBadge severity={f.severity} showIcon={false} size="sm" />
                          <span className="text-foreground/70 font-medium">{f.name}</span>
                          <span className="text-muted-foreground font-mono">
                            {f.file}:{f.line}
                          </span>
                          <span className="masked-secret text-[10px] py-0 px-1">{f.maskedValue}</span>
                        </div>
                      ))}
                      {entry.findingSummaries.length > 3 && (
                        <p className="text-xs text-muted-foreground/50">
                          +{entry.findingSummaries.length - 3} more findings
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Privacy note */}
        <div className="mt-8 rounded-lg border border-border/30 bg-card/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>
            History is stored locally in your browser (localStorage). Only masked values and fingerprints are saved — never raw secrets.
            History is never sent to any server.
          </span>
        </div>
      </div>
    </div>
  );
}
