'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from './SeverityBadge';
import { ConfidenceMeter } from './ConfidenceMeter';
import { SourceViewer } from './SourceViewer';
import { maskSecretInLine } from '@/lib/scanner/masking';
import {
  X, Shield, AlertTriangle, CheckCircle2, EyeOff,
  Copy, FileCode, Hash, Info, Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

import { ExplainabilityCard } from './ExplainabilityCard';

/**
 * Finding detail panel — shown when a user clicks a row in the findings table.
 * NEVER shows raw secret values.
 */
export function FindingDetail({ finding, isDemo, onClose, onMarkFalsePositive, onIgnorePattern, onSmartIgnore }) {
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');

  if (!finding) return null;

  const handleCopyMasked = () => {
    navigator.clipboard.writeText(finding.maskedValue || '').then(() => {
      toast({ title: 'Masked value copied', description: 'The masked (safe) value was copied.' });
    });
  };

  // Build context lines from lineContent
  const contextLines = finding.lineContent
    ? [{ lineNo: finding.line, content: finding.lineContent, isTarget: true }]
    : [];

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border/50 bg-secondary/20">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            finding.severity === 'CRITICAL' ? 'bg-red-950/50' :
            finding.severity === 'HIGH' ? 'bg-orange-950/50' :
            finding.severity === 'MEDIUM' ? 'bg-yellow-950/50' :
            'bg-blue-950/50'
          )}>
            <AlertTriangle className={cn(
              'w-4.5 h-4.5',
              finding.severity === 'CRITICAL' ? 'text-red-400' :
              finding.severity === 'HIGH' ? 'text-orange-400' :
              finding.severity === 'MEDIUM' ? 'text-yellow-400' :
              'text-blue-400'
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground">{finding.name}</h3>
              <SeverityBadge severity={finding.severity} />
              {finding.occurrenceCount && finding.occurrenceCount > 1 && (
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  {finding.occurrenceCount} Occurrences
                </Badge>
              )}
              {isDemo && (
                <Badge variant="outline" className="text-[10px] border-amber-800/50 text-amber-400 bg-amber-950/30">
                  ⚠ DEMO — NOT REAL
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="font-mono">{finding.file || 'unknown'}:{finding.line}</span>
              <span>{finding.category}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Close detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {['overview', 'explainability', 'context', 'remediation'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-xs font-medium capitalize transition-colors',
              tab === t
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Description */}
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>
            </div>

            {/* Masked value */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Detected Value (Masked)
              </label>
              <div className="flex items-center gap-2">
                <code className="masked-secret flex-1 text-sm py-1.5">
                  {finding.maskedValue || '••••••••'}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyMasked}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <ConfidenceMeter confidence={finding.confidence} />
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Fingerprint</p>
                <p className="text-xs font-mono text-muted-foreground truncate">
                  {finding.fingerprint || '—'}
                </p>
              </div>
            </div>

            {/* Occurrences breakdown if aggregated */}
            {finding.occurrences && finding.occurrences.length > 1 && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 space-y-2">
                <span className="text-xs font-semibold text-foreground">
                  Grouped Occurrences ({finding.occurrences.length})
                </span>
                <div className="space-y-1">
                  {finding.occurrences.map((occ, idx) => (
                    <div key={idx} className="text-xs flex items-center justify-between text-muted-foreground font-mono">
                      <span>{occ.file}:{occ.line}</span>
                      <span className="text-primary">{occ.maskedValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'explainability' && (
          <ExplainabilityCard
            finding={finding}
            onSmartIgnore={onSmartIgnore || onMarkFalsePositive}
          />
        )}

        {tab === 'context' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Source context around line {finding.line}. The secret value is masked.
            </p>
            <SourceViewer
              lines={contextLines}
              filename={finding.file}
            />
          </div>
        )}

        {tab === 'remediation' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Wrench className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Recommended Action</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {finding.remediation || 'Move this value to environment variables and rotate the credential.'}
                </p>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
              <p className="text-xs font-mono text-muted-foreground"># Move to .env file</p>
              <p className="text-xs font-mono text-primary">
                {finding.type?.replace(/_/g, '_').toUpperCase()}=your_value_here
              </p>
              <p className="text-xs font-mono text-muted-foreground"># Then access via process.env</p>
              <p className="text-xs font-mono text-foreground/70">
                const key = process.env.{finding.type?.replace(/_/g, '_')};
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-border/30 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkFalsePositive}
          className="gap-1.5 text-xs border-border/50 text-muted-foreground hover:text-foreground"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          False Positive
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onIgnorePattern}
          className="gap-1.5 text-xs border-border/50 text-muted-foreground hover:text-foreground"
        >
          <EyeOff className="w-3.5 h-3.5" />
          Ignore Pattern
        </Button>
      </div>
    </div>
  );
}
