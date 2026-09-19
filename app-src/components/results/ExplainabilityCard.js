'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HelpCircle, CheckCircle2, AlertTriangle, Copy, Check,
  Code2, ShieldAlert, Sparkles, Filter, ChevronDown, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExplainabilityCard({ finding = {}, onSmartIgnore = null }) {
  const [copied, setCopied] = useState(false);
  const [showIgnoreMenu, setShowIgnoreMenu] = useState(false);

  const whyDetected = finding.whyDetected || [
    `Matches ${finding.type || 'credential'} format specifications`,
    `Found in ${finding.file || 'source code'}`,
  ];

  const quickFix = finding.quickFix || {
    suggestedEnvVar: 'SECRET_KEY',
    beforeSnippet: `const SECRET_KEY = "${finding.maskedValue || '••••••••'}";`,
    afterSnippet: `const SECRET_KEY = process.env.SECRET_KEY;`,
    explanation: 'Move hardcoded secret to process.env',
  };

  const copySnippet = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Detection Intelligence & Explainability</h3>
        </div>
        <div className="flex items-center gap-2">
          {finding.language && (
            <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30 text-primary">
              {finding.language}
            </Badge>
          )}
          {finding.gitIgnoreWarning && (
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 gap-1 flex items-center">
              <AlertTriangle className="w-2.5 h-2.5" />
              Not in .gitignore
            </Badge>
          )}
        </div>
      </div>

      {/* Why was this detected? */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Why this was detected
        </h4>
        <div className="grid gap-1.5 pl-1">
          {whyDetected.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signals Breakdown */}
      {finding.signals && finding.signals.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Signal Analysis ({finding.confidence || 50}% Confidence)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {finding.signals.map((sig, idx) => (
              <span
                key={idx}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-md border font-medium flex items-center gap-1',
                  sig.positive
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                )}
              >
                {sig.positive ? '+' : ''}{sig.score} {sig.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Developer Quick Fix */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-primary" />
            Developer Quick Fix
          </h4>
          <span className="text-[10px] text-muted-foreground font-mono">Placeholder Only</span>
        </div>

        <p className="text-xs text-muted-foreground">{quickFix.explanation}</p>

        <div className="rounded-lg border border-border/60 bg-secondary/50 p-3 relative group">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/30 text-[10px] font-mono text-muted-foreground">
            <span>Recommended Migration:</span>
            <button
              onClick={() => copySnippet(quickFix.afterSnippet)}
              className="flex items-center gap-1 text-primary hover:underline text-[11px]"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="text-xs font-mono text-foreground/90 overflow-x-auto whitespace-pre">
            {quickFix.afterSnippet}
          </pre>
        </div>
      </div>

      {/* Smart Ignore Options Bar */}
      {onSmartIgnore && (
        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">False Positive or Intentional?</span>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowIgnoreMenu(!showIgnoreMenu)}
            >
              <Filter className="w-3 h-3 text-muted-foreground" />
              Smart Ignore
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>

            {showIgnoreMenu && (
              <div className="absolute right-0 bottom-8 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg z-20 space-y-1">
                <button
                  onClick={() => { onSmartIgnore('OCCURRENCE', finding.id); setShowIgnoreMenu(false); }}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded hover:bg-secondary text-foreground flex items-center justify-between"
                >
                  <span>Ignore this occurrence</span>
                </button>
                <button
                  onClick={() => { onSmartIgnore('FILE', finding.file); setShowIgnoreMenu(false); }}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded hover:bg-secondary text-foreground flex items-center justify-between"
                >
                  <span>Ignore this file ({finding.file?.split('/').pop()})</span>
                </button>
                <button
                  onClick={() => { onSmartIgnore('FINGERPRINT', finding.fingerprint); setShowIgnoreMenu(false); }}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded hover:bg-secondary text-foreground flex items-center justify-between"
                >
                  <span>Ignore this secret fingerprint</span>
                </button>
                <button
                  onClick={() => { onSmartIgnore('RULE', finding.ruleId); setShowIgnoreMenu(false); }}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded hover:bg-secondary text-foreground flex items-center justify-between text-amber-400"
                >
                  <span>Ignore rule ({finding.ruleId})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
