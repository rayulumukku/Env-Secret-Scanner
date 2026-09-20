'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, X, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [checklist, setChecklist] = useState({
    workspaceCreated: true,
    projectCreated: true,
    repoConnected: true,
    firstScanCompleted: false,
    ciProtectionEnabled: false,
    preCommitEnabled: false,
  });

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem('secretshield_checklist_dismissed');
      if (isDismissed === 'true') setDismissed(true);

      const savedChecklist = localStorage.getItem('secretshield_onboarding_progress');
      if (savedChecklist) {
        setChecklist(prev => ({ ...prev, ...JSON.parse(savedChecklist) }));
      }
    } catch { /* ignore */ }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('secretshield_checklist_dismissed', 'true');
    } catch { /* ignore */ }
  };

  const items = [
    { key: 'workspaceCreated', label: 'Workspace created', href: '/organizations', done: checklist.workspaceCreated },
    { key: 'projectCreated', label: 'Project created', href: '/projects', done: checklist.projectCreated },
    { key: 'repoConnected', label: 'Repository connected', href: '/repositories', done: checklist.repoConnected },
    { key: 'firstScanCompleted', label: 'First scan completed', href: '/scan', done: checklist.firstScanCompleted },
    { key: 'ciProtectionEnabled', label: 'CI protection enabled', href: '/docs/github-protection', done: checklist.ciProtectionEnabled },
    { key: 'preCommitEnabled', label: 'Pre-commit protection enabled', href: '/docs/scanner', done: checklist.preCommitEnabled },
  ];

  const completedCount = items.filter(i => i.done).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  // Auto-hide when 100% complete or dismissed
  if (dismissed || completedCount === items.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm transition-all animate-in fade-in">
      <div className="flex items-start justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Getting Started with SecretShield
              <span className="text-xs font-normal text-muted-foreground">({completedCount}/{items.length} completed)</span>
            </h3>
            <p className="text-xs text-muted-foreground">Follow these essential setup steps to protect your codebase.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/tour">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Take Tour
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Dismiss checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="my-3.5">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
              item.done
                ? 'bg-muted/20 border-border/40 text-muted-foreground'
                : 'bg-background border-border/80 text-foreground hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className={item.done ? 'line-through text-muted-foreground' : 'font-medium'}>
                {item.label}
              </span>
            </div>
            {!item.done && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
